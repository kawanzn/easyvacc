<?php

namespace App\Rules;

use App\Support\Documento;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class CnsValido implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! Documento::cnsValido((string) $value)) {
            $fail('Informe um Cartão Nacional de Saúde válido.');
        }
    }
}
