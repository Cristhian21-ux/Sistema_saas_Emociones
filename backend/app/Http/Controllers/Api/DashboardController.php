<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Auditoria;
use App\Models\Cita;
use App\Services\MetricasCentro;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $usuario = $request->user();

        return response()->json(MetricasCentro::calcular($usuario) + [
            'proximas_citas' => $this->proximasCitas($usuario),
        ]);
    }

    /** Próximas citas por atender, desde hoy, en orden de fecha y hora (el psicólogo ve solo las suyas). */
    private function proximasCitas($usuario): array
    {
        return Cita::with(['paciente:id,nombres,apellidos', 'psicologo:id,name'])
            ->whereDate('fecha', '>=', today())
            ->whereIn('estado', ['pendiente', 'confirmada'])
            ->when($usuario->isPsicologo(), fn ($q) => $q->where('psicologo_id', $usuario->id))
            ->orderBy('fecha')
            ->orderBy('hora')
            ->limit(6)
            ->get()
            ->map(fn (Cita $c) => [
                'id' => $c->id,
                'fecha' => $c->fecha->toDateString(),
                'hora' => substr((string) $c->hora, 0, 5),
                'paciente' => $c->paciente?->nombre_completo,
                'psicologo' => $c->psicologo?->name,
                'estado' => $c->estado,
                'pagado' => $c->pagado,
            ])
            ->all();
    }

    public function auditoria(Request $request): JsonResponse
    {
        return response()->json(
            Auditoria::with('usuario:id,name,role')
                ->when($request->filled('accion'), fn ($q) => $q->where('accion', 'like', $request->string('accion').'%'))
                ->when($request->filled('user_id'), fn ($q) => $q->where('user_id', $request->integer('user_id')))
                ->when($request->filled('desde'), fn ($q) => $q->whereDate('created_at', '>=', $request->date('desde')))
                ->when($request->filled('hasta'), fn ($q) => $q->whereDate('created_at', '<=', $request->date('hasta')))
                ->latest('id')
                ->paginate(30)
        );
    }
}
