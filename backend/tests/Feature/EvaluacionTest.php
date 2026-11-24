<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class EvaluacionTest extends TestCase
{
    public function test_plan_gratuito_no_tiene_evaluaciones(): void
    {
        $centro = $this->centro('gratuito');
        $this->comoUsuario('psicologo', $centro);

        $this->postJson('/api/evaluaciones', [
            'paciente_id' => $this->paciente($centro)->id, 'instrumento' => 'gad7', 'respuestas' => array_fill(0, 7, 1),
        ])->assertStatus(402);
    }

    public function test_vip_califica_con_el_servicio_python(): void
    {
        Http::fake(['*/evaluaciones/puntuar' => Http::response([
            'puntaje' => 7, 'severidad' => 'leve', 'alerta' => false, 'interpretacion' => 'GAD7: leve',
        ])]);
        $centro = $this->centro('vip');
        $this->comoUsuario('psicologo', $centro);

        $this->postJson('/api/evaluaciones', [
            'paciente_id' => $this->paciente($centro)->id, 'instrumento' => 'gad7', 'respuestas' => [1, 1, 1, 1, 1, 1, 1],
        ])->assertCreated()->assertJsonPath('fuente', 'ia')->assertJsonPath('severidad', 'leve');
    }

    public function test_si_python_no_responde_se_califica_localmente(): void
    {
        $centro = $this->centro('vip');
        $this->comoUsuario('psicologo', $centro);

        $this->postJson('/api/evaluaciones', [
            'paciente_id' => $this->paciente($centro)->id, 'instrumento' => 'phq9', 'respuestas' => [3, 3, 3, 3, 3, 3, 3, 0, 0],
        ])->assertCreated()
            ->assertJsonPath('fuente', 'local')
            ->assertJsonPath('puntaje', 21)
            ->assertJsonPath('severidad', 'severa')
            ->assertJsonPath('alerta', true);
    }

    public function test_respuestas_incompletas_se_rechazan(): void
    {
        $centro = $this->centro('vip');
        $this->comoUsuario('psicologo', $centro);

        $this->postJson('/api/evaluaciones', [
            'paciente_id' => $this->paciente($centro)->id, 'instrumento' => 'phq9', 'respuestas' => [1, 2],
        ])->assertStatus(422)->assertJsonValidationErrors('respuestas');
    }

    public function test_cada_psicologo_ve_solo_sus_evaluaciones(): void
    {
        $centro = $this->centro('premium');
        $yo = $this->comoUsuario('psicologo', $centro);
        $otro = $this->usuario('psicologo', $centro);
        $datos = ['centro_id' => $centro->id, 'instrumento' => 'gad7', 'respuestas' => array_fill(0, 7, 1), 'puntaje' => 7,
            'severidad' => 'leve', 'alerta' => false, 'interpretacion' => 'x', 'fuente' => 'local'];
        \App\Models\Evaluacion::create($datos + ['paciente_id' => $this->paciente($centro)->id, 'psicologo_id' => $yo->id]);
        \App\Models\Evaluacion::create($datos + ['paciente_id' => $this->paciente($centro)->id, 'psicologo_id' => $otro->id]);

        $this->getJson('/api/evaluaciones')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.psicologo_id', $yo->id);

        $this->comoUsuario('admin', $centro);
        $this->getJson('/api/evaluaciones')->assertOk()->assertJsonCount(2, 'data');
    }
}
