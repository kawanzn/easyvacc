<?php

namespace App\Services;

use App\Models\Vacina;
use Carbon\Carbon;

/**
 * Situação da dose — mesma regra no histórico, dashboard e certificado.
 *
 * - nao_aplicavel: imunizante marcado como não aplicável à pessoa.
 * - atrasada: há data de retorno e ela é anterior a hoje.
 * - pendente: há data de retorno hoje ou no futuro (próxima dose prevista).
 * - concluida: dose aplicada sem retorno cadastrado.
 *
 * Ausência de data de retorno NÃO é cobertura completa do esquema, só daquela aplicação.
 * Intervalo recomendado: dias entre aplicação e a próxima dose informada (não inventado).
 */
class SituacaoDose
{
    public const CONCLUIDA = 'concluida';
    public const PENDENTE = 'pendente';
    public const ATRASADA = 'atrasada';
    public const NAO_APLICAVEL = 'nao_aplicavel';

    public static function classificar(?string $proximaDose, Carbon $hoje, bool $aplicavel = true): array
    {
        if (! $aplicavel) {
            return [
                'situacao' => self::NAO_APLICAVEL,
                'situacaoRotulo' => 'Não aplicável',
            ];
        }

        if (! $proximaDose) {
            return [
                'situacao' => self::CONCLUIDA,
                'situacaoRotulo' => 'Dose concluída',
            ];
        }

        $retorno = Carbon::parse($proximaDose)->startOfDay();
        if ($retorno->lt($hoje->copy()->startOfDay())) {
            return [
                'situacao' => self::ATRASADA,
                'situacaoRotulo' => 'Atrasada',
            ];
        }

        return [
            'situacao' => self::PENDENTE,
            'situacaoRotulo' => 'Pendente',
        ];
    }

    public static function intervaloDias(?string $aplicacao, ?string $proxima): ?int
    {
        if (! $aplicacao || ! $proxima) {
            return null;
        }

        return Carbon::parse($aplicacao)->startOfDay()->diffInDays(Carbon::parse($proxima)->startOfDay());
    }

    public static function formatar(Vacina $vacina, Carbon $hoje): array
    {
        $aplicacao = optional($vacina->data_aplicacao)?->format('Y-m-d');
        $proxima = optional($vacina->proxima_dose)?->format('Y-m-d');
        $classe = self::classificar($proxima, $hoje, (bool) ($vacina->aplicavel ?? true));

        return [
            'id' => $vacina->id,
            'nome' => $vacina->nome,
            'dataAplicacao' => $aplicacao ? Carbon::parse($aplicacao)->format('d/m/Y') : null,
            'dataAplicacaoIso' => $aplicacao,
            'lote' => $vacina->lote,
            'fabricante' => $vacina->fabricante,
            'proximaDose' => $proxima ? Carbon::parse($proxima)->format('d/m/Y') : null,
            'proximaDoseIso' => $proxima,
            'intervaloRecomendadoDias' => self::intervaloDias($aplicacao, $proxima),
            'posto' => $vacina->posto,
            'profissional' => $vacina->profissional,
            'dependenteId' => $vacina->dependente_id,
            'situacao' => $classe['situacao'],
            'situacaoRotulo' => $classe['situacaoRotulo'],
        ];
    }
}
