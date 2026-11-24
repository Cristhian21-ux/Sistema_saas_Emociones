<?php

namespace Tests\Feature;

use App\Models\Centro;
use App\Models\Cita;
use App\Models\User;
use Tests\TestCase;

/** Módulo de reportes e impacto: indicadores calculados con los registros y sus filtros. */
class ReporteIndicadoresTest extends TestCase
{
    public function test_calcula_indicadores_con_los_registros_del_centro(): void
    {
        $centro = $this->centro('premium');
        $this->comoUsuario('admin', $centro);
        $psicologo = $this->usuario('psicologo', $centro);
        $ayer = now()->subDay()->toDateString();
        $this->citaEl($centro, $psicologo, null, ['fecha' => $ayer, 'estado' => 'atendida', 'pagado' => true, 'monto' => 100, 'metodo_pago' => 'yape']);
        $this->citaEl($centro, $psicologo, null, ['fecha' => $ayer, 'hora' => '11:00', 'estado' => 'atendida', 'pagado' => true, 'monto' => 120, 'metodo_pago' => 'efectivo']);
        $this->citaEl($centro, $psicologo, null, ['fecha' => $ayer, 'hora' => '12:00', 'estado' => 'cancelada']);

        $this->getJson('/api/reportes/indicadores')
            ->assertOk()
            ->assertJsonPath('resumen.total_citas', 3)
            ->assertJsonPath('resumen.citas_atendidas', 2)
            ->assertJsonPath('resumen.tasa_asistencia', fn ($v) => $v == 66.7)
            ->assertJsonPath('resumen.ingresos', fn ($v) => $v == 220)
            ->assertJsonPath('resumen.ticket_promedio', fn ($v) => $v == 110)
            ->assertJsonPath('ingresos_por_metodo.efectivo', fn ($v) => $v == 120)
            ->assertJsonPath('por_psicologo.0.atendidas', 2)
            ->assertJsonCount(6, 'citas_por_mes');
    }

    public function test_filtra_por_estado_y_por_rango_de_fechas(): void
    {
        $centro = $this->centro('premium');
        $this->comoUsuario('admin', $centro);
        $psicologo = $this->usuario('psicologo', $centro);
        $this->citaEl($centro, $psicologo, null, ['fecha' => now()->subDays(2)->toDateString(), 'estado' => 'atendida']);
        $this->citaEl($centro, $psicologo, null, ['fecha' => now()->subDays(2)->toDateString(), 'hora' => '15:00', 'estado' => 'cancelada']);
        $this->citaEl($centro, $psicologo, null, ['fecha' => now()->subMonths(3)->toDateString(), 'estado' => 'atendida']);

        $this->getJson('/api/reportes/indicadores?estado=cancelada')->assertJsonPath('resumen.total_citas', 1);

        $desde = now()->subDays(10)->toDateString();
        $this->getJson("/api/reportes/indicadores?desde=$desde")->assertJsonPath('resumen.total_citas', 2);
    }

    public function test_el_psicologo_solo_ve_sus_propias_citas(): void
    {
        $centro = $this->centro('premium');
        $yo = $this->comoUsuario('psicologo', $centro);
        $otro = $this->usuario('psicologo', $centro);
        $ayer = now()->subDay()->toDateString();
        $this->citaEl($centro, $yo, null, ['fecha' => $ayer, 'estado' => 'atendida']);
        $this->citaEl($centro, $otro, null, ['fecha' => $ayer, 'estado' => 'atendida']);

        // Aunque pida los datos de otro psicólogo, el filtro se fuerza a su propio id.
        $this->getJson("/api/reportes/indicadores?psicologo_id={$otro->id}")
            ->assertOk()
            ->assertJsonPath('resumen.total_citas', 1)
            ->assertJsonPath('filtros.psicologo_id', $yo->id);
    }

    public function test_valida_los_filtros(): void
    {
        $centro = $this->centro('premium');
        $this->comoUsuario('admin', $centro);

        $this->getJson('/api/reportes/indicadores?desde=2026-05-10&hasta=2026-05-01')->assertUnprocessable()->assertJsonValidationErrors('hasta');
        $this->getJson('/api/reportes/indicadores?estado=inventado')->assertUnprocessable()->assertJsonValidationErrors('estado');
    }

    public function test_no_mezcla_datos_de_otro_centro(): void
    {
        $propio = $this->centro('premium');
        $ajeno = $this->centro('premium');
        $this->citaEl($ajeno, $this->usuario('psicologo', $ajeno), null, ['fecha' => now()->subDay()->toDateString(), 'estado' => 'atendida']);
        $this->comoUsuario('admin', $propio);

        $this->getJson('/api/reportes/indicadores')->assertJsonPath('resumen.total_citas', 0);
    }

    public function test_sin_sesion_no_hay_reportes(): void
    {
        $this->getJson('/api/reportes/indicadores')->assertUnauthorized();
    }

    /** Cita en una fecha concreta (el helper base siempre usa una fecha futura). */
    private function citaEl(Centro $centro, User $psicologo, $paciente, array $datos): Cita
    {
        return Cita::factory()->create($datos + [
            'centro_id' => $centro->id,
            'psicologo_id' => $psicologo->id,
            'paciente_id' => $this->paciente($centro)->id,
        ]);
    }
}
