<?php

namespace App\Services;

use App\Models\Campanha;
use App\Models\Dependente;
use App\Models\User;
use App\Models\Vacina;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;

/**
 * Regras de cálculo da situação vacinal (documentadas para o dashboard).
 *
 * cobertura: percentual somente quando há idade e ao menos um imunizante esperado.
 *            Sem registros a cobertura é INDISPONÍVEL (não é 0% nem 100%).
 * status:
 *   - sem_registros: nenhuma dose na base da pessoa selecionada.
 *   - nao_calculada: faltam data de nascimento ou caderneta do dependente.
 *   - atrasada: alguma dose com retorno vencido (SituacaoDose::ATRASADA).
 *   - parcial: há registros, mas o esquema simplificado não está completo.
 *   - em_dia: todos os imunizantes esperados encontrados e nenhum atraso.
 * registros: quantidade de linhas na mesma base do histórico/certificado (não é cobertura).
 * atrasos: doses classificadas como atrasadas pela SituacaoDose.
 * proxima_dose: menor data de retorno >= hoje.
 * campanhas: campanhas ativas/em andamento/abertas.
 */
class SituacaoVacinal
{
    public const VERSAO_REGRAS = '2026-09-15';

    public function calcular(User $usuario, string $pessoaTipo = 'titular', ?int $dependenteId = null): array
    {
        $hoje = Carbon::today();
        $dependente = null;
        $nascimento = $usuario->data_nascimento;
        $pessoa = [
            'tipo' => 'titular',
            'id' => $usuario->id,
            'nome' => $usuario->nome,
        ];

        if ($pessoaTipo === 'dependente') {
            $dependente = Dependente::where('usuario_id', $usuario->id)->find($dependenteId);
            if (! $dependente) {
                return $this->base($usuario, $pessoa, collect(), $hoje, [
                    'status' => 'nao_calculada',
                    'statusRotulo' => 'Situação ainda não calculada',
                    'statusDetalhe' => 'Selecione um dependente válido para consultar a caderneta.',
                    'regra' => 'dependente_nao_encontrado',
                    'sincronizadoEm' => null,
                ]);
            }
            $pessoa = [
                'tipo' => 'dependente',
                'id' => $dependente->id,
                'nome' => $dependente->nome,
            ];
            $nascimento = $dependente->data_nascimento;
        }

        $vacinas = $this->vacinasDoPerfil($usuario->id, $pessoaTipo, $dependente?->id);

        return $this->avaliar($usuario, $pessoa, $vacinas, $hoje, $nascimento);
    }

    private function avaliar(User $usuario, array $pessoa, Collection $vacinas, Carbon $hoje, mixed $nascimento): array
    {
        $ajustes = [];

        if ($vacinas->isEmpty()) {
            $ajustes = [
                'status' => 'sem_registros',
                'statusRotulo' => 'Sem registros de vacinação',
                'statusDetalhe' => 'Nenhuma dose foi cadastrada para esta pessoa. A ausência de registros não significa cobertura completa nem caderneta atualizada.',
                'regra' => 'sem_registros',
                'coberturaPercentual' => null,
                'coberturaDisponivel' => false,
            ];
        } elseif (! $nascimento) {
            $ajustes = [
                'status' => 'nao_calculada',
                'statusRotulo' => 'Situação ainda não calculada',
                'statusDetalhe' => 'Informe a data de nascimento para cruzar o histórico com o esquema vacinal por idade.',
                'regra' => 'sem_data_nascimento',
            ];
        } else {
            $idade = Carbon::parse($nascimento)->age;
            $esperado = $this->esquemaEsperado($idade);
            $encontrados = 0;
            foreach ($esperado as $item) {
                if ($this->possuiImunizante($vacinas, $item['chaves'])) {
                    $encontrados++;
                }
            }
            $cobertura = count($esperado) > 0
                ? (int) round(($encontrados / count($esperado)) * 100)
                : null;
            $atrasadas = $this->atrasadas($vacinas, $hoje);
            $emDia = $cobertura === 100 && count($atrasadas) === 0 && $vacinas->isNotEmpty();

            $ajustes = [
                'coberturaPercentual' => $cobertura,
                'coberturaDisponivel' => $cobertura !== null,
                'status' => $emDia ? 'em_dia' : (count($atrasadas) > 0 ? 'atrasada' : 'parcial'),
                'statusRotulo' => $emDia ? 'Em dia' : (count($atrasadas) > 0 ? 'Doses em atraso' : 'Cobertura parcial'),
                'statusDetalhe' => $emDia
                    ? 'Os imunizantes esperados para a faixa etária foram localizados e não há retorno atrasado.'
                    : "Localizados {$encontrados} de ".count($esperado).' imunizantes do esquema simplificado.'.(count($atrasadas) ? ' Há retornos em atraso.' : ''),
                'regra' => $idade < 18 ? 'esquema_infantil' : 'esquema_adulto',
                'idade' => $idade,
            ];
        }

        return $this->base($usuario, $pessoa, $vacinas, $hoje, $ajustes);
    }

    private function base(User $usuario, array $pessoa, Collection $vacinas, Carbon $hoje, array $ajustes): array
    {
        $ultima = $vacinas->sortByDesc('updated_at')->first();
        $sincronizadoEm = optional($ultima?->updated_at ?? ($vacinas->isEmpty() ? null : $usuario->updated_at))?->toIso8601String();

        return array_merge([
            'pessoa' => $pessoa,
            'origemDados' => 'cadastro_manual',
            'origemRotulo' => 'Cadastro manual no EasyVacc (posto ou usuário). Não é extração oficial do SI-PNI.',
            'sincronizadoEm' => $sincronizadoEm,
            'versaoRegras' => self::VERSAO_REGRAS,
            'totalRegistros' => $vacinas->count(),
            'totalRegistrosDisponivel' => true,
            'atrasadas' => $this->atrasadas($vacinas, $hoje),
            'proximaDose' => $this->proximaDose($vacinas, $hoje),
            'campanhasAplicaveis' => $this->campanhasAplicaveis(),
            'coberturaPercentual' => null,
            'coberturaDisponivel' => false,
            'status' => 'nao_calculada',
            'statusRotulo' => 'Situação ainda não calculada',
            'statusDetalhe' => 'Faltam informações para calcular a cobertura vacinal.',
            'regra' => 'nao_calculada',
            'indicadores' => $this->indicadores(),
        ], $ajustes);
    }

    public function vacinasDoPerfil(int $usuarioId, string $pessoaTipo, ?int $dependenteId): Collection
    {
        $q = Vacina::where('usuario_id', $usuarioId);
        if (Schema::hasColumn('vacinas', 'dependente_id')) {
            if ($pessoaTipo === 'dependente' && $dependenteId) {
                $q->where('dependente_id', $dependenteId);
            } else {
                $q->whereNull('dependente_id');
            }
        }

        return $q->orderByDesc('data_aplicacao')->get();
    }

    public function indicadores(): array
    {
        return [
            [
                'id' => 'cobertura',
                'nome' => 'Cobertura calculada',
                'regra' => 'Imunizantes do esquema simplificado encontrados / esperados para a idade. Indisponível (não é zero) sem registros ou sem data de nascimento.',
            ],
            [
                'id' => 'status',
                'nome' => 'Situação vacinal',
                'regra' => 'sem_registros, nao_calculada, atrasada, parcial ou em_dia. Nunca "Em dia" ou "Caderneta atualizada" sem doses suficientes.',
            ],
            [
                'id' => 'registros',
                'nome' => 'Registros cadastrados',
                'regra' => 'Contagem das doses da pessoa selecionada na mesma tabela usada pelo histórico e pelo certificado. Zero significa nenhuma linha, não dado ausente.',
            ],
            [
                'id' => 'atrasos',
                'nome' => 'Vacinas atrasadas',
                'regra' => 'Doses cuja próxima aplicação é anterior a hoje (SituacaoDose atrasada).',
            ],
            [
                'id' => 'proxima',
                'nome' => 'Próxima dose',
                'regra' => 'Menor data de retorno maior ou igual a hoje.',
            ],
            [
                'id' => 'campanhas',
                'nome' => 'Campanhas aplicáveis',
                'regra' => 'Campanhas com status ativo, em andamento ou aberta.',
            ],
        ];
    }

    private function esquemaEsperado(int $idade): array
    {
        if ($idade < 18) {
            return [
                ['nome' => 'BCG', 'chaves' => ['bcg']],
                ['nome' => 'Hepatite B', 'chaves' => ['hepatite b', 'hep b']],
                ['nome' => 'Pentavalente', 'chaves' => ['penta', 'pentavalente', 'dtp']],
                ['nome' => 'VIP / Poliomielite', 'chaves' => ['polio', 'vip', 'vop']],
                ['nome' => 'Tríplice viral', 'chaves' => ['triplice', 'tríplice', 'scr', 'sarampo']],
                ['nome' => 'Influenza', 'chaves' => ['influenza', 'gripe']],
            ];
        }

        return [
            ['nome' => 'Influenza', 'chaves' => ['influenza', 'gripe']],
            ['nome' => 'Covid-19', 'chaves' => ['covid', 'coronav']],
            ['nome' => 'dT / Tétano', 'chaves' => ['tetano', 'tétano', 'dtpa', 'dt ']],
            ['nome' => 'Hepatite B', 'chaves' => ['hepatite b', 'hep b']],
            ['nome' => 'Tríplice viral', 'chaves' => ['triplice', 'tríplice', 'scr', 'sarampo']],
        ];
    }

    private function possuiImunizante(Collection $vacinas, array $chaves): bool
    {
        return $vacinas->contains(function ($vacina) use ($chaves) {
            $nome = mb_strtolower((string) $vacina->nome);
            foreach ($chaves as $chave) {
                if (str_contains($nome, $chave)) {
                    return true;
                }
            }

            return false;
        });
    }

    private function atrasadas(Collection $vacinas, Carbon $hoje): array
    {
        return $vacinas
            ->filter(function ($v) use ($hoje) {
                $classe = SituacaoDose::classificar(
                    optional($v->proxima_dose)?->format('Y-m-d'),
                    $hoje,
                    (bool) ($v->aplicavel ?? true)
                );

                return $classe['situacao'] === SituacaoDose::ATRASADA;
            })
            ->map(fn ($v) => [
                'id' => $v->id,
                'nome' => $v->nome,
                'proximaDose' => Carbon::parse($v->proxima_dose)->format('d/m/Y'),
            ])
            ->values()
            ->all();
    }

    private function proximaDose(Collection $vacinas, Carbon $hoje): ?array
    {
        $proxima = $vacinas
            ->filter(fn ($v) => $v->proxima_dose && Carbon::parse($v->proxima_dose)->gte($hoje))
            ->sortBy('proxima_dose')
            ->first();

        if (! $proxima) {
            return null;
        }

        return [
            'nome' => $proxima->nome,
            'data' => Carbon::parse($proxima->proxima_dose)->format('d/m/Y'),
        ];
    }

    private function campanhasAplicaveis(): array
    {
        return Campanha::query()
            ->where(function ($q) {
                $q->whereRaw('LOWER(status) like ?', ['%ativa%'])
                    ->orWhereRaw('LOWER(status) like ?', ['%andamento%'])
                    ->orWhereRaw('LOWER(status) like ?', ['%aberta%']);
            })
            ->limit(5)
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'titulo' => $c->titulo,
                'status' => $c->status,
            ])
            ->all();
    }
}
