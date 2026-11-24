<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Cabeceras de seguridad en todas las respuestas de Laravel (API y la SPA compilada que sirve
 * "php artisan serve"). En Docker, nginx y Caddy añaden las mismas: es defensa en profundidad.
 */
class CabecerasSeguridad
{
    private const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        ."font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; "
        ."base-uri 'self'; form-action 'self'; frame-ancestors 'none'";

    public function handle(Request $request, Closure $next): Response
    {
        $respuesta = $next($request);

        $respuesta->headers->set('X-Content-Type-Options', 'nosniff');
        $respuesta->headers->set('X-Frame-Options', 'DENY');
        $respuesta->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $respuesta->headers->remove('X-Powered-By');
        if (! headers_sent()) {
            header_remove('X-Powered-By'); // lo agrega PHP (versión exacta); no darle pistas a un atacante
        }

        if ($request->is('api/*')) {
            // Los datos de pacientes no deben quedar en la caché del navegador ni de proxies.
            $respuesta->headers->set('Cache-Control', 'no-store, private');
        } else {
            $respuesta->headers->set('Content-Security-Policy', self::CSP);
        }

        if ($request->isSecure()) {
            $respuesta->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        return $respuesta;
    }
}
