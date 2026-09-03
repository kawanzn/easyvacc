<?php

// Classe principal responsável por configurar a aplicação Laravel.
use Illuminate\Foundation\Application;

// Classe usada para configurar o tratamento de exceções.
use Illuminate\Foundation\Configuration\Exceptions;

// Classe usada para configurar os middlewares da aplicação.
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(

        // Rotas tradicionais da aplicação web.
        web: __DIR__.'/../routes/web.php',

        // Rotas da nossa API.
        // O Laravel adiciona automaticamente o prefixo "/api".
        api: __DIR__.'/../routes/api.php',

        // Rotas utilizadas por comandos do Laravel.
        commands: __DIR__.'/../routes/console.php',

        // Rota interna do Laravel para verificar
        // se a aplicação está funcionando.
        health: '/up',
    )

    // Área destinada à configuração de middlewares.
    ->withMiddleware(function (Middleware $middleware): void {
        //
    })

    // Área destinada à configuração do tratamento de erros.
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })

    // Finaliza e cria a aplicação Laravel.
    ->create();