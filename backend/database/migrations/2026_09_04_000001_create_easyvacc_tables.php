<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dependentes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('usuario_id')->constrained('users')->cascadeOnDelete();
            $table->string('nome');
            $table->string('parentesco');
            $table->date('data_nascimento')->nullable();
            $table->timestamps();
        });

        Schema::create('vacinas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('usuario_id')->constrained('users')->cascadeOnDelete();
            $table->string('nome');
            $table->date('data_aplicacao');
            $table->string('lote')->nullable();
            $table->string('fabricante')->nullable();
            $table->date('proxima_dose')->nullable();
            $table->timestamps();
        });

        Schema::create('postos', function (Blueprint $table) {
            $table->id();
            $table->string('nome');
            $table->string('endereco');
            $table->string('horario_funcionamento')->nullable();
            $table->string('telefone')->nullable();
            $table->boolean('aberto')->default(true);
            $table->timestamps();
        });

        Schema::create('campanhas', function (Blueprint $table) {
            $table->id();
            $table->string('titulo');
            $table->text('descricao');
            $table->date('data_inicio')->nullable();
            $table->date('data_fim')->nullable();
            $table->string('status')->default('Em breve');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campanhas');
        Schema::dropIfExists('postos');
        Schema::dropIfExists('vacinas');
        Schema::dropIfExists('dependentes');
    }
};
