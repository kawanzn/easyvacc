<?php
namespace App\Http\Controllers;

use App\Models\{Campanha, Dependente, Posto, Vacina};
use Illuminate\Http\{JsonResponse, Request};

class ApiController extends Controller
{
    public function vacinas(int $usuarioId): JsonResponse
    {
        $dados = Vacina::where('usuario_id', $usuarioId)->latest('data_aplicacao')->get()->map(fn ($v) => ['id' => $v->id, 'nome' => $v->nome, 'dataAplicacao' => $v->data_aplicacao, 'lote' => $v->lote, 'fabricante' => $v->fabricante, 'proximaDose' => $v->proxima_dose]);
        return response()->json(['sucesso' => true, 'dados' => $dados]);
    }
    public function salvarVacina(Request $request): JsonResponse
    {
        $d = $request->validate(['usuarioId' => ['required', 'integer', 'exists:users,id'], 'nome' => ['required', 'string', 'max:255'], 'dataAplicacao' => ['required', 'date'], 'lote' => ['nullable', 'string'], 'fabricante' => ['nullable', 'string'], 'proximaDose' => ['nullable', 'date']]);
        $v = Vacina::create(['usuario_id' => $d['usuarioId'], 'nome' => $d['nome'], 'data_aplicacao' => $d['dataAplicacao'], 'lote' => $d['lote'] ?? null, 'fabricante' => $d['fabricante'] ?? null, 'proxima_dose' => $d['proximaDose'] ?? null]);
        return response()->json(['sucesso' => true, 'mensagem' => 'Vacina registrada.', 'dados' => $v], 201);
    }
    public function dependentes(int $usuarioId): JsonResponse
    {
        $dados = Dependente::where('usuario_id', $usuarioId)->get()->map(fn ($d) => ['id' => $d->id, 'nome' => $d->nome, 'parentesco' => $d->parentesco, 'dataNascimento' => $d->data_nascimento]);
        return response()->json(['sucesso' => true, 'dados' => $dados]);
    }
    public function salvarDependente(Request $request): JsonResponse
    {
        $d = $request->validate(['usuarioId' => ['required', 'integer', 'exists:users,id'], 'nome' => ['required', 'string', 'max:255'], 'parentesco' => ['required', 'string', 'max:100'], 'dataNascimento' => ['nullable', 'date']]);
        $dep = Dependente::create(['usuario_id' => $d['usuarioId'], 'nome' => $d['nome'], 'parentesco' => $d['parentesco'], 'data_nascimento' => $d['dataNascimento'] ?? null]);
        return response()->json(['sucesso' => true, 'mensagem' => 'Dependente cadastrado.', 'dados' => $dep], 201);
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
