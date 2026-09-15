<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vacinas', function (Blueprint $table) {
            if (! Schema::hasColumn('vacinas', 'dependente_id')) {
                $table->foreignId('dependente_id')->nullable()->constrained('dependentes')->nullOnDelete();
            }
            if (! Schema::hasColumn('vacinas', 'posto')) {
                $table->string('posto')->nullable();
            }
            if (! Schema::hasColumn('vacinas', 'profissional')) {
                $table->string('profissional')->nullable();
            }
            if (! Schema::hasColumn('vacinas', 'aplicavel')) {
                $table->boolean('aplicavel')->default(true);
            }
        });

        if (! Schema::hasTable('certificados')) {
            Schema::create('certificados', function (Blueprint $table) {
                $table->id();
                $table->string('codigo', 32)->unique();
                $table->foreignId('usuario_id')->constrained('users')->cascadeOnDelete();
                $table->string('pessoa_tipo', 20)->default('titular');
                $table->unsignedBigInteger('pessoa_id')->nullable();
                $table->string('pessoa_nome');
                $table->string('tipo', 40)->default('comprovante');
                $table->string('versao', 20);
                $table->string('origem');
                $table->string('payload_hash', 64);
                $table->json('payload');
                $table->timestamp('emitido_em');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('certificados');
        Schema::table('vacinas', function (Blueprint $table) {
            foreach (['aplicavel', 'profissional', 'posto'] as $coluna) {
                if (Schema::hasColumn('vacinas', $coluna)) {
                    $table->dropColumn($coluna);
                }
            }
            if (Schema::hasColumn('vacinas', 'dependente_id')) {
                $table->dropConstrainedForeignId('dependente_id');
            }
        });
    }
};
