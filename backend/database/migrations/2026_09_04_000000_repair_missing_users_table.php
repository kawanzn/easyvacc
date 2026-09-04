<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('users')) {
            return;
        }
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('nome');
            $table->string('cpf', 11)->unique();
            $table->string('cns', 15)->unique();
            $table->string('email')->unique();
            $table->string('cidade');
            $table->string('senha');
            $table->string('telefone')->nullable();
            $table->date('data_nascimento')->nullable();
            $table->string('endereco')->nullable();
            $table->string('tipo_sanguineo')->nullable();
            $table->text('alergias')->nullable();
            $table->string('contato_emergencia')->nullable();
            $table->string('telefone_emergencia')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        // Não remove dados existentes durante um rollback.
    }
};
