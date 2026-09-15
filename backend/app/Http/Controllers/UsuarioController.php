<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Rules\CnsValido;
use App\Rules\CpfValido;
use App\Services\SituacaoVacinal;
use App\Support\Documento;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class UsuarioController extends Controller
{
    public function cadastrar(Request $request): JsonResponse
    {
        $this->normalizarDocumentos($request);

        $dados = $request->validate([
            'nome' => ['required', 'string', 'max:255'],
            'cpf' => ['required', 'digits:11', new CpfValido, 'unique:users,cpf'],
            'cns' => ['required', 'digits:15', new CnsValido, 'unique:users,cns'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'email_confirmation' => ['required', 'same:email'],
            'cidade' => ['required', 'string', 'max:255'],
            'dataNascimento' => ['nullable', 'date', 'before:today'],
            'senha' => ['required', 'string', 'min:8', 'regex:/[A-Za-z]/', 'regex:/[0-9]/', 'confirmed'],
            'aceiteTermos' => ['accepted'],
            'aceitePrivacidade' => ['accepted'],
        ], [
            'nome.required' => 'Informe o nome completo.',
            'cpf.required' => 'Informe o CPF.',
            'cpf.digits' => 'O CPF deve conter exatamente 11 números.',
            'cpf.unique' => 'Este CPF já está cadastrado.',
            'cns.required' => 'Informe o Cartão Nacional de Saúde (CNS).',
            'cns.digits' => 'O CNS deve conter exatamente 15 números.',
            'cns.unique' => 'Este CNS já está cadastrado.',
            'email.required' => 'Informe o e-mail.',
            'email.email' => 'Informe um e-mail válido.',
            'email.unique' => 'Este e-mail já está cadastrado.',
            'email_confirmation.required' => 'Confirme o e-mail.',
            'email_confirmation.same' => 'Os e-mails digitados não coincidem.',
            'cidade.required' => 'Informe a cidade.',
            'senha.required' => 'Informe uma senha.',
            'senha.min' => 'A senha deve ter pelo menos 8 caracteres.',
            'senha.regex' => 'A senha deve conter letras e números.',
            'senha.confirmed' => 'As senhas não coincidem.',
            'aceiteTermos.accepted' => 'É necessário aceitar os termos de uso.',
            'aceitePrivacidade.accepted' => 'É necessário aceitar a política de privacidade.',
        ]);

        try {
            $usuario = User::create([
                'nome' => $dados['nome'],
                'cpf' => $dados['cpf'],
                'cns' => $dados['cns'],
                'email' => $dados['email'],
                'cidade' => $dados['cidade'],
                'senha' => $dados['senha'],
                'data_nascimento' => $dados['dataNascimento'] ?? null,
                'termos_aceitos_em' => now(),
                'privacidade_aceita_em' => now(),
                'termos_versao' => Documento::TERMOS_VERSAO,
                'privacidade_versao' => Documento::PRIVACIDADE_VERSAO,
            ]);
        } catch (QueryException $e) {
            report($e);

            return response()->json(['sucesso' => false, 'mensagem' => 'Não foi possível salvar o cadastro no banco de dados.'], 500);
        }

        $tokenEmail = hash('sha256', Str::random(40));
        DB::table('email_confirmations')->insert([
            'usuario_id' => $usuario->id,
            'token' => $tokenEmail,
            'expires_at' => now()->addDay(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->enviarEmail(
            $usuario->email,
            'Confirme seu e-mail no EasyVacc',
            "Olá, {$usuario->nome}. Confirme seu e-mail no EasyVacc com o código: {$tokenEmail}"
        );

        return response()->json([
            'sucesso' => true,
            'mensagem' => 'Conta criada. Confirme seu e-mail para concluir o cadastro.',
            'dados' => $this->formatar($usuario),
            'confirmacaoEmail' => config('mail.default') === 'log' ? $tokenEmail : null,
        ], 201);
    }

    public function confirmarEmail(Request $request): JsonResponse
    {
        $dados = $request->validate([
            'token' => ['required', 'string'],
        ]);

        $registro = DB::table('email_confirmations')
            ->where('token', $dados['token'])
            ->where('expires_at', '>', now())
            ->first();

        if (! $registro) {
            return response()->json(['sucesso' => false, 'mensagem' => 'Código de confirmação inválido ou expirado.'], 422);
        }

        User::where('id', $registro->usuario_id)->update(['email_verified_at' => now()]);
        DB::table('email_confirmations')->where('id', $registro->id)->delete();

        return response()->json(['sucesso' => true, 'mensagem' => 'E-mail confirmado com sucesso.']);
    }

    public function login(Request $request): JsonResponse
    {
        $this->normalizarDocumentos($request);

        $chave = 'login:'.$request->ip().':'.Documento::somenteDigitos((string) $request->input('cpf'));
        if (RateLimiter::tooManyAttempts($chave, 5)) {
            return response()->json([
                'sucesso' => false,
                'mensagem' => 'Muitas tentativas de acesso. Aguarde alguns minutos e tente novamente.',
            ], 429);
        }

        try {
            $dados = $request->validate([
                'cpf' => ['required', 'digits:11', new CpfValido],
                'senha' => ['required', 'string'],
            ], [
                'cpf.required' => 'Informe o CPF.',
                'cpf.digits' => 'Informe um CPF válido.',
            ]);
        } catch (ValidationException $e) {
            RateLimiter::hit($chave, 900);
            throw $e;
        }

        $usuario = User::where('cpf', $dados['cpf'])->first();
        if (! $usuario || ! Hash::check($dados['senha'], $usuario->senha)) {
            RateLimiter::hit($chave, 900);

            return response()->json([
                'sucesso' => false,
                'mensagem' => 'Não foi possível entrar. Verifique os dados e tente novamente.',
            ], 401);
        }

        RateLimiter::clear($chave);

        return response()->json(['sucesso' => true, 'mensagem' => 'Login efetuado.', 'dados' => $this->formatar($usuario)]);
    }

    public function recuperarSenha(Request $request): JsonResponse
    {
        $this->normalizarDocumentos($request);

        $chave = 'recupera:'.$request->ip();
        if (RateLimiter::tooManyAttempts($chave, 8)) {
            return response()->json([
                'sucesso' => false,
                'mensagem' => 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
            ], 429);
        }
        RateLimiter::hit($chave, 900);

        $dados = $request->validate([
            'cpf' => ['required', 'digits:11', new CpfValido],
            'email' => ['required', 'email'],
        ], [
            'cpf.digits' => 'Informe um CPF válido.',
            'email.email' => 'Informe um e-mail válido.',
        ]);

        $codigoExibido = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $usuario = User::where('cpf', $dados['cpf'])->where('email', $dados['email'])->first();

        if ($usuario) {
            $codigoExibido = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            Cache::put('recupera-senha:'.$usuario->cpf, Hash::make($codigoExibido), now()->addMinutes(15));
            $this->enviarEmail(
                $usuario->email,
                'Recuperação de senha EasyVacc',
                "Seu código de recuperação é {$codigoExibido}. Ele expira em 15 minutos."
            );
        }

        return response()->json([
            'sucesso' => true,
            'mensagem' => 'Se os dados estiverem corretos, enviamos um código para o e-mail informado.',
            'codigoDemonstracao' => config('mail.default') === 'log' ? $codigoExibido : null,
        ]);
    }

    public function redefinirSenha(Request $request): JsonResponse
    {
        $this->normalizarDocumentos($request);

        $dados = $request->validate([
            'cpf' => ['required', 'digits:11', new CpfValido],
            'codigo' => ['required', 'digits:6'],
            'senha' => ['required', 'string', 'min:8', 'regex:/[A-Za-z]/', 'regex:/[0-9]/', 'confirmed'],
        ], [
            'codigo.digits' => 'Informe o código de 6 dígitos.',
            'senha.min' => 'A senha deve ter pelo menos 8 caracteres.',
            'senha.regex' => 'A senha deve conter letras e números.',
            'senha.confirmed' => 'As senhas não coincidem.',
        ]);

        $usuario = User::where('cpf', $dados['cpf'])->first();
        $hash = $usuario ? Cache::get('recupera-senha:'.$usuario->cpf) : null;

        if (! $usuario || ! $hash || ! Hash::check($dados['codigo'], $hash)) {
            return response()->json([
                'sucesso' => false,
                'mensagem' => 'Não foi possível redefinir a senha. Verifique os dados e tente novamente.',
            ], 422);
        }

        $usuario->senha = $dados['senha'];
        $usuario->save();
        Cache::forget('recupera-senha:'.$usuario->cpf);

        return response()->json(['sucesso' => true, 'mensagem' => 'Senha atualizada. Faça login com a nova senha.']);
    }

    public function mostrar(User $usuario): JsonResponse
    {
        return response()->json(['sucesso' => true, 'dados' => $this->formatar($usuario)]);
    }

    public function porCpf(string $cpf): JsonResponse
    {
        $usuario = User::where('cpf', Documento::somenteDigitos($cpf))->first();

        return $usuario
            ? response()->json(['sucesso' => true, 'dados' => $this->formatar($usuario)])
            : response()->json(['sucesso' => false, 'mensagem' => 'Usuário não encontrado.'], 404);
    }

    public function situacaoVacinal(User $usuario, Request $request, SituacaoVacinal $servico): JsonResponse
    {
        $tipo = $request->query('pessoa', 'titular') === 'dependente' ? 'dependente' : 'titular';
        $dependenteId = $request->query('dependenteId') ? (int) $request->query('dependenteId') : null;

        return response()->json([
            'sucesso' => true,
            'dados' => $servico->calcular($usuario, $tipo, $dependenteId),
        ]);
    }

    private function normalizarDocumentos(Request $request): void
    {
        $request->merge([
            'cpf' => Documento::somenteDigitos((string) $request->input('cpf', '')),
            'cns' => Documento::somenteDigitos((string) $request->input('cns', '')),
        ]);
    }

    private function enviarEmail(string $destinatario, string $assunto, string $texto): void
    {
        try {
            Mail::raw($texto, function ($message) use ($destinatario, $assunto) {
                $message->to($destinatario)->subject($assunto);
            });
        } catch (\Throwable $e) {
            report($e);
        }
    }

    private function formatar(User $u): array
    {
        return [
            'id' => $u->id,
            'nome' => $u->nome,
            'cpf' => $u->cpf,
            'cns' => $u->cns,
            'email' => $u->email,
            'emailConfirmado' => (bool) $u->email_verified_at,
            'cidade' => $u->cidade,
            'telefone' => $u->telefone,
            'dataNascimento' => $u->data_nascimento,
            'endereco' => $u->endereco,
            'tipoSanguineo' => $u->tipo_sanguineo,
            'alergias' => $u->alergias,
            'contatoEmergencia' => $u->contato_emergencia,
            'telefoneEmergencia' => $u->telefone_emergencia,
            'termosAceitosEm' => optional($u->termos_aceitos_em)?->toIso8601String(),
            'privacidadeAceitaEm' => optional($u->privacidade_aceita_em)?->toIso8601String(),
            'termosVersao' => $u->termos_versao,
            'privacidadeVersao' => $u->privacidade_versao,
        ];
    }
}
