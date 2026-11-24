<?php

namespace Tests\Feature;

use App\Models\Centro;
use App\Models\Suscripcion;
use App\Models\User;
use App\Services\Indicadores\Indicador;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Bolt B08.8: indicadores de gestión de la plataforma (hoja 11 de la matriz). */
class IndicadoresGestionTest extends TestCase
{
    private function buscar(array $lista, string $id): array
    {
        return collect($lista)->firstWhere('id', $id) ?? $this->fail("No se devolvió $id");
    }

    public function test_estado_frente_a_la_meta_usa_la_regla_de_la_matriz(): void
    {
        $this->assertSame('Cumple', Indicador::estado(96, Indicador::MAYOR, 95, 90));
        $this->assertSame('En riesgo', Indicador::estado(92, Indicador::MAYOR, 95, 90));
        $this->assertSame('No cumple', Indicador::estado(80, Indicador::MAYOR, 95, 90));
        $this->assertSame('Cumple', Indicador::estado(2, Indicador::MENOR, 3, 7));
        $this->assertSame('En riesgo', Indicador::estado(5, Indicador::MENOR, 3, 7));
        $this->assertSame('Sin datos', Indicador::estado(null, Indicador::MAYOR, 95, 90));
        $this->assertSame('Informativo', Indicador::estado(10, Indicador::INFORMATIVO, null, null));
        $this->assertNull(Indicador::porcentaje(3, 0));
    }

    public function test_indicadores_de_la_plataforma_solo_para_el_superadmin(): void
    {
        $vip = $this->centro('vip');
        $this->centro('gratuito');
        Centro::factory()->plan('gratuito')->create(['estado' => 'suspendido']);
        Suscripcion::create(['centro_id' => $vip->id, 'plan_id' => $vip->plan_id, 'ciclo' => 'anual', 'monto' => 150, 'estado' => 'activa', 'inicia_at' => now()->subMonths(2)]);

        $this->comoUsuario('admin', $vip);
        $this->getJson('/api/plataforma/indicadores')->assertForbidden();

        Sanctum::actingAs(User::factory()->create(['centro_id' => null, 'role' => 'superadmin']));
        $lista = $this->getJson('/api/plataforma/indicadores')->assertOk()->json('indicadores');
        $this->assertEquals(12.5, $this->buscar($lista, 'KPI-02')['valor']);     // 150 / 12
        $this->assertEquals(150, $this->buscar($lista, 'KPI-03')['valor']);
        $this->assertEquals(33.3, $this->buscar($lista, 'KPI-05')['valor']);     // 1 de 3 centros paga
        $this->assertEquals(12.5, $this->buscar($lista, 'KPI-07')['valor']);
        $this->assertEquals(33.3, $this->buscar($lista, 'KPI-09')['valor']);
        $this->assertEquals(0, $this->buscar($lista, 'KPI-06')['valor']);
    }
}
