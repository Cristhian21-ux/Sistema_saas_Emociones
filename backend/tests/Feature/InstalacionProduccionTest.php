<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/** Primer acceso en producción: comando de administrador y bloqueo del seeder de demostración. */
class InstalacionProduccionTest extends TestCase
{
    public function test_crea_el_centro_y_el_administrador_con_una_contrasena_aleatoria(): void
    {
        $this->artisan('emociones:crear-admin', ['--centro' => 'Centro Andino', '--nombre' => 'Ana Pérez', '--email' => 'Ana@Centro.com'])
            ->expectsOutputToContain('Administrador creado.')
            ->assertSuccessful();

        $admin = User::where('email', 'ana@centro.com')->firstOrFail();
        $this->assertSame('admin', $admin->role);
        $this->assertSame('Centro Andino', $admin->centro->nombre);
        $this->assertFalse(Hash::check('Emociones2026', $admin->password));
    }

    public function test_no_duplica_un_correo_existente(): void
    {
        $this->usuario('admin')->update(['email' => 'repetido@centro.com']);

        $this->artisan('emociones:crear-admin', ['--centro' => 'X', '--nombre' => 'Y', '--email' => 'repetido@centro.com'])->assertFailed();
    }

    public function test_el_seeder_de_demostracion_no_corre_en_produccion(): void
    {
        $this->app['env'] = 'production';
        $this->app->make(DatabaseSeeder::class)->setContainer($this->app)->__invoke();
        $this->app['env'] = 'testing';

        $this->assertFalse(User::where('email', 'admin@emociones.test')->exists());
    }
}
