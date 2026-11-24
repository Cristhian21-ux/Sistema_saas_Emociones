<?php

namespace Tests\Feature;

use App\Models\Auditoria;
use Tests\TestCase;

/** MP-01 Gestión de Acceso y Seguridad: bloqueo, límite de intentos y auditoría. */
class SeguridadAccesoTest extends TestCase
{
    public function test_el_intento_de_una_cuenta_desactivada_se_bloquea_y_se_audita(): void
    {
        $usuario = $this->usuario('recepcionista');
        $usuario->update(['activo' => false]);

        $this->postJson('/api/auth/login', ['email' => $usuario->email, 'password' => 'Clave12345'])->assertForbidden();

        $this->assertTrue(Auditoria::where('accion', 'login.bloqueado')->where('user_id', $usuario->id)->exists());
    }

    public function test_el_login_se_limita_a_10_intentos_por_minuto(): void
    {
        $usuario = $this->usuario('recepcionista');
        for ($i = 0; $i < 10; $i++) {
            $this->postJson('/api/auth/login', ['email' => $usuario->email, 'password' => 'Incorrecta1'])->assertStatus(422);
        }

        $this->postJson('/api/auth/login', ['email' => $usuario->email, 'password' => 'Clave12345'])->assertStatus(429);
    }

    public function test_el_token_de_login_expira_en_12_horas(): void
    {
        $usuario = $this->usuario('psicologo');
        $token = $this->postJson('/api/auth/login', ['email' => $usuario->email, 'password' => 'Clave12345'])->json('token');

        $this->assertNotNull($token);
        $expira = $usuario->tokens()->first()->expires_at;
        $this->assertTrue($expira->between(now()->addHours(11), now()->addHours(13)));
    }

    public function test_desactivar_un_usuario_revoca_sus_sesiones(): void
    {
        $centro = $this->centro();
        $empleado = $this->usuario('recepcionista', $centro);
        $empleado->createToken('spa');
        $this->comoUsuario('admin', $centro);

        $this->patchJson("/api/personal/{$empleado->id}/activo")->assertOk()->assertJsonPath('activo', false);

        $this->assertSame(0, $empleado->tokens()->count());
        $this->assertTrue(Auditoria::where('accion', 'personal.desactivado')->exists());
    }

    public function test_la_auditoria_se_filtra_por_accion_y_fecha(): void
    {
        $centro = $this->centro();
        $this->comoUsuario('admin', $centro);
        Auditoria::create(['centro_id' => $centro->id, 'accion' => 'login.fallido']);
        Auditoria::create(['centro_id' => $centro->id, 'accion' => 'paciente.creado']);

        $this->getJson('/api/auditoria?accion=login')->assertOk()->assertJsonPath('total', 1);
        $this->getJson('/api/auditoria?desde='.now()->addDay()->toDateString())->assertJsonPath('total', 0);
    }
}
