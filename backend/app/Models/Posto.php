<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Posto extends Model
{
    protected $fillable = ['nome', 'endereco', 'horario_funcionamento', 'telefone', 'aberto'];
    protected $casts = ['aberto' => 'boolean'];
}
