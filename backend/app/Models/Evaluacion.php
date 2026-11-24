<?php

namespace App\Models;

use App\Models\Concerns\PerteneceACentro;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Prueba psicológica estandarizada (PHQ-9 / GAD-7) calificada automáticamente. */
class Evaluacion extends Model
{
    use PerteneceACentro;

    protected $table = 'evaluaciones';

    protected $fillable = [
        'centro_id', 'paciente_id', 'psicologo_id', 'instrumento', 'respuestas', 'puntaje',
        'severidad', 'alerta', 'interpretacion', 'fuente',
    ];

    /** Respuestas e interpretación se guardan cifradas (AES-256 con la APP_KEY). */
    protected $casts = ['respuestas' => 'encrypted:array', 'interpretacion' => 'encrypted', 'alerta' => 'boolean'];

    public function paciente(): BelongsTo
    {
        return $this->belongsTo(Paciente::class);
    }
}
