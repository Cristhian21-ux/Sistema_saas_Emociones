import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { obtener } from '../services/api';
import Aviso from '../components/Aviso';
import BotonPdf from '../components/BotonPdf';
import Icono from '../components/Icono';
import { useAuth } from '../context/AuthContext';
import { formatoSoles } from '../utils/validaciones';

const ESTADOS = {
  pendiente: 'Pendiente de pago', confirmada: 'Confirmada', atendida: 'Atendida',
  cancelada: 'Cancelada', no_agendada: 'No agendada',
};

/** Saludo según la hora del día. */
export function saludo(fecha = new Date()) {
  const h = fecha.getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

const fechaLarga = (fecha = new Date()) => fecha.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });

/**
 * Cifra del resumen. `a` la vuelve un enlace al módulo; `detalle` es la línea de contexto.
 * El tono solo se usa para destacar lo que pide atención (alerta), no para decorar.
 */
export function Indicador({ titulo, valor, tono = 'principal', detalle, a }) {
  const contenido = (
    <>
      <span>{titulo}</span>
      <strong data-testid={`indicador-${titulo}`}>{valor}</strong>
      {detalle && <small>{detalle}</small>}
    </>
  );
  const clase = `indicador indicador--${tono}`;
  return a ? <Link to={a} className={`${clase} indicador--enlace`}>{contenido}</Link> : <div className={clase}>{contenido}</div>;
}

/** "Hoy", "Mañana" o la fecha corta ("mié 25 nov") de una cita en formato AAAA-MM-DD. */
export function etiquetaDia(iso, hoy = new Date()) {
  const [a, m, d] = iso.split('-').map(Number);
  const fecha = new Date(a, m - 1, d);
  const base = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const dias = Math.round((fecha - base) / 86400000);
  if (dias === 0) return 'Hoy';
  if (dias === 1) return 'Mañana';
  return fecha.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' }).replaceAll('.', '');
}

function ProximasCitas({ citas }) {
  return (
    <section className="tarjeta agenda-hoy" aria-labelledby="titulo-agenda">
      <div className="tarjeta__cabecera">
        <h2 id="titulo-agenda">Próximas citas</h2>
        <Link to="/citas" className="enlace-flecha">Ver agenda <Icono nombre="flecha" tamano={16} /></Link>
      </div>
      {citas.length === 0 ? (
        <p className="vacio">No hay citas pendientes ni confirmadas desde hoy.</p>
      ) : (
        <ol className="agenda-hoy__lista">
          {citas.map((c) => {
            const dia = etiquetaDia(c.fecha);
            return (
              <li key={c.id}>
                <time className="agenda-hoy__cuando" dateTime={`${c.fecha}T${c.hora}`}>
                  <small className={dia === 'Hoy' ? 'es-hoy' : ''}>{dia}</small>
                  <b>{c.hora}</b>
                </time>
                <div className="agenda-hoy__datos">
                  <strong>{c.paciente}</strong>
                  <small>{c.psicologo}</small>
                </div>
                <span className={`estado estado--${c.estado}`}>{ESTADOS[c.estado] || c.estado}</span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function CitasPorEstado({ porEstado }) {
  const estados = Object.entries(porEstado || {}).sort(([, a], [, b]) => b - a);
  const total = estados.reduce((suma, [, n]) => suma + n, 0);
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);

  return (
    <section className="tarjeta estados-citas" aria-labelledby="titulo-estados">
      <div className="tarjeta__cabecera">
        <h2 id="titulo-estados">Citas por estado</h2>
        <span className="estados-citas__total">{total} en total</span>
      </div>
      {total === 0 ? <p className="vacio">Aún no hay citas registradas.</p> : (
        <>
          <div className="estados-citas__barra" role="img" aria-label={estados.map(([e, n]) => `${ESTADOS[e] || e}: ${n}`).join(', ')}>
            {estados.map(([estado, n]) => <i key={estado} className={`tono--${estado}`} style={{ flexGrow: n }} />)}
          </div>
          <ul className="estados-citas__leyenda">
            {estados.map(([estado, n]) => (
              <li key={estado}>
                <i className={`tono--${estado}`} aria-hidden="true" />
                <span>{ESTADOS[estado] || estado}</span>
                <b>{n}</b>
                <small>{pct(n)} %</small>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

export default function Panel() {
  const { usuario } = useAuth();
  const [m, setM] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargar = async () => {
      const { data, error: fallo } = await obtener('/dashboard');
      if (fallo) setError(fallo);
      else setM(data);
    };
    void cargar();
  }, []);

  return (
    <>
      <header className="cabecera cabecera--acciones saludo">
        <div>
          <p className="saludo__fecha">{fechaLarga()}</p>
          <h1>{saludo()}, {usuario.name.split(' ')[0]}</h1>
          <p>{usuario.centro?.nombre}</p>
        </div>
        {m && <BotonPdf tipo="panel" onError={setError} />}
      </header>
      <Aviso tipo="error">{error}</Aviso>
      {!m && !error && <p className="vacio">Cargando…</p>}
      {m && (
        <>
          <div className="indicadores indicadores--franja" aria-label="Resumen del centro">
            <Indicador titulo="Citas hoy" valor={m.citas_hoy} a="/citas" detalle="programadas" />
            <Indicador titulo="Pacientes" valor={m.pacientes} a="/pacientes" detalle="registrados" />
            <Indicador titulo="Por cobrar" valor={m.citas_pendientes_pago} a="/citas" detalle="citas sin pago" />
            <Indicador titulo="Ingresos del mes" valor={formatoSoles(m.ingresos_mes)} detalle="pagos registrados" />
            <Indicador titulo="En espera" valor={m.en_espera} a={usuario.role === 'psicologo' ? undefined : '/espera'} detalle="pacientes" />
            <Indicador titulo="Alertas clínicas" valor={m.alertas_evaluacion} tono={m.alertas_evaluacion > 0 ? 'alerta' : 'principal'}
              a={usuario.role === 'recepcionista' ? undefined : '/evaluaciones'} detalle="evaluaciones de riesgo" />
          </div>
          <div className="panel-rejilla">
            <ProximasCitas citas={m.proximas_citas || []} />
            <CitasPorEstado porEstado={m.citas_por_estado} />
          </div>
        </>
      )}
    </>
  );
}
