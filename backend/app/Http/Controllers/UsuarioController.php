<?php
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UsuarioController extends Controller
{
    public function cadastrar(Request $request): JsonResponse
    {
        $dados = $request->validate([
            'nome' => ['required', 'string', 'max:255'], 'cpf' => ['required', 'digits:11', 'unique:users,cpf'],
            'cns' => ['required', 'digits:15', 'unique:users,cns'], 'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'cidade' => ['required', 'string', 'max:255'], 'senha' => ['required', 'string', 'min:6'],
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
            'cidade.required' => 'Informe a cidade.',
            'senha.required' => 'Informe uma senha.',
            'senha.min' => 'A senha deve ter pelo menos 6 caracteres.',
        ]);

        try {
            $usuario = User::create($dados);
        } catch (QueryException $e) {
            report($e);
            return response()->json(['sucesso' => false, 'mensagem' => 'Não foi possível salvar o cadastro no banco de dados.'], 500);
        }
        return response()->json(['sucesso' => true, 'mensagem' => 'Usuário cadastrado com sucesso.', 'dados' => $this->formatar($usuario)], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $dados = $request->validate(['cpf' => ['required', 'digits:11'], 'senha' => ['required', 'string']]);
        $usuario = User::where('cpf', $dados['cpf'])->first();
        if (!$usuario || !Hash::check($dados['senha'], $usuario->senha)) {
            return response()->json(['sucesso' => false, 'mensagem' => 'CPF ou senha incorretos.'], 401);
        }
        return response()->json(['sucesso' => true, 'mensagem' => 'Login efetuado.', 'dados' => $this->formatar($usuario)]);
    }

    public function mostrar(User $usuario): JsonResponse
    {
        return response()->json(['sucesso' => true, 'dados' => $this->formatar($usuario)]);
    }

    public function porCpf(string $cpf): JsonResponse
    {
        $usuario = User::where('cpf', $cpf)->first();
        return $usuario
            ? response()->json(['sucesso' => true, 'dados' => $this->formatar($usuario)])
            : response()->json(['sucesso' => false, 'mensagem' => 'Usuário não encontrado.'], 404);
    }

    private function formatar(User $u): array
    {
        return ['id' => $u->id, 'nome' => $u->nome, 'cpf' => $u->cpf, 'cns' => $u->cns, 'email' => $u->email,
            'cidade' => $u->cidade, 'telefone' => $u->telefone, 'dataNascimento' => $u->data_nascimento,
            'endereco' => $u->endereco, 'tipoSanguineo' => $u->tipo_sanguineo, 'alergias' => $u->alergias,
            'contatoEmergencia' => $u->contato_emergencia, 'telefoneEmergencia' => $u->telefone_emergencia];
    }
}
