<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Campanha extends Model
{
    protected $fillable = ['titulo', 'descricao', 'data_inicio', 'data_fim', 'status'];
    protected $casts = ['data_inicio' => 'date:Y-m-d', 'data_fim' => 'date:Y-m-d'];
}
