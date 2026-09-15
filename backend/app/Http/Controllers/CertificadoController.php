<?php

namespace App\Http\Controllers;

use App\Models\Certificado;
use App\Models\Dependente;
use App\Models\User;
use App\Services\SituacaoDose;
use App\Services\SituacaoVacinal;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CertificadoController extends Controller
{
    public const VERSAO = '2026-09-15';

    public function emitir(Request $request, SituacaoVacinal $situacao): JsonResponse
    {
        $dados = $request->validate([
            'usuarioId' => ['required', 'integer', 'exists:users,id'],
            'pessoa' => ['nullable', 'in:titular,dependente'],
            'dependenteId' => ['nullable', 'integer'],
            'vacinaIds' => ['nullable', 'array'],
            'vacinaIds.*' => ['integer'],
            'declaracaoSemRegistros' => ['sometimes', 'boolean'],
        ]);

        $usuario = User::findOrFail($dados['usuarioId']);
        $pessoaTipo = ($dados['pessoa'] ?? 'titular') === 'dependente' ? 'dependente' : 'titular';
        $dependente = $pessoaTipo === 'dependente'
            ? Dependente::where('usuario_id', $usuario->id)->find($dados['dependenteId'] ?? 0)
            : null;

        if ($pessoaTipo === 'dependente' && ! $dependente) {
            return response()->json(['sucesso' => false, 'mensagem' => 'Dependente não encontrado.'], 404);
        }

        $todas = $situacao->vacinasDoPerfil($usuario->id, $pessoaTipo, $dependente?->id);
        $ids = collect($dados['vacinaIds'] ?? []);
        $selecionadas = $ids->isEmpty()
            ? $todas
            : $todas->whereIn('id', $ids->all())->values();

        $declaracao = (bool) ($dados['declaracaoSemRegistros'] ?? false);
        if ($selecionadas->isEmpty() && ! $declaracao) {
            return response()->json([
                'sucesso' => false,
                'mensagem' => 'Não é possível emitir comprovante sem vacinas. Marque a declaração de ausência de registros se for isso que deseja.',
            ], 422);
        }

        $hoje = Carbon::today();
        $registros = $selecionadas->map(fn ($v) => SituacaoDose::formatar($v, $hoje))->values()->all();
        $pessoaNome = $dependente?->nome ?? $usuario->nome;
        $codigo = strtoupper(Str::random(12));
        $payload = [
            'codigo' => $codigo,
            'versao' => self::VERSAO,
            'tipo' => $selecionadas->isEmpty() ? 'declaracao_sem_registros' : 'comprovante',
            'oficial' => false,
            'pessoa' => [
                'tipo' => $pessoaTipo,
                'id' => $dependente?->id ?? $usuario->id,
                'nome' => $pessoaNome,
            ],
            'titular' => [
                'nome' => $usuario->nome,
                'cpfMascarado' => $this->mascararCpf((string) $usuario->cpf),
                'cnsMascarado' => $this->mascararCns((string) $usuario->cns),
            ],
            'registros' => $registros,
            'origem' => 'Cadastro manual no EasyVacc. Documento não oficial do Ministério da Saúde.',
        ];
        $hash = hash('sha256', json_encode($this->canonico($payload), JSON_UNESCAPED_UNICODE));
        $payload['hash'] = $hash;
        $payload['emitidoEm'] = now()->toIso8601String();

        $certificado = Certificado::create([
            'codigo' => $codigo,
            'usuario_id' => $usuario->id,
            'pessoa_tipo' => $pessoaTipo,
            'pessoa_id' => $dependente?->id ?? $usuario->id,
            'pessoa_nome' => $pessoaNome,
            'tipo' => $payload['tipo'],
            'versao' => self::VERSAO,
            'origem' => $payload['origem'],
            'payload_hash' => $hash,
            'payload' => $payload,
            'emitido_em' => now(),
        ]);

        return response()->json(['sucesso' => true, 'dados' => $this->publico($certificado)], 201);
    }

    public function mostrar(string $codigo): JsonResponse
    {
        $certificado = Certificado::where('codigo', strtoupper($codigo))->first();
        if (! $certificado) {
            return response()->json(['sucesso' => false, 'mensagem' => 'Código de validação não encontrado.'], 404);
        }

        $recalculado = hash('sha256', json_encode($this->canonico($certificado->payload), JSON_UNESCAPED_UNICODE));
        $integro = hash_equals($certificado->payload_hash, $recalculado)
            && hash_equals($certificado->payload_hash, (string) ($certificado->payload['hash'] ?? ''));

        return response()->json([
            'sucesso' => true,
            'dados' => array_merge($this->publico($certificado), [
                'integro' => $integro,
                'mensagemIntegridade' => $integro
                    ? 'Os registros conferem com a emissão original.'
                    : 'A verificação falhou: o conteúdo armazenado não confere com o identificador. O documento pode ter sido alterado.',
            ]),
        ]);
    }

    private function publico(Certificado $certificado): array
    {
        return [
            'codigo' => $certificado->codigo,
            'hash' => $certificado->payload_hash,
            'versao' => $certificado->versao,
            'tipo' => $certificado->tipo,
            'oficial' => false,
            'origem' => $certificado->origem,
            'emitidoEm' => optional($certificado->emitido_em)?->toIso8601String(),
            'payload' => $certificado->payload,
        ];
    }

    private function canonico(array $payload): array
    {
        $copia = $payload;
        unset($copia['hash'], $copia['emitidoEm']);
        $registros = $copia['registros'] ?? [];
        usort($registros, fn ($a, $b) => ($a['id'] ?? 0) <=> ($b['id'] ?? 0));
        $copia['registros'] = $registros;

        return $copia;
    }

    private function mascararCpf(string $cpf): string
    {
        $d = preg_replace('/\D/', '', $cpf) ?? '';
        if (strlen($d) !== 11) {
            return 'Não informado';
        }

        return substr($d, 0, 3).'.***.***-'.substr($d, 9);
    }

    private function mascararCns(string $cns): string
    {
        $d = preg_replace('/\D/', '', $cns) ?? '';
        if (strlen($d) !== 15) {
            return 'Não informado';
        }

        return substr($d, 0, 3).' '.substr($d, 3, 4).' **** '.substr($d, 11);
    }
}
