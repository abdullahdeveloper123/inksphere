<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    // Configure CORS using the config/cors.php file. The Middleware
    // configuration object does not provide a `validateCors` method.
    // If you need to programmatically modify middleware, use the
    // available methods on the $middleware object (prepend, append, use, etc.).
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
