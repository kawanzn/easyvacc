<?php

namespace App\Support;

class Documento
{
    public const TERMOS_VERSAO = '2026-09-15';
    public const PRIVACIDADE_VERSAO = '2026-09-15';

    public static function somenteDigitos(string $valor): string
    {
        return preg_replace('/\D+/', '', $valor) ?? '';
    }

    public static function cpfValido(string $cpfInformado): bool
    {
        $cpf = self::somenteDigitos($cpfInformado);
        if (strlen($cpf) !== 11 || preg_match('/^(\d)\1{10}$/', $cpf)) {
            return false;
        }

        $calc = function (string $base, int $fator) {
            $soma = 0;
            foreach (str_split($base) as $digito) {
                $soma += ((int) $digito) * $fator;
                $fator--;
            }
            $resto = ($soma * 10) % 11;

            return $resto === 10 ? 0 : $resto;
        };

        return $calc(substr($cpf, 0, 9), 10) === (int) $cpf[9]
            && $calc(substr($cpf, 0, 10), 11) === (int) $cpf[10];
    }

    public static function cnsValido(string $cnsInformado): bool
    {
        $cns = self::somenteDigitos($cnsInformado);
        if (strlen($cns) !== 15 || preg_match('/^(\d)\1{14}$/', $cns)) {
            return false;
        }

        $primeiro = $cns[0];
        if (in_array($primeiro, ['7', '8', '9'], true)) {
            $soma = 0;
            for ($i = 0; $i < 15; $i++) {
                $soma += ((int) $cns[$i]) * (15 - $i);
            }

            return $soma % 11 === 0;
        }

        if (! in_array($primeiro, ['1', '2'], true)) {
            return false;
        }

        $pis = substr($cns, 0, 11);
        $soma = 0;
        for ($i = 0; $i < 11; $i++) {
            $soma += ((int) $pis[$i]) * (15 - $i);
        }
        $dv = 11 - ($soma % 11);
        if ($dv === 11) {
            $dv = 0;
        }

        if ($dv === 10) {
            $soma += 2;
            $dv = 11 - ($soma % 11);
            if ($dv === 11) {
                $dv = 0;
            }
            $resultado = $pis.'001'.$dv;
        } else {
            $resultado = $pis.$dv.'000';
        }

        return $resultado === $cns;
    }
}
