<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\Disponibilidad;
use App\Services\HorarioAtencion;
use Illuminate\Support\Carbon;
use Tests\TestCase;

/** Cada psicólogo tiene sus días y horas de atención; recepción solo puede agendar dentro de ellos. */
class HorarioPsicologoTest extends TestCase
{
    /** Lunes a viernes de 8 a 13 y sábado de 9 a 12. */
    private const MANANAS = [
        '1' => ['inicio' => '08:00', 'fin' => '13:00'], '2' => ['inicio' => '08:00', 'fin' => '13:00'],
        '3' => ['inicio' => '08:00', 'fin' => '13:00'], '4' => ['inicio' => '08:00', 'fin' => '13:00'],
        '5' => ['inicio' => '08:00', 'fin' => '13:00'], '6' => ['inicio' => '09:00', 'fin' => '12:00'],
    ];

    private function proximo(string $dia): string
    {
        return Carbon::parse("next $dia")->toDateString();
    }

    public function test_el_sistema_usa_la_hora_de_lima(): void
    {
        $this->assertSame('America/Lima', config('app.timezone'));

        // 08:30 en Lima: las horas de la mañana de hoy siguen libres (con UTC se ocultaban hasta las 13:00).
        $centro = $this->centro();
        $psicologo = $this->usuario('psicologo', $centro);
        $martes = $this->proximo('tuesday');
        Carbon::setTestNow(Carbon::parse("$martes 08:30", 'America/Lima'));

        $this->assertContains('09:00', Disponibilidad::libres($psicologo->id, $martes));
        $this->assertSame($martes, today()->toDateString());
        Carbon::setTestNow();
    }

    public function test_el_admin_registra_el_horario_al_agregar_un_psicologo(): void
    {
        $this->comoUsuario('admin', $this->centro());

        $id = $this->postJson('/api/personal', [
            'name' => 'Ps. Ana Rojas', 'email' => 'ana@centro.test', 'role' => 'psicologo',
            'especialidad' => 'Psicología clínica', 'password' => 'Clave2026x', 'horario' => self::MANANAS,
        ])->assertCreated()->json('id');

        $this->assertSame(self::MANANAS, User::find($id)->horario);
        $this->getJson('/api/personal')->assertOk()
            ->assertJsonFragment(['horario_resumen' => 'Lun–Vie 08:00–13:00 · Sáb 09:00–12:00']);
    }

    public function test_el_admin_cambia_el_horario_y_recepcion_lo_ve(): void
    {
        $centro = $this->centro();
        $psicologo = $this->usuario('psicologo', $centro);
        $this->comoUsuario('admin', $centro);

        $this->putJson("/api/personal/{$psicologo->id}", [
            'name' => $psicologo->name, 'email' => $psicologo->email, 'role' => 'psicologo',
            'especialidad' => 'Neuropsicología', 'horario' => ['3' => ['inicio' => '15:00', 'fin' => '19:00']],
        ])->assertOk()->assertJsonPath('horario.3.inicio', '15:00');

        $this->comoUsuario('recepcionista', $centro);
        $this->getJson("/api/agenda/disponibilidad?psicologo_id={$psicologo->id}&fecha={$this->proximo('wednesday')}")
            ->assertOk()->assertJsonPath('atiende', true)->assertJsonPath('horas', ['15:00', '16:00', '17:00', '18:00'])
            ->assertJsonPath('horario', 'Mié 15:00–19:00');
        $this->getJson("/api/agenda/disponibilidad?psicologo_id={$psicologo->id}&fecha={$this->proximo('thursday')}")
            ->assertOk()->assertJsonPath('atiende', false)->assertJsonPath('libres', []);
    }

    public function test_no_se_agenda_en_su_dia_de_descanso_ni_fuera_de_hora(): void
    {
        $centro = $this->centro();
        $psicologo = User::factory()->create(['centro_id' => $centro->id, 'role' => 'psicologo', 'name' => 'Ps. Luis Paz', 'horario' => self::MANANAS]);
        $paciente = $this->paciente($centro);
        $this->comoUsuario('recepcionista', $centro);
        $cita = fn (string $fecha, string $hora) => ['paciente_id' => $paciente->id, 'psicologo_id' => $psicologo->id, 'fecha' => $fecha, 'hora' => $hora, 'motivo' => 'Consulta'];

        $this->postJson('/api/citas', $cita($this->proximo('sunday'), '10:00'))->assertUnprocessable()
            ->assertJsonPath('message', 'Ps. Luis Paz no atiende los domingos. Su horario: Lun–Vie 08:00–13:00 · Sáb 09:00–12:00.');
        $this->postJson('/api/citas', $cita($this->proximo('monday'), '15:00'))->assertUnprocessable()
            ->assertJsonValidationErrors('hora');
        $this->postJson('/api/citas', $cita($this->proximo('saturday'), '09:00'))->assertCreated();
    }

    public function test_sin_horario_propio_usa_el_horario_del_centro(): void
    {
        $psicologo = $this->usuario('psicologo', $this->centro());

        $this->assertNull($psicologo->horario);
        $this->assertSame(Disponibilidad::horasDelDia($this->proximo('monday')), Disponibilidad::horasDelDia($this->proximo('monday'), $psicologo));
        $this->assertSame('Lun–Sáb 08:00–18:00', HorarioAtencion::resumen($psicologo));
    }

    public function test_el_refrigerio_solo_se_descuenta_en_medio_del_turno(): void
    {
        $tarde = User::factory()->make(['horario' => ['1' => ['inicio' => '13:00', 'fin' => '16:00']]]);
        $largo = User::factory()->make(['horario' => ['1' => ['inicio' => '09:00', 'fin' => '17:00']]]);

        $this->assertSame(['13:00', '14:00', '15:00'], Disponibilidad::horasDelDia($this->proximo('monday'), $tarde));
        $this->assertNotContains('13:00', Disponibilidad::horasDelDia($this->proximo('monday'), $largo));
    }

    public function test_valida_el_horario(): void
    {
        $centro = $this->centro();
        $psicologo = $this->usuario('psicologo', $centro);
        $this->comoUsuario('admin', $centro);
        $enviar = fn ($horario) => $this->putJson("/api/personal/{$psicologo->id}", [
            'name' => $psicologo->name, 'email' => $psicologo->email, 'role' => 'psicologo', 'especialidad' => 'Clínica', 'horario' => $horario,
        ]);

        $enviar(['1' => ['inicio' => '13:00', 'fin' => '09:00']])->assertJsonValidationErrors(['horario' => 'al menos 60 minutos']);
        $enviar(['1' => ['inicio' => '08:15', 'fin' => '12:00']])->assertJsonValidationErrors(['horario' => 'en punto o y media']);
        $enviar(['8' => ['inicio' => '08:00', 'fin' => '12:00']])->assertJsonValidationErrors(['horario' => 'no válido']);
        $enviar(['1' => ['inicio' => '05:00', 'fin' => '12:00']])->assertJsonValidationErrors(['horario' => 'entre las 06:00 y las 22:00']);
        $enviar([])->assertJsonValidationErrors(['horario' => 'al menos un día']);
    }

    public function test_al_dejar_de_ser_psicologo_se_borra_su_horario(): void
    {
        $centro = $this->centro();
        $psicologo = User::factory()->create(['centro_id' => $centro->id, 'role' => 'psicologo', 'horario' => self::MANANAS]);
        $this->comoUsuario('admin', $centro);

        $this->putJson("/api/personal/{$psicologo->id}", ['name' => 'X', 'email' => $psicologo->email, 'role' => 'recepcionista'])->assertOk();
        $this->assertNull($psicologo->fresh()->horario);
    }
}
