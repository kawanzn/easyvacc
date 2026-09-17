<?php

use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\ApiController;
use App\Http\Controllers\CertificadoController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Rotas da API do EasyVacc
|--------------------------------------------------------------------------
|
| Aqui ficam as rotas utilizadas pelo frontend para se comunicar
| com o backend da aplicação.
|
*/

// =====================================================
// TESTE DA API
// =====================================================
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'mensagem' => 'API EasyVacc funcionando.',
    ]);
});

// =====================================================
// ROTAS DE USUÁRIOS E AUTENTICAÇÃO
// =====================================================
Route::post('/usuarios/cadastro', [UsuarioController::class, 'cadastrar']);
Route::post('/usuarios/login', [UsuarioController::class, 'login']);
Route::post('/usuarios/recuperar-senha', [UsuarioController::class, 'recuperarSenha']);
Route::post('/usuarios/redefinir-senha', [UsuarioController::class, 'redefinirSenha']);
Route::post('/usuarios/confirmar-email', [UsuarioController::class, 'confirmarEmail']);
Route::get('/usuarios/cpf/{cpf}', [UsuarioController::class, 'porCpf'])->whereNumber('cpf');
Route::get('/usuarios/{usuario}/situacao-vacinal', [UsuarioController::class, 'situacaoVacinal'])->whereNumber('usuario');
Route::get('/usuarios/{usuario}', [UsuarioController::class, 'mostrar'])->whereNumber('usuario');

// =====================================================
// ROTAS DE VACINAS, POSTOS E CAMPANHAS
// =====================================================
Route::get('/vacinas/{usuarioId}', [ApiController::class, 'vacinas'])->whereNumber('usuarioId');
Route::post('/vacinas', [ApiController::class, 'salvarVacina']);
Route::get('/postos', [ApiController::class, 'postos']);
Route::get('/campanhas', [ApiController::class, 'campanhas']);
Route::get('/notificacoes/{usuarioId}', [ApiController::class, 'notificacoes'])->whereNumber('usuarioId');

// =====================================================
// ROTAS DE CERTIFICADOS
// =====================================================
Route::post('/certificados', [CertificadoController::class, 'emitir']);
Route::get('/certificados/{codigo}', [CertificadoController::class, 'mostrar']);

// =====================================================
// ROTAS DE DEPENDENTES (CRUD COMPLETO)
// =====================================================
Route::get('/dependentes/{usuarioId}', [ApiController::class, 'dependentes'])->whereNumber('usuarioId');
Route::post('/dependentes', [ApiController::class, 'salvarDependente']);
Route::delete('/dependentes/{id}', [ApiController::class, 'excluirDependente'])->whereNumber('id');