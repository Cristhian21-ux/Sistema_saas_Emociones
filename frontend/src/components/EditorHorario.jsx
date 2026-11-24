import { DIAS } from '../utils/horario';

/**
 * Días y horas de atención de un psicólogo. Cada fila: casilla del día + hora de inicio y de fin.
 * Un día sin marcar es día de descanso: recepción no podrá agendarle citas ese día.
 */
export default function EditorHorario({ valor, onChange, error }) {
  const cambiarDia = (n, cambios) => onChange({ ...valor, [n]: { ...valor[n], ...cambios } });

  const copiarATodos = () => {
    const base = DIAS.map(({ n }) => valor[n]).find((d) => d.activo);
    if (!base) return;
    onChange(Object.fromEntries(DIAS.map(({ n }) => [n, valor[n].activo ? { ...valor[n], inicio: base.inicio, fin: base.fin } : valor[n]])));
  };

  return (
    <fieldset className="horario" aria-describedby={error ? 'horario-error' : 'horario-ayuda'}>
      <legend>Días y horas de atención</legend>
      <p className="ayuda" id="horario-ayuda">Los días sin marcar son de descanso. Recepción solo podrá agendar dentro de este horario.</p>
      <div className="horario__dias">
        {DIAS.map(({ n, largo }) => {
          const dia = valor[n];
          return (
            <div key={n} className={`horario__dia ${dia.activo ? '' : 'horario__dia--descanso'}`} data-cy={`horario-dia-${n}`}>
              <label className="horario__check">
                <input type="checkbox" checked={dia.activo} onChange={(e) => cambiarDia(n, { activo: e.target.checked })} />
                <span>{largo}</span>
              </label>
              {dia.activo ? (
                <span className="horario__horas">
                  <label><span className="solo-lector">Hora de inicio del {largo.toLowerCase()}</span>
                    <input type="time" step="1800" min="06:00" max="22:00" value={dia.inicio} onChange={(e) => cambiarDia(n, { inicio: e.target.value })} required />
                  </label>
                  <span aria-hidden="true">a</span>
                  <label><span className="solo-lector">Hora de fin del {largo.toLowerCase()}</span>
                    <input type="time" step="1800" min="06:00" max="22:00" value={dia.fin} onChange={(e) => cambiarDia(n, { fin: e.target.value })} required />
                  </label>
                </span>
              ) : (
                <span className="horario__descanso">Descanso</span>
              )}
            </div>
          );
        })}
      </div>
      <button type="button" className="btn btn--mini btn--fantasma" onClick={copiarATodos}>Usar la hora del primer día en todos los días marcados</button>
      {error && <p className="campo__error" id="horario-error" role="alert">{error}</p>}
    </fieldset>
  );
}
