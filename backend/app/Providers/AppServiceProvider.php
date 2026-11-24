<?php

namespace App\Providers;

use App\Services\CompiladorSpa;
use Illuminate\Console\Events\CommandStarting;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Límite general de la API: 120 peticiones por minuto por usuario (o por IP si no inició sesión).
        // Tiene su propio contador, separado del límite de 10 intentos del login.
        RateLimiter::for('api', fn (Request $request) => Limit::perMinute(120)->by($request->user()?->id ?: $request->ip()));

        // En producción todos los enlaces que genera Laravel usan HTTPS.
        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }

        // "php artisan serve" recompila la interfaz React si su código cambió,
        // así el sistema completo se abre en http://localhost:8000 con un solo comando.
        Event::listen(CommandStarting::class, function (CommandStarting $evento) {
            if ($evento->command !== 'serve' || $this->app->environment('testing')) {
                return;
            }
            $spa = CompiladorSpa::predeterminado();
            if ($spa->disponible() && $spa->desactualizada()) {
                $spa->compilar($evento->output);
            }
        });
    }
}
