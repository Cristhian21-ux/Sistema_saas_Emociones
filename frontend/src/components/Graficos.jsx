/** Gráficos accesibles reutilizables (barras y columnas) sin librerías externas. */

/** Barras horizontales: cada fila tiene texto y valor, no solo color. */
export function Barras({ datos, formato = (v) => v, etiqueta = (k) => k, prueba }) {
  const filas = Object.entries(datos || {});
  if (!filas.length) return <p className="vacio">Sin datos para los filtros elegidos.</p>;
  const maximo = Math.max(1, ...filas.map(([, v]) => Number(v)));
  return (
    <ul className="barras" data-cy={prueba}>
      {filas.map(([clave, valor]) => (
        <li key={clave} className="barra">
          <span>{etiqueta(clave)}</span>
          <div aria-hidden="true"><i style={{ width: `${(Number(valor) / maximo) * 100}%` }} /></div>
          <b>{formato(valor)}</b>
        </li>
      ))}
    </ul>
  );
}

/**
 * Columnas apiladas por periodo con dos series (p. ej. atendidas/canceladas o exitosos/fallidos).
 * Incluye leyenda y un aria-label con todos los valores para lectores de pantalla.
 */
export function Columnas({ serie, a, b, etiquetaA, etiquetaB, etiquetaPeriodo = (p) => p, titulo, prueba }) {
  if (!serie?.length) return <p className="vacio">Sin datos.</p>;
  const maximo = Math.max(1, ...serie.map((m) => (m[a] || 0) + (m[b] || 0)));
  const resumen = serie.map((m) => `${etiquetaPeriodo(m.periodo)}: ${m[a]} ${etiquetaA}, ${m[b]} ${etiquetaB}`).join('; ');
  const angosta = serie.length > 16;
  return (
    <figure className={`columnas ${angosta ? 'columnas--angostas' : ''}`} data-cy={prueba}>
      <div className="columnas__area" role="img" aria-label={`${titulo}. ${resumen}`}>
        {serie.map((m) => (
          <div key={m.periodo} className="columnas__grupo" title={`${etiquetaPeriodo(m.periodo)}: ${m[a]} ${etiquetaA}, ${m[b]} ${etiquetaB}`}>
            <div className="columnas__pila">
              <i className="columnas__atendidas" style={{ height: `${(m[a] / maximo) * 100}%` }} />
              <i className="columnas__canceladas" style={{ height: `${(m[b] / maximo) * 100}%` }} />
            </div>
            <small>{etiquetaPeriodo(m.periodo)}</small>
            {!angosta && <b>{m[a] + m[b]}</b>}
          </div>
        ))}
      </div>
      <figcaption className="leyenda">
        <span><i className="columnas__atendidas" /> {etiquetaA}</span>
        <span><i className="columnas__canceladas" /> {etiquetaB}</span>
      </figcaption>
    </figure>
  );
}
