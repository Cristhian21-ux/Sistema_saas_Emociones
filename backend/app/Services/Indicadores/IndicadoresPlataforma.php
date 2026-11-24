<?php

namespace App\Services\Indicadores;

use App\Models\Centro;
use App\Models\Suscripcion;
use Illuminate\Support\Carbon;

/**
 * Indicadores del negocio SaaS para el dueño de la plataforma (KPI-02, 03, 05, 06, 07 y 09 de la matriz).
 * El superadmin no tiene centro, así que las consultas abarcan todos los centros.
 */
class IndicadoresPlataforma
{
    public static function calcular(): array
    {
        $centros = Centro::with('plan', 'suscripcionActiva')->get();
        $total = $centros->count();
        $mrr = $centros->sum(fn ($c) => self::mensual($c->suscripcionActiva));
        $dePago = $centros->filter(fn ($c) => (float) $c->plan?->precio_mensual > 0)->count();
        $suspendidos = $centros->where('estado', 'suspendido')->count();
        [$canceladas, $base] = self::churn();

        return [
            Indicador::crear('KPI-02', 'Ingreso recurrente mensual (MRR)', $mrr, 'USD', Indicador::MAYOR, null, null, 'suma de suscripciones activas (anual ÷ 12)'),
            Indicador::crear('KPI-03', 'Ingreso recurrente anual (ARR)', $mrr * 12, 'USD', Indicador::MAYOR, null, null, 'MRR × 12'),
            Indicador::crear('KPI-05', 'Conversión a plan de pago', Indicador::porcentaje($dePago, $total), '%', Indicador::MAYOR, 10, 5, "$dePago de $total centros"),
            Indicador::crear('KPI-06', 'Churn mensual de suscripciones', Indicador::porcentaje($canceladas, $base), '%', Indicador::MENOR, 5, 8, "$canceladas cancelaciones en 30 días sobre $base suscripciones de pago"),
            Indicador::crear('KPI-07', 'Ingreso promedio por centro de pago (ARPA)', $dePago > 0 ? $mrr / $dePago : null, 'USD', Indicador::MAYOR, null, null, "$dePago centros de pago"),
            Indicador::crear('KPI-09', 'Centros suspendidos', Indicador::porcentaje($suspendidos, $total), '%', Indicador::MENOR, 5, 10, "$suspendidos de $total centros"),
        ];
    }

    private static function mensual(?Suscripcion $s): float
    {
        if (! $s) {
            return 0;
        }

        return $s->ciclo === 'anual' ? (float) $s->monto / 12 : (float) $s->monto;
    }

    /** Suscripciones de pago canceladas en los últimos 30 días y base de suscripciones de pago al inicio del periodo. */
    private static function churn(): array
    {
        $inicio = Carbon::now()->subDays(30);
        $canceladas = Suscripcion::query()->where('estado', 'cancelada')->where('monto', '>', 0)->where('updated_at', '>=', $inicio)->count();
        $activasAlInicio = Suscripcion::query()->where('estado', 'activa')->where('monto', '>', 0)->where('inicia_at', '<', $inicio)->count();

        return [$canceladas, $activasAlInicio + $canceladas];
    }
}
