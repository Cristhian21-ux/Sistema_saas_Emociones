<?php

use App\Http\Middleware\CabecerasSeguridad;
use App\Http\Middleware\EnsureCentroActivo;
use App\Http\Middleware\EnsureModoSaas;
use App\Http\Middleware\EnsurePlanPermite;
use App\Http\Middleware\EnsureUserHasRole;
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
    ->withMiddleware(function (Middleware $middleware): void {
        // Detrás de Caddy y nginx (red interna de Docker): se confía en esos proxies para conocer la
        // IP real del cliente y si la conexión es HTTPS. Las IP públicas nunca son proxies de confianza,
        // así que nadie puede falsear su IP desde internet para saltarse el límite de intentos del login.
        $middleware->trustProxies(at: ['127.0.0.1', '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16']);
        $middleware->append(CabecerasSeguridad::class);
        // Límite general por usuario (o IP) para toda la API, además de los límites del login.
        $middleware->throttleApi(); // limitador "api" definido en AppServiceProvider
        $middleware->alias([
            'rol' => EnsureUserHasRole::class,
            'plan' => EnsurePlanPermite::class,
            'centro.activo' => EnsureCentroActivo::class,
            'modo.saas' => EnsureModoSaas::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // La API siempre responde JSON (también en 401/403/404).
        $exceptions->shouldRenderJsonWhen(fn ($request) => $request->is('api/*') || $request->expectsJson());
    })->create();
