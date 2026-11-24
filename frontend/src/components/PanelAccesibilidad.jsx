import { useEffect, useRef, useState } from 'react';
import { useAccesibilidad } from '../context/AccesibilidadContext';
import { TAMANOS, cambiarTamano, nombreAccesible, textoParaLeer } from '../utils/accesibilidad';

const OPCIONES = [
  { clave: 'contraste', titulo: 'Alto contraste', ayuda: 'Para baja visión o daltonismo.' },
  { clave: 'dislexia', titulo: 'Lectura fácil', ayuda: 'Letra más clara y más espacio entre líneas (dislexia).' },
  { clave: 'reducirMovimiento', titulo: 'Reducir movimiento', ayuda: 'Quita las animaciones y detiene la rotación de fotos.' },
  { clave: 'subrayarEnlaces', titulo: 'Resaltar enlaces y botones', ayuda: 'Los identifica sin depender del color.' },
  { clave: 'cursorGrande', titulo: 'Cursor grande', ayuda: 'Puntero más visible.' },
  { clave: 'focoReforzado', titulo: 'Foco del teclado reforzado', ayuda: 'Marca con un borde grueso dónde estás al usar Tab.' },
  { clave: 'leerAlEnfocar', titulo: 'Leer al enfocar o señalar', ayuda: 'Lee en voz alta el botón, campo o texto que enfocas o señalas.' },
  { clave: 'ocultarImagenes', titulo: 'Ocultar imágenes decorativas', ayuda: 'Quita las fotos y el fondo para concentrarte en el contenido.' },
];

const ELEMENTOS_LEIBLES = 'a, button, input, select, textarea, label, h1, h2, h3, p, li, td, th, [role="button"], [tabindex]';

const vozDisponible = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

/**
 * Botón flotante "Accesibilidad" con las opciones para personas con discapacidad.
 * Se abre con el botón o con Alt + A y se cierra con Escape.
 */
export default function PanelAccesibilidad() {
  const { prefs, cambiar, restablecer } = useAccesibilidad();
  const [abierto, setAbierto] = useState(false);
  const [leyendo, setLeyendo] = useState(false);
  const boton = useRef(null);
  const panel = useRef(null);

  useEffect(() => {
    const teclas = (e) => {
      if (e.altKey && e.key.toLowerCase() === 'a') { e.preventDefault(); setAbierto((v) => !v); }
      if (e.key === 'Escape') setAbierto((v) => { if (v) boton.current?.focus(); return false; });
    };
    window.addEventListener('keydown', teclas);
    return () => window.removeEventListener('keydown', teclas);
  }, []);

  useEffect(() => { if (abierto) panel.current?.querySelector('button, input')?.focus(); }, [abierto]);

  useEffect(() => () => { if (vozDisponible()) window.speechSynthesis.cancel(); }, []);

  // "Leer al enfocar o señalar": lee el elemento que recibe el foco o que está bajo el cursor.
  useEffect(() => {
    if (!prefs.leerAlEnfocar || !vozDisponible()) return undefined;
    let ultimo = null;
    const decir = (el) => {
      const objetivo = el?.closest?.(ELEMENTOS_LEIBLES);
      if (!objetivo || objetivo === ultimo) return;
      ultimo = objetivo;
      const texto = nombreAccesible(objetivo);
      if (!texto) return;
      window.speechSynthesis.cancel();
      const voz = new SpeechSynthesisUtterance(texto);
      voz.lang = 'es-PE';
      voz.rate = 0.95;
      window.speechSynthesis.speak(voz);
    };
    let espera;
    const alEnfocar = (e) => decir(e.target);
    const alSeñalar = (e) => { clearTimeout(espera); espera = setTimeout(() => decir(e.target), 350); };
    document.addEventListener('focusin', alEnfocar);
    document.addEventListener('mouseover', alSeñalar);
    return () => {
      clearTimeout(espera);
      document.removeEventListener('focusin', alEnfocar);
      document.removeEventListener('mouseover', alSeñalar);
      window.speechSynthesis.cancel();
    };
  }, [prefs.leerAlEnfocar]);

  const leer = () => {
    if (!vozDisponible()) return;
    window.speechSynthesis.cancel();
    if (leyendo) { setLeyendo(false); return; }
    const contenido = document.getElementById('contenido') || document.querySelector('main') || document.body;
    const voz = new SpeechSynthesisUtterance(textoParaLeer(contenido));
    voz.lang = 'es-PE';
    voz.rate = 0.95;
    voz.onend = () => setLeyendo(false);
    voz.onerror = () => setLeyendo(false);
    setLeyendo(true);
    window.speechSynthesis.speak(voz);
  };

  return (
    <div className="a11y">
      <button
        ref={boton}
        type="button"
        className="a11y__boton"
        aria-expanded={abierto}
        aria-controls="panel-accesibilidad"
        onClick={() => setAbierto(!abierto)}
        data-cy="abrir-accesibilidad"
        title="Opciones de accesibilidad (Alt + A)"
      >
        <span aria-hidden="true">♿</span> Accesibilidad
      </button>

      {abierto && (
        <section
          id="panel-accesibilidad"
          ref={panel}
          className="a11y__panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="titulo-a11y"
          data-cy="panel-accesibilidad"
        >
          <header className="a11y__cabecera">
            <h2 id="titulo-a11y">Accesibilidad</h2>
            <button type="button" className="btn btn--mini btn--fantasma" onClick={() => { setAbierto(false); boton.current?.focus(); }} aria-label="Cerrar opciones de accesibilidad">✕</button>
          </header>

          <div className="a11y__fila" role="group" aria-labelledby="etiqueta-tamano">
            <span id="etiqueta-tamano">Tamaño de letra: <b data-cy="tamano-actual">{prefs.tamano}%</b></span>
            <div className="a11y__tamano">
              <button type="button" className="btn btn--mini" onClick={() => cambiar('tamano', cambiarTamano(prefs.tamano, -1))} disabled={prefs.tamano === TAMANOS[0]} aria-label="Reducir letra" data-cy="letra-menos">A−</button>
              <button type="button" className="btn btn--mini" onClick={() => cambiar('tamano', cambiarTamano(prefs.tamano, 1))} disabled={prefs.tamano === TAMANOS.at(-1)} aria-label="Aumentar letra" data-cy="letra-mas">A+</button>
            </div>
          </div>

          {OPCIONES.filter((o) => o.clave !== 'leerAlEnfocar' || vozDisponible()).map((o) => (
            <label key={o.clave} className="a11y__opcion">
              <input
                type="checkbox"
                role="switch"
                checked={prefs[o.clave]}
                onChange={(e) => cambiar(o.clave, e.target.checked)}
                data-cy={`a11y-${o.clave}`}
              />
              <span><b>{o.titulo}</b><small>{o.ayuda}</small></span>
            </label>
          ))}

          {vozDisponible() && (
            <button type="button" className="btn btn--fantasma a11y__leer" onClick={leer} aria-pressed={leyendo} data-cy="leer-voz">
              {leyendo ? '■ Detener lectura' : '🔊 Leer la página en voz alta'}
            </button>
          )}
          <button type="button" className="btn btn--mini btn--fantasma" onClick={restablecer} data-cy="a11y-restablecer">Restablecer</button>
          <p className="a11y__nota">Atajo: <kbd>Alt</kbd> + <kbd>A</kbd>. Todo el sistema se puede usar con teclado (<kbd>Tab</kbd>).</p>
        </section>
      )}
    </div>
  );
}
