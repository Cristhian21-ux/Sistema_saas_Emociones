import { useRef, useState } from 'react';
import { FOTOS_CENTRO } from './fotosCentro';
import { inclinacion, posicionCarta } from '../utils/galeria';
import { useAccesibilidad } from '../context/AccesibilidadContext';

/**
 * Mazo de fotos del centro en 3D: las cartas de atrás asoman, la de arriba sale girando
 * cuando rota la foto y todo el mazo se inclina siguiendo el puntero.
 * Accesible: botones anterior/siguiente, puntos por foto, pausa (WCAG 2.2.2) y descripción para lectores de pantalla.
 */
export default function MazoFotos({ rotacion, lema = 'No estás solo, estamos contigo' }) {
  const { indice, ir, avanzar, pausado, setPausado, setRetenido } = rotacion;
  const { prefs } = useAccesibilidad();
  const caja = useRef(null);
  const [giro, setGiro] = useState({ rx: 0, ry: 0 });
  const total = FOTOS_CENTRO.length;
  const quieto = prefs.reducirMovimiento;

  if (prefs.ocultarImagenes) return null;

  const mover = (e) => {
    if (quieto || pausado) return;
    const r = caja.current.getBoundingClientRect();
    setGiro(inclinacion(e.clientX - r.left, e.clientY - r.top, r.width, r.height));
  };
  const soltar = () => { setGiro({ rx: 0, ry: 0 }); setRetenido(false); };

  return (
    <section className={`mazo ${quieto ? 'mazo--quieto' : ''}`} aria-roledescription="carrusel" aria-label="Fotos del Centro Psicológico Emociones" data-testid="mazo-fotos">
      <div
        ref={caja}
        className="mazo__escena"
        onPointerMove={mover}
        onPointerEnter={() => setRetenido(true)}
        onPointerLeave={soltar}
        onFocus={() => setRetenido(true)}
        onBlur={() => setRetenido(false)}
      >
        <div className="mazo__cartas" style={{ transform: `rotateX(${giro.rx}deg) rotateY(${giro.ry}deg)` }}>
          {FOTOS_CENTRO.map((f, i) => {
            const distancia = (i - indice + total) % total;
            const p = posicionCarta(distancia);
            const saliendo = distancia === total - 1; // la que acaba de salir pasa al fondo girando
            return (
              <figure
                key={f.src}
                className={`mazo__carta ${distancia === 0 ? 'es-arriba' : ''} ${saliendo ? 'es-saliendo' : ''}`}
                style={{ zIndex: p.capa, transform: `translate3d(${p.x}px, ${p.y}px, ${-distancia * 30}px) rotate(${p.giro}deg) scale(${p.escala})` }}
                aria-hidden={distancia !== 0}
              >
                <img src={f.src} alt={distancia === 0 ? f.descripcion : ''} draggable="false" />
                {distancia === 0 && (
                  <figcaption>
                    <span className="mazo__pie">{f.pie}</span>
                    <span className="mazo__lema">{lema}</span>
                  </figcaption>
                )}
              </figure>
            );
          })}
        </div>
      </div>

      <div className="mazo__controles">
        <button type="button" className="mazo__flecha" onClick={() => avanzar(-1)} aria-label="Foto anterior" data-cy="foto-anterior">‹</button>
        <div className="mazo__puntos" role="group" aria-label="Elegir foto">
          {FOTOS_CENTRO.map((f, i) => (
            <button key={f.src} type="button" className={`mazo__punto ${i === indice ? 'es-activo' : ''}`} onClick={() => ir(i)} aria-label={`Foto ${i + 1} de ${total}: ${f.pie}`} aria-current={i === indice ? 'true' : undefined} />
          ))}
        </div>
        <button type="button" className="mazo__flecha" onClick={() => avanzar(1)} aria-label="Foto siguiente" data-cy="foto-siguiente">›</button>
        {!quieto && (
          <button type="button" className="mazo__pausa" onClick={() => setPausado(!pausado)} aria-pressed={pausado} data-cy="pausar-animacion">
            <span aria-hidden="true">{pausado ? '▶' : '❚❚'}</span> {pausado ? 'Reanudar' : 'Pausar'}
          </button>
        )}
      </div>
      <p className="solo-lector" data-testid="foto-actual">Foto {indice + 1} de {total}: {FOTOS_CENTRO[indice].pie}.</p>
    </section>
  );
}
