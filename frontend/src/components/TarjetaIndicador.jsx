import { avance, formatoValor, infoEstado, textoMeta } from '../utils/indicadores';

/** Tarjeta de un indicador de gestión: valor, estado frente a la meta (con icono y texto) y barra de avance. */
export default function TarjetaIndicador({ indicador }) {
  const e = infoEstado(indicador.estado);
  const pct = avance(indicador);
  return (
    <article className={`kpi kpi--${e.clase}`} data-testid={`kpi-${indicador.id}`} aria-labelledby={`kpi-t-${indicador.id}`}>
      <header className="kpi__cabecera">
        <h3 id={`kpi-t-${indicador.id}`}>{indicador.nombre}</h3>
        <span className="kpi__id">{indicador.id}</span>
      </header>
      <strong className="kpi__valor">{formatoValor(indicador.valor, indicador.unidad)}</strong>
      <p className="kpi__estado"><span aria-hidden="true">{e.icono}</span> {e.texto}</p>
      {pct !== null && (
        <div className="kpi__barra" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label={`Avance hacia la meta: ${Math.round(pct)} %`}>
          <span style={{ width: `${pct}%` }} />
        </div>
      )}
      <p className="kpi__meta">{textoMeta(indicador)}</p>
      {indicador.detalle && <p className="kpi__detalle">{indicador.detalle}</p>}
    </article>
  );
}

/** Rejilla de indicadores con el resumen por estado. */
export function RejillaIndicadores({ indicadores, vacio = 'No hay indicadores para tu rol o plan.' }) {
  if (!indicadores?.length) return <p className="vacio">{vacio}</p>;
  return (
    <div className="kpis" data-cy="kpis">
      {indicadores.map((i) => <TarjetaIndicador key={i.id} indicador={i} />)}
    </div>
  );
}
