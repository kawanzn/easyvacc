<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Vacina extends Model
{
    protected $fillable = ['usuario_id', 'dependente_id', 'nome', 'data_aplicacao', 'lote', 'fabricante', 'proxima_dose', 'posto', 'profissional', 'aplicavel'];
    protected $casts = ['data_aplicacao' => 'date:Y-m-d', 'proxima_dose' => 'date:Y-m-d'];
}
