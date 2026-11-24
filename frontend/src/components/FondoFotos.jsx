import { FOTOS_CENTRO } from './fotosCentro';
import { useAccesibilidad } from '../context/AccesibilidadContext';

/**
 * Fondo de pantalla completa con la foto actual del centro muy desenfocada y a todo color.
 * Cambia con un fundido cuando cambia la foto. Decorativo: oculto para lectores de pantalla.
 */
export default function FondoFotos({ indice = 0 }) {
  const { prefs } = useAccesibilidad();
  if (prefs.ocultarImagenes) return null;
  return (
    <div className="fondo-fotos" data-testid="fondo-fotos" aria-hidden="true">
      {FOTOS_CENTRO.map((f, i) => (
        <div key={f.src} className={`fondo-fotos__capa ${i === indice ? 'es-activa' : ''}`} style={{ backgroundImage: `url(${f.src})` }} />
      ))}
      <div className="fondo-fotos__velo" />
    </div>
  );
}
