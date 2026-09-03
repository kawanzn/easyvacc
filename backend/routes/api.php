<?php

// Importa a classe responsável pelas rotas do Laravel.
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Rotas da API - EasyVacc
|--------------------------------------------------------------------------
|
| Todas as rotas deste arquivo recebem automaticamente
| o prefixo "/api".
|
| Exemplo:
| /health aqui se transforma em /api/health
|
*/

// Rota simples para verificar se o backend está funcionando.
Route::get('/health', function () {

    // Retorna uma resposta no formato JSON.
    return response()->json([
        'sucesso' => true,
        'status' => 'online',
        'backend' => 'Laravel',
        'aplicacao' => 'EasyVacc',
    ]);

});