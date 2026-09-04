<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    // =====================================================
    // CAMPOS QUE PODEM SER PREENCHIDOS PELO SISTEMA
    // =====================================================
    //
    // Esses campos correspondem aos dados enviados
    // pela tela de cadastro do EasyVacc.
    protected $fillable = [
        'nome',
        'cpf',
        'cns',
        'email',
        'cidade',
        'senha',
        'telefone',
        'data_nascimento',
        'endereco',
        'tipo_sanguineo',
        'alergias',
        'contato_emergencia',
        'telefone_emergencia',
    ];

    // =====================================================
    // CAMPOS OCULTOS
    // =====================================================
    //
    // Impede que a senha seja exibida quando os dados
    // do usuário forem transformados em JSON.
    protected $hidden = [
        'senha',
    ];

    // =====================================================
    // TRATAMENTO AUTOMÁTICO DOS CAMPOS
    // =====================================================

    protected function casts(): array
    {
        return [
            // Sempre que atribuirmos uma senha ao usuário,
            // o Laravel armazenará seu hash em vez do texto puro.
            'senha' => 'hashed',
            'data_nascimento' => 'date:Y-m-d',
        ];
    }

    // =====================================================
    // SENHA UTILIZADA PELA AUTENTICAÇÃO
    // =====================================================
    //
    // O Laravel normalmente procura uma coluna chamada
    // "password". Como o EasyVacc utiliza "senha",
    // informamos aqui qual campo contém a senha do usuário.
    public function getAuthPassword(): string
    {
        return $this->senha;
    }
}
