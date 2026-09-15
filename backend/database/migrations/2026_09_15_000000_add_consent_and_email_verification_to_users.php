<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'email_verified_at')) {
                $table->timestamp('email_verified_at')->nullable()->after('email');
            }
            if (! Schema::hasColumn('users', 'termos_aceitos_em')) {
                $table->timestamp('termos_aceitos_em')->nullable()->after('telefone_emergencia');
            }
            if (! Schema::hasColumn('users', 'privacidade_aceita_em')) {
                $table->timestamp('privacidade_aceita_em')->nullable();
            }
            if (! Schema::hasColumn('users', 'termos_versao')) {
                $table->string('termos_versao', 20)->nullable();
            }
            if (! Schema::hasColumn('users', 'privacidade_versao')) {
                $table->string('privacidade_versao', 20)->nullable();
            }
        });

        if (! Schema::hasTable('email_confirmations')) {
            Schema::create('email_confirmations', function (Blueprint $table) {
                $table->id();
                $table->foreignId('usuario_id')->constrained('users')->cascadeOnDelete();
                $table->string('token', 64)->unique();
                $table->timestamp('expires_at');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('email_confirmations');
        Schema::table('users', function (Blueprint $table) {
            foreach (['email_verified_at', 'termos_aceitos_em', 'privacidade_aceita_em', 'termos_versao', 'privacidade_versao'] as $coluna) {
                if (Schema::hasColumn('users', $coluna)) {
                    $table->dropColumn($coluna);
                }
            }
        });
    }
};
