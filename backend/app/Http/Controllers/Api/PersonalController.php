<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Auditor;
use App\Services\HorarioAtencion;
use App\Services\LimitesPlan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/** Gestión del personal del centro (solo administrador del centro). */
class PersonalController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(
            User::where('centro_id', $request->user()->centro_id)
                ->when($request->filled('role'), fn ($q) => $q->where('role', $request->string('role')))
                ->orderBy('name')
                ->get(['id', 'name', 'email', 'role', 'especialidad', 'activo', 'horario'])
                ->map(fn (User $u) => $u->only(['id', 'name', 'email', 'role', 'especialidad', 'activo', 'horario'])
                    + ['horario_resumen' => $u->isPsicologo() ? HorarioAtencion::resumen($u) : null])
        );
    }

    public function store(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'unique:users,email'],
            'role' => ['required', Rule::in(['admin', 'recepcionista', 'psicologo'])],
            'especialidad' => ['nullable', 'required_if:role,psicologo', 'string', 'max:120'],
            'password' => ['required', Password::min(8)->letters()->numbers()],
        ] + HorarioAtencion::reglas());
        $datos['horario'] = $datos['role'] === 'psicologo' ? HorarioAtencion::normalizar($datos['horario'] ?? null) : null;

        $centro = $request->user()->centro;
        if ($datos['role'] === 'psicologo' && ! LimitesPlan::puedeAgregarPsicologo($centro)) {
            return response()->json(['message' => "Tu plan {$centro->plan->nombre} permite hasta {$centro->plan->max_psicologos} psicólogos."], 402);
        }

        $usuario = User::create($datos + ['centro_id' => $centro->id]);
        Auditor::registrar('personal.creado', $usuario, ['role' => $usuario->role]);

        return response()->json($usuario, 201);
    }

    /**
     * Edita los datos de un miembro del personal. La contraseña es opcional (solo si se quiere
     * restablecer). Si cambian el rol o la contraseña se cierran sus sesiones abiertas.
     */
    public function update(Request $request, User $usuario): JsonResponse
    {
        abort_if($usuario->centro_id !== $request->user()->centro_id, 404);

        $datos = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($usuario->id)],
            'role' => ['required', Rule::in(['admin', 'recepcionista', 'psicologo'])],
            'especialidad' => ['nullable', 'required_if:role,psicologo', 'string', 'max:120'],
            'password' => ['nullable', Password::min(8)->letters()->numbers()],
        ] + HorarioAtencion::reglas());

        if ($usuario->id === $request->user()->id && $datos['role'] !== $usuario->role) {
            return response()->json(['message' => 'No puedes cambiar tu propio rol.', 'errors' => ['role' => ['No puedes cambiar tu propio rol.']]], 422);
        }

        $centro = $request->user()->centro;
        $pasaAPsicologo = $datos['role'] === 'psicologo' && ! $usuario->isPsicologo();
        if ($pasaAPsicologo && $usuario->activo && ! LimitesPlan::puedeAgregarPsicologo($centro)) {
            return response()->json(['message' => "Tu plan {$centro->plan->nombre} permite hasta {$centro->plan->max_psicologos} psicólogos."], 402);
        }

        if ($datos['role'] !== 'psicologo') {
            $datos['especialidad'] = null;
            $datos['horario'] = null;
        } elseif (array_key_exists('horario', $datos)) {
            $datos['horario'] = HorarioAtencion::normalizar($datos['horario']);
        }
        $cambiaAcceso = $datos['role'] !== $usuario->role || filled($datos['password'] ?? null);
        if (blank($datos['password'] ?? null)) {
            unset($datos['password']);
        }

        $usuario->update($datos);
        if ($cambiaAcceso && $usuario->id !== $request->user()->id) {
            $usuario->tokens()->delete();
        }
        Auditor::registrar('personal.actualizado', $usuario, ['role' => $usuario->role]);

        return response()->json($usuario->only(['id', 'name', 'email', 'role', 'especialidad', 'activo', 'horario']));
    }

    /** Activar/desactivar en lugar de borrar: se conserva el historial. */
    public function alternarActivo(Request $request, User $usuario): JsonResponse
    {
        abort_if($usuario->centro_id !== $request->user()->centro_id, 404);
        abort_if($usuario->id === $request->user()->id, 422, 'No puedes desactivar tu propia cuenta.');

        if (! $usuario->activo && $usuario->isPsicologo() && ! LimitesPlan::puedeAgregarPsicologo($request->user()->centro)) {
            return response()->json(['message' => 'Tu plan no permite más psicólogos activos.'], 402);
        }

        $usuario->update(['activo' => ! $usuario->activo]);
        $usuario->tokens()->delete();
        Auditor::registrar($usuario->activo ? 'personal.activado' : 'personal.desactivado', $usuario);

        return response()->json($usuario->only(['id', 'name', 'activo']));
    }
}
