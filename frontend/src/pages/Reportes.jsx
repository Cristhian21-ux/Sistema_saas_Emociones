import { useCallback, useEffect, useState } from 'react';
import { obtener } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Aviso from '../components/Aviso';
import Campo from '../components/Campo';
import Tabla from '../components/Tabla';
import { Indicador } from './Panel';
import { Barras, Columnas } from '../components/Graficos';
import { formatoSoles } from '../utils/validaciones';
import { filtrosIniciales, nombreMes, porcentaje, validarFiltros } from '../utils/reportes';

const ESTADOS = {
  pendiente: 'Pendiente de pago', confirmada: 'Confirmada', atendida: 'Atendida', cancelada: 'Cancelada', no_agendada: 'No agendada',
};

export default function Reportes() {
  const { usuario } = useAuth();
  const esPsicologo = usuario.role === 'psicologo';
  const [filtros, setFiltros] = useState(filtrosIniciales);
  const [errores, setErrores] = useState({});
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const consultar = useCallback(async (valores) => {
    setCargando(true);
    const params = Object.fromEntries(Object.entries(valores).filter(([, v]) => v !== ''));
    const { data, error: fallo } = await obtener('/reportes/indicadores', { params });
    setCargando(false);
    setError(fallo || '');
    if (data) setDatos(data);
  }, []);

  useEffect(() => { void consultar(filtrosIniciales()); }, [consultar]);

  const cambiar = (e) => setFiltros({ ...filtros, [e.target.name]: e.target.value });

  const aplicar = (e) => {
    e.preventDefault();
    const encontrados = validarFiltros(filtros);
    setErrores(encontrados);
    if (!Object.keys(encontrados).length) void consultar(filtros);
  };

  const limpiar = () => {
    const iniciales = filtrosIniciales();
    setFiltros(iniciales);
    setErrores({});
    void consultar(iniciales);
  };

  const r = datos?.resumen;

  return (
    <>
      <header className="cabecera">
        <h1>Reportes e impacto</h1>
        <p>Indicadores calculados con las citas, pagos, evaluaciones y lista de espera registrados en el sistema.</p>
      </header>

      <form className="tarjeta filtros" onSubmit={aplicar} noValidate aria-label="Filtros del reporte" data-cy="filtros">
        <Campo label="Desde" nombre="desde" type="date" value={filtros.desde} onChange={cambiar} error={errores.desde} />
        <Campo label="Hasta" nombre="hasta" type="date" value={filtros.hasta} onChange={cambiar} error={errores.hasta} />
        <Campo label="Estado de la cita" nombre="estado" as="select" value={filtros.estado} onChange={cambiar}>
          <option value="">Todos</option>
          {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Campo>
        {!esPsicologo && (
          <Campo label="Psicólogo" nombre="psicologo_id" as="select" value={filtros.psicologo_id} onChange={cambiar}>
            <option value="">Todos</option>
            {(datos?.psicologos || []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Campo>
        )}
        <div className="filtros__acciones">
          <button type="submit" className="btn" disabled={cargando} data-cy="aplicar">{cargando ? 'Consultando…' : 'Aplicar filtros'}</button>
          <button type="button" className="btn btn--fantasma" onClick={limpiar} data-cy="limpiar">Limpiar</button>
        </div>
      </form>

      <Aviso tipo="error">{error}</Aviso>
      {!datos && !error && <p className="vacio">Cargando…</p>}

      {r && (
        <div aria-live="polite" aria-busy={cargando}>
          <p className="periodo" data-cy="periodo">
            Periodo: <b>{datos.filtros.desde}</b> al <b>{datos.filtros.hasta}</b>
            {datos.filtros.estado && <> · Estado: <b>{ESTADOS[datos.filtros.estado]}</b></>}
          </p>
          <div className="indicadores" data-cy="indicadores">
            <Indicador titulo="Citas registradas" valor={r.total_citas} />
            <Indicador titulo="Citas atendidas" valor={r.citas_atendidas} tono="salvia" />
            <Indicador titulo="Tasa de asistencia" valor={porcentaje(r.tasa_asistencia)} tono="salvia" />
            <Indicador titulo="Tasa de cancelación" valor={porcentaje(r.tasa_cancelacion)} tono="alerta" />
            <Indicador titulo="Ingresos" valor={formatoSoles(r.ingresos)} tono="acento" />
            <Indicador titulo="Ticket promedio" valor={formatoSoles(r.ticket_promedio)} tono="acento" />
            <Indicador titulo="Pacientes atendidos" valor={r.pacientes_atendidos} />
            <Indicador titulo="Pacientes nuevos" valor={r.pacientes_nuevos} tono="salvia" />
            <Indicador titulo="Evaluaciones" valor={r.evaluaciones} />
            <Indicador titulo="Alertas clínicas" valor={r.alertas_clinicas} tono="alerta" />
            <Indicador titulo="Cupos reasignados" valor={`${r.lista_espera_reasignados} de ${r.lista_espera_total}`} tono="salvia" />
          </div>

          <section className="tarjeta bloque">
            <h2>Citas por mes</h2>
            <Columnas serie={datos.citas_por_mes} a="atendidas" b="canceladas" etiquetaA="Atendidas" etiquetaB="Canceladas / no asistió" etiquetaPeriodo={nombreMes} titulo="Citas por mes" prueba="grafico-mes" />
          </section>

          <div className="dos-columnas">
            <section className="tarjeta">
              <h2>Citas por estado</h2>
              <Barras datos={datos.citas_por_estado} etiqueta={(k) => ESTADOS[k] || k} prueba="grafico-estado" />
            </section>
            <section className="tarjeta">
              <h2>Ingresos por método de pago</h2>
              <Barras datos={datos.ingresos_por_metodo} formato={formatoSoles} prueba="grafico-metodo" />
            </section>
            <section className="tarjeta">
              <h2>Evaluaciones por severidad</h2>
              <Barras datos={datos.evaluaciones_por_severidad} etiqueta={(k) => k.replaceAll('_', ' ')} />
            </section>
            <section className="tarjeta">
              <h2>Desempeño por psicólogo</h2>
              <Tabla
                vacio="Sin citas en el periodo."
                filas={datos.por_psicologo.map((p, i) => ({ ...p, id: i }))}
                columnas={[
                  { titulo: 'Psicólogo', valor: (p) => p.psicologo },
                  { titulo: 'Citas', valor: (p) => p.total },
                  { titulo: 'Atendidas', valor: (p) => p.atendidas },
                  { titulo: 'Asistencia', valor: (p) => porcentaje(p.tasa_asistencia) },
                  { titulo: 'Ingresos', valor: (p) => formatoSoles(p.ingresos) },
                ]}
              />
            </section>
          </div>
        </div>
      )}
    </>
  );
}
