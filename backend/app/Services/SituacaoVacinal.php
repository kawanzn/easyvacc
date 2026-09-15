<?php

namespace App\Services;

use App\Models\Campanha;
use App\Models\User;
use App\Models\Vacina;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * Regras de cálculo da situação vacinal (documentadas para o dashboard).
 *
 * 1. Sem registros: cobertura indisponível (não é 0% nem 100%). Status: sem_registros.
 *    Nunca exibe "Em dia", "100%" ou "Caderneta atualizada".
 * 2. Sem data de nascimento: status nao_calculada. Cobertura permanece indisponível.
 *    Ainda listamos próximas doses e atrasos com base nas datas de retorno cadastradas.
 * 3. Com idade e registros: cobertura = imunizantes esperados encontrados / esperado.
 *    Esquema infantil (<18) e adulto (>=18) simplificados a partir do calendário PNI.
 * 4. Atraso: proxima_dose anterior a hoje. Próxima dose: menor data futura.
 * 5. Campanhas aplicáveis: campanhas com status ativo/em andamento.
 */
class SituacaoVacinal
{
    public function calcular(User $usuario, ?string $pessoaTipo = 'titular'): array
    {
        $hoje = Carbon::today();
        $vacinas = Vacina::where('usuario_id', $usuario->id)->orderByDesc('data_aplicacao')->get();
        $ultimaVacina = $vacinas->sortByDesc('updated_at')->first();
        $sincronizadoEm = optional($ultimaVacina?->updated_at ?? $usuario->updated_at)->toIso8601String();

        $base = [
            'pessoa' => [
                'tipo' => $pessoaTipo ?: 'titular',
                'id' => $usuario->id,
                'nome' => $usuario->nome,
            ],
            'origemDados' => 'cadastro_manual',
            'origemRotulo' => 'Cadastro manual no EasyVacc (posto ou usuário). Não é extração oficial do SI-PNI.',
            'sincronizadoEm' => $sincronizadoEm,
            'totalRegistros' => $vacinas->count(),
            'atrasadas' => $this->atrasadas($vacinas, $hoje),
            'proximaDose' => $this->proximaDose($vacinas, $hoje),
            'campanhasAplicaveis' => $this->campanhasAplicaveis(),
            'coberturaPercentual' => null,
            'coberturaDisponivel' => false,
            'status' => 'nao_calculada',
            'statusRotulo' => 'Situação ainda não calculada',
            'statusDetalhe' => 'Faltam informações para calcular a cobertura vacinal.',
            'regra' => 'nao_calculada',
        ];

        if ($pessoaTipo === 'dependente') {
            return array_merge($base, [
                'totalRegistros' => 0,
                'atrasadas' => [],
                'proximaDose' => null,
                'status' => 'nao_calculada',
                'statusRotulo' => 'Situação ainda não calculada',
                'statusDetalhe' => 'A caderneta do dependente ainda não possui registros suficientes para o cálculo.',
                'regra' => 'dependente_sem_historico',
                'origemRotulo' => 'Sem sincronização de caderneta para este dependente.',
                'sincronizadoEm' => null,
            ]);
        }

        if ($vacinas->isEmpty()) {
            return array_merge($base, [
                'status' => 'sem_registros',
                'statusRotulo' => 'Sem registros de vacinação',
                'statusDetalhe' => 'Nenhuma dose foi cadastrada. A ausência de registros não significa cobertura completa.',
                'regra' => 'sem_registros',
                'coberturaPercentual' => null,
                'coberturaDisponivel' => false,
            ]);
        }

        if (! $usuario->data_nascimento) {
            return array_merge($base, [
                'status' => 'nao_calculada',
                'statusRotulo' => 'Situação ainda não calculada',
                'statusDetalhe' => 'Informe a data de nascimento no perfil para cruzar o histórico com o esquema vacinal por idade.',
                'regra' => 'sem_data_nascimento',
            ]);
        }

        $idade = Carbon::parse($usuario->data_nascimento)->age;
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

        $atrasadas = $base['atrasadas'];
        $emDia = $cobertura === 100 && count($atrasadas) === 0;

        return array_merge($base, [
            'coberturaPercentual' => $cobertura,
            'coberturaDisponivel' => $cobertura !== null,
            'status' => $emDia ? 'em_dia' : (count($atrasadas) > 0 ? 'atrasada' : 'parcial'),
            'statusRotulo' => $emDia ? 'Em dia' : (count($atrasadas) > 0 ? 'Doses em atraso' : 'Cobertura parcial'),
            'statusDetalhe' => $emDia
                ? 'Os imunizantes esperados para a faixa etária foram localizados e não há retorno atrasado.'
                : "Localizados {$encontrados} de ".count($esperado).' imunizantes do esquema simplificado.'.(count($atrasadas) ? ' Há retornos em atraso.' : ''),
            'regra' => $idade < 18 ? 'esquema_infantil' : 'esquema_adulto',
            'idade' => $idade,
        ]);
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
            ->filter(fn ($v) => $v->proxima_dose && Carbon::parse($v->proxima_dose)->lt($hoje))
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
