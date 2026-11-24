<?php

namespace App\Services;

use App\Models\User;
use Closure;

/**
 * Horario de atención de cada psicólogo (qué días atiende y de qué hora a qué hora).
 * Formato guardado: ["1" => ["inicio" => "08:00", "fin" => "13:00"], ...] con 1 = lunes ... 7 = domingo.
 * Si el psicólogo no tiene horario (null) se usa el horario general del centro.
 */
class HorarioAtencion
{
    public const DIAS = [1 => 'lunes', 2 => 'martes', 3 => 'miércoles', 4 => 'jueves', 5 => 'viernes', 6 => 'sábado', 7 => 'domingo'];

    /** Para frases como «no atiende los sábados». */
    public const DIAS_PLURAL = [1 => 'lunes', 2 => 'martes', 3 => 'miércoles', 4 => 'jueves', 5 => 'viernes', 6 => 'sábados', 7 => 'domingos'];

    private const CORTOS = [1 => 'Lun', 2 => 'Mar', 3 => 'Mié', 4 => 'Jue', 5 => 'Vie', 6 => 'Sáb', 7 => 'Dom'];

    private const PRIMERA = '06:00';

    private const ULTIMA = '22:00';

    /** Tramo del día ["inicio", "fin"] del psicólogo, o null si ese día no atiende. */
    public static function tramo(?User $psicologo, int $diaIso): ?array
    {
        if ($psicologo === null || $psicologo->horario === null) {
            $cfg = config('centro.horario');

            return in_array($diaIso, $cfg['dias'], true) ? ['inicio' => $cfg['inicio'], 'fin' => $cfg['fin']] : null;
        }

        return $psicologo->horario[(string) $diaIso] ?? null;
    }

    /** Reglas de validación del campo "horario" (null = horario general del centro). */
    public static function reglas(): array
    {
        return [
            'horario' => ['nullable', 'array', Closure::fromCallable([self::class, 'validar'])],
        ];
    }

    /** Valida días (1–7), formato H:i en punto o y media, inicio antes que fin y al menos una cita de duración. */
    public static function validar(string $atributo, mixed $valor, Closure $fallar): void
    {
        if (! is_array($valor)) {
            return;
        }
        if ($valor === []) {
            $fallar('Marca al menos un día de atención.');

            return;
        }
        $duracion = (int) config('centro.horario.duracion');
        foreach ($valor as $dia => $tramo) {
            $nombre = self::DIAS[(int) $dia] ?? null;
            if ($nombre === null || ! is_array($tramo)) {
                $fallar('Hay un día de atención no válido.');

                return;
            }
            $inicio = $tramo['inicio'] ?? null;
            $fin = $tramo['fin'] ?? null;
            if (! self::esHora($inicio) || ! self::esHora($fin)) {
                $fallar("Indica la hora de inicio y de fin del $nombre (en punto o y media).");

                return;
            }
            if ($inicio < self::PRIMERA || $fin > self::ULTIMA) {
                $fallar('El horario del '.$nombre.' debe estar entre las '.self::PRIMERA.' y las '.self::ULTIMA.'.');

                return;
            }
            if (self::minutos($fin) - self::minutos($inicio) < $duracion) {
                $fallar("El $nombre la hora de fin debe ser al menos $duracion minutos después del inicio.");

                return;
            }
        }
    }

    /** Ordena por día y deja solo inicio y fin (lo que se guarda). */
    public static function normalizar(?array $horario): ?array
    {
        if ($horario === null) {
            return null;
        }
        ksort($horario);
        $limpio = [];
        foreach ($horario as $dia => $tramo) {
            $limpio[(string) (int) $dia] = ['inicio' => $tramo['inicio'], 'fin' => $tramo['fin']];
        }

        return $limpio;
    }

    /** "Lun–Vie 08:00–13:00 · Sáb 09:00–12:00"; agrupa días seguidos con la misma hora. */
    public static function resumen(?User $psicologo): string
    {
        $grupos = [];
        foreach (array_keys(self::DIAS) as $dia) {
            $tramo = self::tramo($psicologo, $dia);
            if ($tramo === null) {
                continue;
            }
            $horas = "{$tramo['inicio']}–{$tramo['fin']}";
            $ultimo = array_key_last($grupos);
            if ($ultimo !== null && $grupos[$ultimo]['horas'] === $horas && $grupos[$ultimo]['hasta'] === $dia - 1) {
                $grupos[$ultimo]['hasta'] = $dia;
            } else {
                $grupos[] = ['desde' => $dia, 'hasta' => $dia, 'horas' => $horas];
            }
        }

        return implode(' · ', array_map(fn ($g) => self::CORTOS[$g['desde']]
            .($g['hasta'] > $g['desde'] ? '–'.self::CORTOS[$g['hasta']] : '').' '.$g['horas'], $grupos)) ?: 'Sin días de atención';
    }

    private static function esHora(mixed $valor): bool
    {
        return is_string($valor) && preg_match('/^([01]\d|2[0-3]):(00|30)$/', $valor) === 1;
    }

    private static function minutos(string $hora): int
    {
        [$h, $m] = explode(':', $hora);

        return (int) $h * 60 + (int) $m;
    }
}
