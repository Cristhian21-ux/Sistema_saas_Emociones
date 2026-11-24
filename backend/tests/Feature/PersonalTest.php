<?php

namespace Tests\Feature;

use Tests\TestCase;

class PersonalTest extends TestCase
{
    private function nuevo(array $extra = []): array
    {
        return $extra + ['name' => 'Ps. Nueva', 'email' => 'nueva@centro.test', 'role' => 'psicologo', 'especialidad' => 'Psicología clínica', 'password' => 'Clave12345'];
    }

    public function test_admin_agrega_un_psicologo(): void
    {
        $this->comoUsuario('admin');

        $this->postJson('/api/personal', $this->nuevo())->assertCreated()->assertJsonPath('role', 'psicologo');
    }

    public function test_psicologo_requiere_especialidad(): void
    {
        $this->comoUsuario('admin');

        $this->postJson('/api/personal', $this->nuevo(['especialidad' => null]))->assertStatus(422)->assertJsonValidationErrors('especialidad');
    }

    public function test_recepcion_no_puede_agregar_personal(): void
    {
        $this->comoUsuario('recepcionista');

        $this->postJson('/api/personal', $this->nuevo())->assertForbidden();
    }

    public function test_limite_de_psicologos_del_plan_gratuito(): void
    {
        $centro = $this->centro('gratuito');
        $this->usuario('psicologo', $centro);
        $this->usuario('psicologo', $centro);
        $this->comoUsuario('admin', $centro);

        $this->postJson('/api/personal', $this->nuevo())->assertStatus(402);
    }

    public function test_desactivar_personal_revoca_sus_tokens(): void
    {
        $centro = $this->centro();
        $this->comoUsuario('admin', $centro);
        $recepcion = $this->usuario('recepcionista', $centro);
        $recepcion->createToken('spa');

        $this->patchJson("/api/personal/{$recepcion->id}/activo")->assertOk()->assertJsonPath('activo', false);
        $this->assertSame(0, $recepcion->tokens()->count());
    }

    public function test_admin_no_se_desactiva_a_si_mismo(): void
    {
        $admin = $this->comoUsuario('admin');

        $this->patchJson("/api/personal/{$admin->id}/activo")->assertStatus(422);
    }

    public function test_no_se_gestiona_personal_de_otro_centro(): void
    {
        $this->comoUsuario('admin');
        $ajeno = $this->usuario('recepcionista');

        $this->patchJson("/api/personal/{$ajeno->id}/activo")->assertNotFound();
        $this->putJson("/api/personal/{$ajeno->id}", ['name' => 'X', 'email' => 'x@x.test', 'role' => 'recepcionista'])->assertNotFound();
    }

    public function test_admin_edita_datos_sin_cambiar_la_contrasena(): void
    {
        $centro = $this->centro();
        $this->comoUsuario('admin', $centro);
        $psicologo = $this->usuario('psicologo', $centro);
        $claveAnterior = $psicologo->password;
        $psicologo->createToken('spa');

        $this->putJson("/api/personal/{$psicologo->id}", [
            'name' => 'Ps. Nuevo Nombre', 'email' => 'nuevo@emociones.test', 'role' => 'psicologo', 'especialidad' => 'Terapia familiar', 'password' => '',
        ])->assertOk()->assertJsonPath('especialidad', 'Terapia familiar');

        $psicologo->refresh();
        $this->assertSame('nuevo@emociones.test', $psicologo->email);
        $this->assertSame($claveAnterior, $psicologo->password);
        $this->assertSame(1, $psicologo->tokens()->count()); // sin cambio de acceso, la sesión sigue
        $this->assertTrue(\App\Models\Auditoria::where('accion', 'personal.actualizado')->exists());
    }

    public function test_cambiar_rol_o_contrasena_cierra_sus_sesiones(): void
    {
        $centro = $this->centro();
        $this->comoUsuario('admin', $centro);
        $empleado = $this->usuario('psicologo', $centro);
        $empleado->createToken('spa');

        $this->putJson("/api/personal/{$empleado->id}", [
            'name' => $empleado->name, 'email' => $empleado->email, 'role' => 'recepcionista', 'password' => 'NuevaClave2026',
        ])->assertOk()->assertJsonPath('role', 'recepcionista')->assertJsonPath('especialidad', null);

        $this->assertSame(0, $empleado->tokens()->count());
        $this->assertTrue(\Illuminate\Support\Facades\Hash::check('NuevaClave2026', $empleado->fresh()->password));
    }

    public function test_validaciones_al_editar(): void
    {
        $centro = $this->centro();
        $admin = $this->comoUsuario('admin', $centro);
        $otro = $this->usuario('recepcionista', $centro);

        $this->putJson("/api/personal/{$otro->id}", ['name' => 'A', 'email' => $admin->email, 'role' => 'recepcionista'])
            ->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->putJson("/api/personal/{$otro->id}", ['name' => 'A', 'email' => $otro->email, 'role' => 'psicologo'])
            ->assertUnprocessable()->assertJsonValidationErrors('especialidad');
        $this->putJson("/api/personal/{$admin->id}", ['name' => 'A', 'email' => $admin->email, 'role' => 'recepcionista'])
            ->assertUnprocessable()->assertJsonValidationErrors('role');
    }

    public function test_recepcion_no_puede_editar_personal(): void
    {
        $centro = $this->centro();
        $this->comoUsuario('recepcionista', $centro);
        $otro = $this->usuario('psicologo', $centro);

        $this->putJson("/api/personal/{$otro->id}", ['name' => 'A', 'email' => $otro->email, 'role' => 'psicologo', 'especialidad' => 'x'])->assertForbidden();
    }
}
