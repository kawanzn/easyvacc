<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Certificado extends Model
{
    protected $fillable = [
        'codigo',
        'usuario_id',
        'pessoa_tipo',
        'pessoa_id',
        'pessoa_nome',
        'tipo',
        'versao',
        'origem',
        'payload_hash',
        'payload',
        'emitido_em',
    ];

    protected $casts = [
        'payload' => 'array',
        'emitido_em' => 'datetime',
    ];
}
