<?php
namespace App\Http\Controllers;

use App\Models\{Campanha, Dependente, Posto, Vacina};
use App\Services\SituacaoDose;
use App\Services\SituacaoVacinal;
use Carbon\Carbon;
use Illuminate\Http\{JsonResponse, Request};
use Illuminate\Support\Facades\Schema;

class ApiController extends Controller
{
    public function vacinas(int $usuarioId, Request $request, SituacaoVacinal $situacao): JsonResponse
    {
        $pessoa = $request->query('pessoa', 'titular') === 'dependente' ? 'dependente' : 'titular';
        $dependenteId = $request->query('dependenteId') ? (int) $request->query('dependenteId') : null;
        $hoje = Carbon::today();
        $vacinas = $situacao->vacinasDoPerfil($usuarioId, $pessoa, $dependenteId);
        $ultima = $vacinas->sortByDesc('updated_at')->first();

        return response()->json([
            'sucesso' => true,
            'origem' => 'cadastro_manual',
            'origemRotulo' => 'Mesma base do dashboard e do certificado (cadastro manual EasyVacc).',
            'sincronizadoEm' => optional($ultima?->updated_at)?->toIso8601String(),
            'dados' => $vacinas->map(fn ($v) => SituacaoDose::formatar($v, $hoje))->values(),
        ]);
    }

    public function salvarVacina(Request $request): JsonResponse
    {
        $regras = [
            'usuarioId' => ['required', 'integer', 'exists:users,id'],
            'nome' => ['required', 'string', 'max:255'],
            'dataAplicacao' => ['required', 'date'],
            'lote' => ['nullable', 'string'],
            'fabricante' => ['nullable', 'string'],
            'proximaDose' => ['nullable', 'date'],
            'posto' => ['nullable', 'string', 'max:255'],
            'profissional' => ['nullable', 'string', 'max:255'],
            'dependenteId' => ['nullable', 'integer'],
            'aplicavel' => ['nullable', 'boolean'],
        ];
        $d = $request->validate($regras);
        $payload = [
            'usuario_id' => $d['usuarioId'],
            'nome' => $d['nome'],
            'data_aplicacao' => $d['dataAplicacao'],
            'lote' => $d['lote'] ?? null,
            'fabricante' => $d['fabricante'] ?? null,
            'proxima_dose' => $d['proximaDose'] ?? null,
        ];
        if (Schema::hasColumn('vacinas', 'posto')) {
            $payload['posto'] = $d['posto'] ?? null;
            $payload['profissional'] = $d['profissional'] ?? null;
            $payload['dependente_id'] = $d['dependenteId'] ?? null;
            $payload['aplicavel'] = $d['aplicavel'] ?? true;
        }
        $v = Vacina::create($payload);

        return response()->json(['sucesso' => true, 'mensagem' => 'Vacina registrada.', 'dados' => SituacaoDose::formatar($v, Carbon::today())], 201);
    }

    public function dependentes(int $usuarioId): JsonResponse
    {
        $dados = Dependente::where('usuario_id', $usuarioId)->get()->map(fn ($d) => [
            'id' => $d->id, 
            'nome' => $d->nome, 
            'parentesco' => $d->parentesco, 
            'cns' => $d->cns ?? null,
            'dataNascimento' => $d->data_nascimento
        ]);
        return response()->json(['sucesso' => true, 'dados' => $dados]);
    }

    public function salvarDependente(Request $request): JsonResponse
    {
        $d = $request->validate([
            'usuarioId' => ['required', 'integer', 'exists:users,id'], 
            'nome' => ['required', 'string', 'max:255'], 
            'parentesco' => ['required', 'string', 'max:100'], 
            'cns' => ['nullable', 'string', 'size:15'], // Validação rigorosa: P2 (15 dígitos)
            'dataNascimento' => ['required', 'date', 'before_or_equal:today'] // Validação rigorosa: P2 (não futura)
        ]);

        $dep = Dependente::create([
            'usuario_id' => $d['usuarioId'], 
            'nome' => $d['nome'], 
            'parentesco' => $d['parentesco'], 
            'cns' => $d['cns'] ?? null,
            'data_nascimento' => $d['dataNascimento']
        ]);

        return response()->json([
            'sucesso' => true, 
            'mensagem' => 'Dependente cadastrado com sucesso.', 
            'dados' => $dep
        ], 201);
    }

    public function excluirDependente(int $id): JsonResponse
    {
        $dependente = Dependente::find($id);

        if (!$dependente) {
            return response()->json([
                'sucesso' => false,
                'mensagem' => 'Dependente não encontrado.'
            ], 404);
        }

        $dependente->delete();

        return response()->json([
            'sucesso' => true,
            'mensagem' => 'Dependente removido com sucesso do sistema.'
        ]);
    }

    public function postos(): JsonResponse
    {
        $dados = Posto::all()->map(fn ($p) => ['id' => $p->id, 'nome' => $p->nome, 'endereco' => $p->endereco, 'horarioFuncionamento' => $p->horario_funcionamento, 'telefone' => $p->telefone, 'aberto' => $p->aberto]);
        return response()->json(['sucesso' => true, 'dados' => $dados]);
    }

    public function campanhas(): JsonResponse
    {
        $dados = Campanha::all()->map(fn ($c) => ['id' => $c->id, 'titulo' => $c->titulo, 'descricao' => $c->descricao, 'dataInicio' => optional($c->data_inicio)->format('d/m/Y'), 'dataFim' => optional($c->data_fim)->format('d/m/Y'), 'status' => $c->status]);
        return response()->json(['sucesso' => true, 'dados' => $dados]);
    }

    public function notificacoes(int $usuarioId): JsonResponse
    {
        $dados = [['id' => 1, 'titulo' => 'Bem-vindo ao EasyVacc', 'mensagem' => 'Sua caderneta digital está pronta.', 'lida' => true]];
        foreach (Vacina::where('usuario_id', $usuarioId)->whereNotNull('proxima_dose')->get() as $v) {
            $dados[] = ['id' => $v->id + 1, 'titulo' => 'Próxima dose', 'mensagem' => "A próxima dose de {$v->nome} está prevista para {$v->proxima_dose}.", 'lida' => false];
        }
        return response()->json(['sucesso' => true, 'dados' => $dados]);
    }
}