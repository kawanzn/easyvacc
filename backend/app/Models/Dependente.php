<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Dependente extends Model
{
    protected $fillable = ['usuario_id', 'nome', 'parentesco', 'data_nascimento'];
    protected $casts = ['data_nascimento' => 'date:Y-m-d'];
}
