<?php

namespace App\Services\Indicadores;

/**
 * Un indicador de gestión (hoja 11 de la matriz): valor calculado, meta, umbral de alerta
 * y estado frente a la meta con la misma regla que la matriz.
 */
class Indicador
{
    public const MAYOR = 'Mayor es mejor';

    public const MENOR = 'Menor es mejor';

    public const INFORMATIVO = 'Informativo';

    /**
     * @param  string  $id  ID del catálogo (KPI-xx)
     * @param  float|int|null  $valor  null cuando todavía no hay datos para calcularlo
     */
    public static function crear(string $id, string $nombre, float|int|null $valor, string $unidad, string $sentido,
        float|int|null $meta = null, float|int|null $umbral = null, string $detalle = ''): array
    {
        return [
            'id' => $id,
            'nombre' => $nombre,
            'valor' => $valor === null ? null : round((float) $valor, 1),
            'unidad' => $unidad,
            'sentido' => $sentido,
            'meta' => $meta,
            'umbral' => $umbral,
            'estado' => self::estado($valor, $sentido, $meta, $umbral),
            'detalle' => $detalle,
        ];
    }

    /** Cumple, En riesgo, No cumple, Sin datos o Informativo. */
    public static function estado(float|int|null $valor, string $sentido, float|int|null $meta, float|int|null $umbral): string
    {
        if ($valor === null) {
            return 'Sin datos';
        }
        if ($sentido === self::INFORMATIVO || $meta === null) {
            return 'Informativo';
        }
        $mejor = fn ($a, $b) => $sentido === self::MAYOR ? $a >= $b : $a <= $b;
        if ($mejor($valor, $meta)) {
            return 'Cumple';
        }

        return $umbral !== null && $mejor($valor, $umbral) ? 'En riesgo' : 'No cumple';
    }

    /** Porcentaje de $parte sobre $total; null si el total es 0 (no hay base para medir). */
    public static function porcentaje(int $parte, int $total): ?float
    {
        return $total > 0 ? 100 * $parte / $total : null;
    }
}
