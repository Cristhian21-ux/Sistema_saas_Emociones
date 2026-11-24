<?php

namespace Tests\Feature;

use App\Models\Cita;
use App\Models\Plan;
use App\Models\User;
use App\Services\SuscripcionService;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DashboardYPlataformaTest extends TestCase
{
    public function test_dashboard_muestra_metricas_del_centro(): void
    {
        $centro = $this->centro();
        $this->comoUsuario('admin', $centro);
        $this->cita($centro, $this->usuario('psicologo', $centro), null, [
            'pagado' => true, 'monto' => 120, 'pagado_at' => now(), 'estado' => 'confirmada',
        ]);

        $this->getJson('/api/dashboard')->assertOk()->assertJsonPath('pacientes', 1)->assertJsonPath('ingresos_mes', 120);
    }

    public function test_dashboard_lista_las_proximas_citas_por_atender_en_orden(): void
    {
        $centro = $this->centro();
        $this->comoUsuario('admin', $centro);
        $psicologo = $this->usuario('psicologo', $centro);
        $base = ['centro_id' => $centro->id, 'psicologo_id' => $psicologo->id, 'paciente_id' => $this->paciente($centro)->id];
        $hoy = today()->toDateString();
        $manana = today()->addDay()->toDateString();
        Cita::factory()->create(['fecha' => $manana, 'hora' => '09:00', 'estado' => 'confirmada'] + $base);
        Cita::factory()->create(['fecha' => $hoy, 'hora' => '15:00', 'estado' => 'pendiente'] + $base);
        Cita::factory()->create(['fecha' => $hoy, 'hora' => '11:00', 'estado' => 'cancelada'] + $base);
        Cita::factory()->create(['fecha' => $hoy, 'hora' => '08:00', 'estado' => 'atendida'] + $base);
        Cita::factory()->create(['fecha' => today()->subDay()->toDateString(), 'hora' => '10:00', 'estado' => 'confirmada'] + $base);

        $citas = $this->getJson('/api/dashboard')->assertOk()->json('proximas_citas');
        $this->assertSame([[$hoy, '15:00'], [$manana, '09:00']], array_map(fn ($c) => [$c['fecha'], $c['hora']], $citas));
        $this->assertSame($psicologo->name, $citas[0]['psicologo']);
        $this->assertNotEmpty($citas[0]['paciente']);
    }

    public function test_auditoria_registra_acciones_criticas(): void
    {
        $centro = $this->centro();
        $this->comoUsuario('admin', $centro);
        $this->postJson('/api/pacientes', ['nombres' => 'A', 'apellidos' => 'B', 'dni' => '55556666']);

        $this->getJson('/api/auditoria')->assertOk()->assertJsonPath('data.0.accion', 'paciente.creado');
    }

    public function test_solo_admin_ve_la_auditoria(): void
    {
        $this->comoUsuario('psicologo');

        $this->getJson('/api/auditoria')->assertForbidden();
    }

    public function test_superadmin_lista_todos_los_centros(): void
    {
        $this->centro();
        $this->centro('premium');
        Sanctum::actingAs(User::factory()->create(['centro_id' => null, 'role' => 'superadmin']));

        $this->getJson('/api/plataforma/centros')->assertOk()->assertJsonCount(2);
    }

    public function test_superadmin_suspende_un_centro(): void
    {
        $centro = $this->centro();
        Sanctum::actingAs(User::factory()->create(['centro_id' => null, 'role' => 'superadmin']));

        $this->patchJson("/api/plataforma/centros/{$centro->id}/estado", ['estado' => 'suspendido'])->assertOk();
        $this->assertSame('suspendido', $centro->fresh()->estado);
    }

    public function test_admin_de_centro_no_accede_a_la_plataforma(): void
    {
        $this->comoUsuario('admin');

        $this->getJson('/api/plataforma/centros')->assertForbidden();
    }

    public function test_metricas_saas_calculan_ingreso_recurrente(): void
    {
        $centro = $this->centro();
        SuscripcionService::activar($centro, Plan::where('codigo', 'premium')->first(), 'anual');
        Sanctum::actingAs(User::factory()->create(['centro_id' => null, 'role' => 'superadmin']));

        $this->getJson('/api/plataforma/metricas')->assertOk()->assertJsonPath('mrr', 58.33);
    }

    public function test_health_reporta_ia_no_disponible_sin_caerse(): void
    {
        $this->getJson('/api/health')->assertOk()->assertJsonPath('database', 'ok')->assertJsonPath('ia_service', 'no_disponible');
    }

    public function test_health_con_ia_activa(): void
    {
        Http::fake(['*/health' => Http::response(['status' => 'ok'])]);

        $this->getJson('/api/health')->assertOk()->assertJsonPath('ia_service', 'ok');
    }
}
