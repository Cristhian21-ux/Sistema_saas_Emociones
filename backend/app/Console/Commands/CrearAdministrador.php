<?php

namespace App\Console\Commands;

use App\Models\Centro;
use App\Models\Plan;
use App\Models\User;
use App\Services\SuscripcionService;
use Database\Seeders\PlanSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Primer acceso en producción (allí no se cargan los datos de demostración).
 * Crea el centro y su administrador con una contraseña aleatoria que se muestra una sola vez.
 *
 *   docker compose exec backend php artisan emociones:crear-admin --centro="Centro X" --nombre="Ana Pérez" --email=ana@centro.com
 */
class CrearAdministrador extends Command
{
    protected $signature = 'emociones:crear-admin
        {--centro= : Nombre del centro psicológico}
        {--nombre= : Nombre de la persona administradora}
        {--email= : Correo con el que iniciará sesión}';

    protected $description = 'Crea el centro y su primer administrador con una contraseña segura';

    public function handle(): int
    {
        $centroNombre = $this->option('centro') ?: $this->ask('Nombre del centro');
        $nombre = $this->option('nombre') ?: $this->ask('Nombre de la persona administradora');
        $email = strtolower((string) ($this->option('email') ?: $this->ask('Correo de acceso')));

        if (! $centroNombre || ! $nombre || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->components->error('Faltan datos o el correo no es válido.');

            return self::FAILURE;
        }
        if (User::where('email', $email)->exists()) {
            $this->components->error("Ya existe un usuario con el correo $email.");

            return self::FAILURE;
        }

        if (! Plan::exists()) {
            $this->callSilently('db:seed', ['--class' => PlanSeeder::class, '--force' => true]);
        }

        // 20 caracteres aleatorios con letras y números (cumple la política de contraseñas).
        $clave = Str::password(20, symbols: false);

        DB::transaction(function () use ($centroNombre, $nombre, $email, $clave) {
            $plan = Plan::where('codigo', 'premium')->firstOrFail();
            $centro = Centro::create(['nombre' => $centroNombre, 'slug' => Str::slug($centroNombre).'-'.Str::lower(Str::random(4)), 'plan_id' => $plan->id]);
            SuscripcionService::activar($centro, $plan, 'anual');
            User::create(['centro_id' => $centro->id, 'name' => $nombre, 'email' => $email, 'password' => $clave, 'role' => 'admin']);
        });

        $this->components->info('Administrador creado.');
        $this->line("  Correo:     $email");
        $this->line("  Contraseña: $clave");
        $this->components->warn('Guárdala ahora: no se volverá a mostrar. Cámbiala desde "Mi perfil" al entrar.');

        return self::SUCCESS;
    }
}
