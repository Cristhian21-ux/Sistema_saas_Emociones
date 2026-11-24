<?php

namespace Tests\Feature;

use App\Models\Auditoria;
use Tests\TestCase;

/** Reportes PDF de personal y panel (el directorio de pacientes no se exporta: datos personales). */
class ReporteTest extends TestCase
{
    public function test_descarga_el_reporte_del_panel_y_queda_en_la_auditoria(): void
    {
        $centro = $this->centro('premium');
        $this->comoUsuario('psicologo', $centro);

        $this->get('/api/reportes/panel')->assertOk()->assertHeader('Content-Type', 'application/pdf');

        $this->assertTrue(Auditoria::where('accion', 'reporte.descargado')->exists());
    }

    public function test_el_reporte_de_personal_es_solo_para_administracion(): void
    {
        $centro = $this->centro('premium');
        $this->comoUsuario('recepcionista', $centro);
        $this->getJson('/api/reportes/personal')->assertForbidden();

        $this->comoUsuario('admin', $centro);
        $this->get('/api/reportes/personal')->assertOk()->assertHeader('Content-Type', 'application/pdf');
    }

    public function test_sin_sesion_no_se_descargan_reportes(): void
    {
        $this->getJson('/api/reportes/panel')->assertUnauthorized();
    }

    public function test_el_directorio_de_pacientes_ya_no_se_exporta(): void
    {
        $this->comoUsuario('admin', $this->centro('premium'));
        $this->get('/api/reportes/pacientes')->assertNotFound();
    }
}
