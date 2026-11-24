/**
 * Preferencias de accesibilidad (WCAG 2.1): visión baja, daltonismo, dislexia,
 * sensibilidad al movimiento y uso exclusivo de teclado o lector de pantalla.
 * Se guardan en el navegador para que la persona no tenga que configurarlas otra vez.
 */
export const CLAVE_A11Y = 'emociones_accesibilidad';

export const TAMANOS = [100, 115, 130, 150];

export const PREFERENCIAS_BASE = {
  tamano: 100, // % del tamaño de letra
  contraste: false, // alto contraste (texto negro sobre blanco, bordes marcados)
  dislexia: false, // tipografía legible, más espacio entre letras y líneas
  reducirMovimiento: false, // sin animaciones ni rotación de fotos
  subrayarEnlaces: false, // enlaces y botones identificables sin depender del color
  cursorGrande: false, // puntero más visible
  focoReforzado: false, // contorno grueso y de alto contraste en el elemento enfocado (teclado)
  leerAlEnfocar: false, // lee en voz alta el elemento enfocado o bajo el cursor (baja visión, lectura)
  ocultarImagenes: false, // quita fotos y fondos decorativos (atención, carga cognitiva)
};

export function leerPreferencias(almacen = globalThis.localStorage) {
  try {
    const guardadas = JSON.parse(almacen?.getItem(CLAVE_A11Y) || '{}');
    return { ...PREFERENCIAS_BASE, ...guardadas };
  } catch {
    return { ...PREFERENCIAS_BASE };
  }
}

export function guardarPreferencias(prefs, almacen = globalThis.localStorage) {
  try {
    almacen?.setItem(CLAVE_A11Y, JSON.stringify(prefs));
  } catch {
    /* modo privado o almacenamiento lleno: se aplica solo en esta sesión */
  }
}

/** Clases que se ponen en <html> según las preferencias. */
export function clasesPara(prefs) {
  return [
    prefs.contraste && 'a11y-contraste',
    prefs.dislexia && 'a11y-dislexia',
    prefs.reducirMovimiento && 'a11y-sin-movimiento',
    prefs.subrayarEnlaces && 'a11y-enlaces',
    prefs.cursorGrande && 'a11y-cursor',
    prefs.focoReforzado && 'a11y-foco',
    prefs.ocultarImagenes && 'a11y-sin-imagenes',
  ].filter(Boolean);
}

/**
 * Nombre accesible de un elemento para leerlo en voz alta: aria-label, la etiqueta
 * asociada, el texto alternativo o su texto visible (máximo 160 caracteres).
 */
export function nombreAccesible(el) {
  if (!el || el.nodeType !== 1) return '';
  const limpio = (t) => String(t || '').replace(/\s+/g, ' ').trim();
  const directo = el.getAttribute('aria-label') || el.getAttribute('alt') || el.getAttribute('title');
  let texto = limpio(directo);
  if (!texto && el.labels && el.labels.length) texto = limpio(el.labels[0].textContent);
  if (!texto && el.getAttribute('placeholder')) texto = limpio(el.getAttribute('placeholder'));
  if (!texto) texto = limpio(el.innerText || el.textContent);
  return texto.length > 160 ? `${texto.slice(0, 157)}…` : texto;
}

/** Siguiente tamaño de letra (+1) o anterior (-1), sin salir de los límites. */
export function cambiarTamano(actual, paso) {
  const i = Math.max(0, TAMANOS.indexOf(actual));
  return TAMANOS[Math.min(TAMANOS.length - 1, Math.max(0, i + paso))];
}

/** Texto legible de un contenedor para leerlo en voz alta (sin espacios repetidos). */
export function textoParaLeer(elemento) {
  return String(elemento?.innerText || elemento?.textContent || '').replace(/\s+/g, ' ').trim();
}
