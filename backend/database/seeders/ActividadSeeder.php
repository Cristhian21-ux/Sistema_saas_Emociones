<?php

namespace Database\Seeders;

use App\Models\Auditoria;
use App\Models\Centro;
use App\Models\Cita;
use App\Models\Evaluacion;
use App\Models\ListaEspera;
use App\Models\Paciente;
use App\Models\User;
use App\Services\EvaluacionLocal;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * Historial de atención de los últimos 6 meses para el centro de demostración:
 * citas pasadas (atendidas, canceladas, no agendadas), pagos, evaluaciones PHQ-9/GAD-7
 * y lista de espera. Así el módulo de reportes tiene registros que procesar.
 *
 * Solo crea citas en fechas PASADAS para no ocupar la agenda futura.
 * Es reproducible (semilla fija). Ejecutar: php artisan db:seed --class=ActividadSeeder
 */
class ActividadSeeder extends Seeder
{
    private const HORAS = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

    private const MOTIVOS = ['Ansiedad', 'Evaluación inicial', 'Terapia de pareja', 'Duelo', 'Estrés laboral', 'Seguimiento', 'Problemas de sueño'];

    private const METODOS = ['efectivo', 'yape', 'plin', 'transferencia', 'tarjeta'];

    public function run(): void
    {
        $centro = Centro::where('slug', 'emociones-huancayo')->first();
        if (! $centro) {
            return;
        }
        mt_srand(2026);

        $psicologos = User::where('centro_id', $centro->id)->where('role', 'psicologo')->get();
        $recepcion = User::where('centro_id', $centro->id)->where('role', 'recepcionista')->value('id');
        $pacientes = Paciente::where('centro_id', $centro->id)->get();
        if ($psicologos->isEmpty() || $pacientes->isEmpty()) {
            return;
        }

        // Los pacientes llegaron al centro en distintos meses (indicador "pacientes nuevos").
        foreach ($pacientes as $i => $paciente) {
            $paciente->forceFill(['created_at' => now()->subMonths(5 - ($i % 6))->startOfMonth()->addDays(mt_rand(0, 20))])->save();
        }

        $comprobante = 1;
        $ocupado = [];
        for ($dias = 175; $dias >= 1; $dias--) {
            $fecha = now()->subDays($dias);
            if ($fecha->dayOfWeekIso === 7) {
                continue;
            }
            // Más citas en los meses recientes: refleja la adopción del sistema.
            $porDia = mt_rand(0, $dias > 90 ? 1 : 2);
            for ($n = 0; $n < $porDia; $n++) {
                $psicologo = $psicologos[mt_rand(0, $psicologos->count() - 1)];
                $hora = self::HORAS[mt_rand(0, count(self::HORAS) - 1)];
                $clave = $psicologo->id.$fecha->toDateString().$hora;
                if (isset($ocupado[$clave])) {
                    continue;
                }
                $ocupado[$clave] = true;
                $comprobante = $this->crearCita($centro, $psicologo, $pacientes->random(), $recepcion, $fecha, $hora, $dias, $comprobante);
            }
        }

        $this->evaluaciones($centro, $psicologos, $pacientes);
        $this->listaEspera($centro, $psicologos, $pacientes);
        $this->accesos($centro);
    }

    private function crearCita(Centro $centro, User $psicologo, Paciente $paciente, ?int $recepcion, Carbon $fecha, string $hora, int $dias, int $comprobante): int
    {
        // Antes del sistema (más de 90 días) había más inasistencias; luego bajan con recordatorios.
        $r = mt_rand(1, 100);
        $faltas = $dias > 90 ? 30 : 14;
        $estado = $r <= $faltas / 2 ? 'cancelada' : ($r <= $faltas ? 'no_agendada' : 'atendida');
        $pagada = $estado === 'atendida';
        $momento = Carbon::parse($fecha->toDateString().' '.$hora);

        $cita = new Cita([
            'centro_id' => $centro->id,
            'paciente_id' => $paciente->id,
            'psicologo_id' => $psicologo->id,
            'recepcionista_id' => $recepcion,
            'fecha' => $fecha->toDateString(),
            'hora' => $hora,
            'motivo' => self::MOTIVOS[mt_rand(0, count(self::MOTIVOS) - 1)],
            'estado' => $estado,
            'monto' => [80, 100, 120][mt_rand(0, 2)],
            'pagado' => $pagada,
            'metodo_pago' => $pagada ? self::METODOS[mt_rand(0, count(self::METODOS) - 1)] : null,
            'comprobante_numero' => $pagada ? sprintf('B001-%06d', $comprobante) : null,
            'pagado_at' => $pagada ? $momento : null,
        ]);
        $cita->created_at = $momento->copy()->subDays(mt_rand(1, 7));
        $cita->updated_at = $momento;
        $cita->save();

        return $pagada ? $comprobante + 1 : $comprobante;
    }

    private function evaluaciones(Centro $centro, $psicologos, $pacientes): void
    {
        for ($i = 0; $i < 30; $i++) {
            $instrumento = $i % 2 ? 'gad7' : 'phq9';
            $respuestas = array_map(fn () => mt_rand(0, 3) > 1 ? mt_rand(1, 3) : 0, range(1, EvaluacionLocal::ITEMS[$instrumento]));
            $resultado = EvaluacionLocal::puntuar($instrumento, $respuestas);
            $evaluacion = new Evaluacion($resultado + [
                'centro_id' => $centro->id,
                'paciente_id' => $pacientes->random()->id,
                'psicologo_id' => $psicologos->random()->id,
                'instrumento' => $instrumento,
                'respuestas' => $respuestas,
            ]);
            $evaluacion->created_at = now()->subDays(mt_rand(1, 170));
            $evaluacion->save();
        }
    }

    /**
     * Historial de accesos de 60 días (MP-01): inicios y cierres de sesión, claves incorrectas,
     * intentos de una cuenta desactivada y altas de personal. Lo usa el reporte de seguridad.
     */
    private function accesos(Centro $centro): void
    {
        $personal = User::where('centro_id', $centro->id)->get();
        $ips = ['192.168.1.10', '192.168.1.11', '192.168.1.15', '192.168.1.20', '181.65.12.40'];
        $evento = function (string $accion, User $u, Carbon $cuando, array $detalle = []) use ($centro, $ips) {
            $a = new Auditoria([
                'centro_id' => $centro->id, 'user_id' => $u->id, 'accion' => $accion,
                'entidad' => in_array($accion, ['login', 'login.bloqueado'], true) ? 'User' : null,
                'entidad_id' => in_array($accion, ['login', 'login.bloqueado'], true) ? $u->id : null,
                'detalle' => $detalle ?: null, 'ip' => $ips[mt_rand(0, count($ips) - 1)],
            ]);
            $a->created_at = $cuando;
            $a->save();
        };

        for ($dias = 60; $dias >= 1; $dias--) {
            $dia = now()->subDays($dias)->startOfDay();
            if ($dia->dayOfWeekIso === 7) {
                continue;
            }
            foreach ($personal as $u) {
                if (mt_rand(1, 100) > 85) {
                    continue; // no vino ese día
                }
                $entrada = $dia->copy()->setTime(mt_rand(7, 9), mt_rand(0, 59));
                // Al inicio del periodo hay más errores de clave; luego bajan (usuarios capacitados).
                if (mt_rand(1, 100) <= ($dias > 30 ? 18 : 7)) {
                    $evento('login.fallido', $u, $entrada->copy()->subMinutes(2), ['email' => $u->email]);
                }
                $evento('login', $u, $entrada);
                if (mt_rand(1, 100) <= 70) {
                    $evento('logout', $u, $entrada->copy()->addHours(mt_rand(4, 9)));
                }
            }
        }

        // Intentos con correos que no existen y de una cuenta desactivada.
        $admin = $personal->firstWhere('role', 'admin');
        $recepcion = $personal->firstWhere('role', 'recepcionista');
        if ($admin && $recepcion) {
            foreach ([45, 44, 20, 6] as $d) {
                $evento('login.fallido', $admin, now()->subDays($d)->setTime(22, mt_rand(0, 59)), ['email' => $admin->email]);
            }
            $evento('personal.desactivado', $admin, now()->subDays(15)->setTime(10, 0));
            $evento('login.bloqueado', $recepcion, now()->subDays(14)->setTime(8, 5), ['email' => $recepcion->email]);
            $evento('personal.activado', $admin, now()->subDays(14)->setTime(9, 0));
            $evento('personal.creado', $admin, now()->subDays(50)->setTime(11, 0), ['role' => 'psicologo']);
        }
    }

    private function listaEspera(Centro $centro, $psicologos, $pacientes): void
    {
        foreach (['agendado', 'agendado', 'agendado', 'notificado', 'en_espera', 'en_espera', 'cancelado'] as $estado) {
            $registro = new ListaEspera([
                'centro_id' => $centro->id,
                'paciente_id' => $pacientes->random()->id,
                'psicologo_id' => $psicologos->random()->id,
                'franja' => 'cualquiera',
                'motivo' => 'Sin cupo en la fecha solicitada',
                'estado' => $estado,
            ]);
            $registro->created_at = now()->subDays(mt_rand(5, 120));
            $registro->save();
        }
    }
}
