<?php

namespace Tests\Feature;

use App\Models\Evaluacion;
use App\Models\HistoriaClinica;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/** Los textos clínicos quedan cifrados en la base de datos y la aplicación los lee normalmente. */
class CifradoClinicoTest extends TestCase
{
    public function test_el_diagnostico_se_guarda_cifrado_y_la_api_lo_devuelve_legible(): void
    {
        $centro = $this->centro();
        $this->comoUsuario('psicologo', $centro);

        $id = $this->postJson('/api/historias', [
            'paciente_id' => $this->paciente($centro)->id,
            'diagnostico' => 'Episodio depresivo moderado',
            'observaciones' => 'Refiere insomnio',
        ])->assertCreated()->json('id');

        $fila = DB::table('historias_clinicas')->find($id);
        $this->assertStringNotContainsString('depresivo', $fila->diagnostico);
        $this->assertStringNotContainsString('insomnio', $fila->observaciones);

        $this->getJson("/api/historias/{$id}")->assertOk()
            ->assertJsonPath('diagnostico', 'Episodio depresivo moderado')
            ->assertJsonPath('observaciones', 'Refiere insomnio');
    }

    public function test_las_respuestas_de_una_evaluacion_se_guardan_cifradas(): void
    {
        $centro = $this->centro('premium');
        $psicologo = $this->usuario('psicologo', $centro);
        $evaluacion = Evaluacion::create([
            'centro_id' => $centro->id, 'paciente_id' => $this->paciente($centro)->id, 'psicologo_id' => $psicologo->id,
            'instrumento' => 'phq9', 'respuestas' => [3, 3, 3, 3, 3, 3, 3, 3, 3], 'puntaje' => 27,
            'severidad' => 'severa', 'alerta' => true, 'interpretacion' => 'PHQ9: puntaje 27 (severa).', 'fuente' => 'local',
        ]);

        $fila = DB::table('evaluaciones')->find($evaluacion->id);
        $this->assertStringNotContainsString('severa', $fila->interpretacion);
        $this->assertStringNotContainsString('[3,', $fila->respuestas);
        $this->assertSame([3, 3, 3, 3, 3, 3, 3, 3, 3], $evaluacion->fresh()->respuestas);
        $this->assertSame(1, Evaluacion::where('alerta', true)->count()); // los campos para filtrar siguen sin cifrar
    }

    public function test_un_dato_cifrado_no_es_legible_con_otra_llave(): void
    {
        $centro = $this->centro();
        $psicologo = $this->usuario('psicologo', $centro);
        $historia = HistoriaClinica::create([
            'centro_id' => $centro->id, 'paciente_id' => $this->paciente($centro)->id,
            'psicologo_id' => $psicologo->id, 'diagnostico' => 'Duelo',
        ]);
        $cifrado = DB::table('historias_clinicas')->where('id', $historia->id)->value('diagnostico');

        $otraLlave = new \Illuminate\Encryption\Encrypter(random_bytes(32), 'AES-256-CBC');
        $this->expectException(\Illuminate\Contracts\Encryption\DecryptException::class);
        $otraLlave->decryptString($cifrado);
    }
}
