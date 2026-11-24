<?php

namespace App\Models;

use App\Models\Concerns\PerteneceACentro;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HistoriaClinica extends Model
{
    use PerteneceACentro;

    protected $table = 'historias_clinicas';

    protected $fillable = [
        'centro_id', 'paciente_id', 'cita_id', 'psicologo_id', 'diagnostico', 'observaciones',
        'proxima_cita_recomendada', 'emocion_detectada', 'nivel_riesgo',
    ];

    /** Diagnóstico y observaciones se guardan cifrados (AES-256 con la APP_KEY). */
    protected $casts = [
        'proxima_cita_recomendada' => 'date:Y-m-d',
        'diagnostico' => 'encrypted',
        'observaciones' => 'encrypted',
    ];

    public function paciente(): BelongsTo
    {
        return $this->belongsTo(Paciente::class);
    }

    public function psicologo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'psicologo_id');
    }
}
