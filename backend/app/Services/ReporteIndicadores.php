<?php

namespace App\Services;

use App\Models\Cita;
use App\Models\Evaluacion;
use App\Models\ListaEspera;
use App\Models\Paciente;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * Módulo de reportes e impacto: indicadores calculados a partir de los registros
 * reales del sistema (citas, pacientes, evaluaciones y lista de espera) con filtros
 * por rango de fechas, estado de la cita y psicólogo.
 *
 * Los cálculos por mes se hacen en PHP para que funcionen igual en MySQL y SQLite.
 */
class ReporteIndicadores
{
    /** Estados que cierran el ciclo de la cita (sirven para medir asistencia). */
    private const CERRADAS = ['atendida', 'cancelada', 'no_agendada'];

    public static function calcular(User $usuario, array $filtros): array
    {
        $desde = Carbon::parse($filtros['desde'])->startOfDay();
        $hasta = Carbon::parse($filtros['hasta'])->endOfDay();
        $psicologoId = $usuario->isPsicologo() ? $usuario->id : ($filtros['psicologo_id'] ?? null);
        $estado = $filtros['estado'] ?? null;

        $citas = Cita::query()
            ->with('psicologo:id,name')
            ->whereDate('fecha', '>=', $desde->toDateString())
            ->whereDate('fecha', '<=', $hasta->toDateString())
            ->when($psicologoId, fn ($q) => $q->where('psicologo_id', $psicologoId))
            ->when($estado, fn ($q) => $q->where('estado', $estado))
            ->get(['id', 'paciente_id', 'psicologo_id', 'fecha', 'estado', 'monto', 'pagado', 'metodo_pago']);

        $evaluaciones = Evaluacion::query()
            ->whereBetween('created_at', [$desde, $hasta])
            ->when($psicologoId, fn ($q) => $q->where('psicologo_id', $psicologoId))
            ->get(['id', 'instrumento', 'severidad', 'alerta']);

        return [
            'filtros' => [
                'desde' => $desde->toDateString(),
                'hasta' => $hasta->toDateString(),
                'estado' => $estado,
                'psicologo_id' => $psicologoId ? (int) $psicologoId : null,
            ],
            'resumen' => self::resumen($citas, $evaluaciones, $desde, $hasta, $psicologoId),
            'citas_por_mes' => self::porMes($citas, $desde, $hasta),
            'citas_por_estado' => $citas->countBy('estado')->sortDesc()->all(),
            'por_psicologo' => self::porPsicologo($citas),
            'ingresos_por_metodo' => $citas->where('pagado', true)
                ->groupBy(fn ($c) => $c->metodo_pago ?: 'sin registrar')
                ->map(fn ($g) => round((float) $g->sum('monto'), 2))
                ->sortDesc()->all(),
            'evaluaciones_por_severidad' => $evaluaciones->countBy('severidad')->sortDesc()->all(),
            'psicologos' => User::psicologosActivos($usuario->centro_id)
                ->when($usuario->isPsicologo(), fn ($q) => $q->where('id', $usuario->id))
                ->orderBy('name')->get(['id', 'name']),
        ];
    }

    private static function resumen(Collection $citas, Collection $evaluaciones, Carbon $desde, Carbon $hasta, $psicologoId): array
    {
        $cerradas = $citas->whereIn('estado', self::CERRADAS)->count();
        $atendidas = $citas->where('estado', 'atendida')->count();
        $canceladas = $citas->whereIn('estado', ['cancelada', 'no_agendada'])->count();
        $pagadas = $citas->where('pagado', true);
        $ingresos = round((float) $pagadas->sum('monto'), 2);

        $espera = ListaEspera::query()
            ->whereBetween('created_at', [$desde, $hasta])
            ->when($psicologoId, fn ($q) => $q->where('psicologo_id', $psicologoId))
            ->get(['estado']);

        return [
            'total_citas' => $citas->count(),
            'citas_atendidas' => $atendidas,
            'citas_canceladas' => $canceladas,
            // % de citas cerradas que terminaron en atención (meta del centro: reducir inasistencias).
            'tasa_asistencia' => $cerradas ? round($atendidas * 100 / $cerradas, 1) : 0.0,
            'tasa_cancelacion' => $cerradas ? round($canceladas * 100 / $cerradas, 1) : 0.0,
            'ingresos' => $ingresos,
            'ticket_promedio' => $pagadas->count() ? round($ingresos / $pagadas->count(), 2) : 0.0,
            'pacientes_atendidos' => $citas->where('estado', 'atendida')->pluck('paciente_id')->unique()->count(),
            'pacientes_nuevos' => Paciente::whereBetween('created_at', [$desde, $hasta])->count(),
            'evaluaciones' => $evaluaciones->count(),
            'alertas_clinicas' => $evaluaciones->where('alerta', true)->count(),
            'lista_espera_total' => $espera->count(),
            // % de pacientes en espera a los que se les reasignó un cupo liberado.
            'lista_espera_reasignados' => $espera->where('estado', 'agendado')->count(),
        ];
    }

    /** Serie mensual continua (incluye meses sin citas con valor 0). */
    private static function porMes(Collection $citas, Carbon $desde, Carbon $hasta): array
    {
        $porMes = $citas->groupBy(fn ($c) => Carbon::parse($c->fecha)->format('Y-m'));
        $serie = [];
        $mes = $desde->copy()->startOfMonth();
        $limite = 0;
        while ($mes <= $hasta && $limite++ < 36) {
            $clave = $mes->format('Y-m');
            $grupo = $porMes->get($clave, collect());
            $serie[] = [
                'periodo' => $clave,
                'total' => $grupo->count(),
                'atendidas' => $grupo->where('estado', 'atendida')->count(),
                'canceladas' => $grupo->whereIn('estado', ['cancelada', 'no_agendada'])->count(),
                'ingresos' => round((float) $grupo->where('pagado', true)->sum('monto'), 2),
            ];
            $mes->addMonth();
        }

        return $serie;
    }

    private static function porPsicologo(Collection $citas): array
    {
        return $citas->groupBy('psicologo_id')->map(function (Collection $grupo) {
            $cerradas = $grupo->whereIn('estado', self::CERRADAS)->count();
            $atendidas = $grupo->where('estado', 'atendida')->count();

            return [
                'psicologo' => $grupo->first()->psicologo?->name ?? 'Sin asignar',
                'total' => $grupo->count(),
                'atendidas' => $atendidas,
                'tasa_asistencia' => $cerradas ? round($atendidas * 100 / $cerradas, 1) : 0.0,
                'ingresos' => round((float) $grupo->where('pagado', true)->sum('monto'), 2),
            ];
        })->sortByDesc('total')->values()->all();
    }
}
