<?php

namespace App\Services;

use App\Models\Cita;
use App\Models\User;
use Illuminate\Support\Carbon;

/**
 * Agenda digital: horas libres de un psicólogo en una fecha, según SU horario de atención
 * (o el horario general del centro si no tiene uno) y las citas que ya ocupan la agenda.
 */
class Disponibilidad
{
    /**
     * Horas de inicio ofrecidas ese día ("H:i"). Vacío si ese día no atiende.
     * Sin psicólogo se usa el horario general del centro (config/centro.php).
     */
    public static function horasDelDia(string $fecha, ?User $psicologo = null): array
    {
        $tramo = HorarioAtencion::tramo($psicologo, Carbon::parse($fecha)->dayOfWeekIso);
        if ($tramo === null) {
            return [];
        }

        $cfg = config('centro.horario');
        $horas = [];
        $inicio = Carbon::parse("$fecha {$tramo['inicio']}");
        $fin = Carbon::parse("$fecha {$tramo['fin']}");

        while ($inicio->copy()->addMinutes($cfg['duracion'])->lte($fin)) {
            $hora = $inicio->format('H:i');
            // El refrigerio del centro solo se descuenta si cae en medio del turno (no al inicio ni al final).
            $esRefrigerio = in_array($hora, $cfg['descanso'], true) && $hora > $tramo['inicio']
                && $inicio->copy()->addMinutes($cfg['duracion'])->lt($fin);
            if (! $esRefrigerio) {
                $horas[] = $hora;
            }
            $inicio->addMinutes($cfg['duracion']);
        }

        return $horas;
    }

    public static function ocupadas(int $psicologoId, string $fecha, ?int $exceptoCitaId = null): array
    {
        return Cita::query()
            ->where('psicologo_id', $psicologoId)
            ->whereDate('fecha', $fecha)
            ->whereNotIn('estado', Cita::ESTADOS_LIBRES)
            ->when($exceptoCitaId, fn ($q) => $q->where('id', '!=', $exceptoCitaId))
            ->pluck('hora')
            ->all();
    }

    /** Horas libres y todavía no pasadas. */
    public static function libres(int $psicologoId, string $fecha, ?int $exceptoCitaId = null): array
    {
        $ocupadas = self::ocupadas($psicologoId, $fecha, $exceptoCitaId);

        return array_values(array_filter(
            self::horasDelDia($fecha, User::find($psicologoId)),
            fn (string $hora) => ! in_array($hora, $ocupadas, true) && Carbon::parse("$fecha $hora")->isFuture()
        ));
    }

    public static function estaLibre(int $psicologoId, string $fecha, string $hora, ?int $exceptoCitaId = null): bool
    {
        return in_array($hora, self::horasDelDia($fecha, User::find($psicologoId)), true)
            && ! in_array($hora, self::ocupadas($psicologoId, $fecha, $exceptoCitaId), true);
    }
}
