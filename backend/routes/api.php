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
// Permite verificar rapidamente se o backend está funcionando.
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'mensagem' => 'API EasyVacc funcionando.',
    ]);
});

// =====================================================
// CADASTRO DE USUÁRIO
// =====================================================
// Recebe os dados enviados pela tela de cadastro e chama
// o método "cadastrar" do UsuarioController.
Route::post('/usuarios/cadastro', [UsuarioController::class, 'cadastrar']);
Route::post('/usuarios/login', [UsuarioController::class, 'login']);
Route::post('/usuarios/recuperar-senha', [UsuarioController::class, 'recuperarSenha']);
Route::post('/usuarios/redefinir-senha', [UsuarioController::class, 'redefinirSenha']);
Route::post('/usuarios/confirmar-email', [UsuarioController::class, 'confirmarEmail']);
Route::get('/usuarios/cpf/{cpf}', [UsuarioController::class, 'porCpf'])->whereNumber('cpf');
Route::get('/usuarios/{usuario}/situacao-vacinal', [UsuarioController::class, 'situacaoVacinal'])->whereNumber('usuario');
Route::get('/usuarios/{usuario}', [UsuarioController::class, 'mostrar'])->whereNumber('usuario');
Route::get('/vacinas/{usuarioId}', [ApiController::class, 'vacinas'])->whereNumber('usuarioId');
Route::post('/vacinas', [ApiController::class, 'salvarVacina']);
Route::post('/certificados', [CertificadoController::class, 'emitir']);
Route::get('/certificados/{codigo}', [CertificadoController::class, 'mostrar']);
Route::get('/dependentes/{usuarioId}', [ApiController::class, 'dependentes'])->whereNumber('usuarioId');
Route::post('/dependentes', [ApiController::class, 'salvarDependente']);
Route::get('/postos', [ApiController::class, 'postos']);
Route::get('/campanhas', [ApiController::class, 'campanhas']);
Route::get('/notificacoes/{usuarioId}', [ApiController::class, 'notificacoes'])->whereNumber('usuarioId');
