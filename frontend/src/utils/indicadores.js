/** Utilidades de los indicadores de gestión (hoja 11 de la matriz). Puras, para probarlas con Vitest. */

const ESTADOS = {
  Cumple: { clase: 'cumple', icono: '✔', texto: 'Cumple la meta' },
  'En riesgo': { clase: 'riesgo', icono: '!', texto: 'En riesgo' },
  'No cumple': { clase: 'no-cumple', icono: '✖', texto: 'No cumple la meta' },
  'Sin datos': { clase: 'sin-datos', icono: '–', texto: 'Aún sin datos' },
  Informativo: { clase: 'info', icono: 'i', texto: 'Informativo' },
};

/** Estado frente a la meta: clase CSS, icono y texto (el color nunca es la única señal). */
export const infoEstado = (estado) => ESTADOS[estado] || ESTADOS.Informativo;

const numero = (v, decimales = 1) => Number(v).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: decimales });

/** 85.4 + "%" -> "85.4 %"; 12.5 + "USD" -> "US$ 12.50"; null -> "—". */
export function formatoValor(valor, unidad) {
  if (valor === null || valor === undefined || Number.isNaN(Number(valor))) return '—';
  if (unidad === 'USD') return `US$ ${Number(valor).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (unidad === '%') return `${numero(valor)} %`;
  if (unidad === 'días') return `${numero(valor)} ${Number(valor) === 1 ? 'día' : 'días'}`;
  return numero(valor, 0);
}

/** "Meta ≥ 95 % · alerta < 90 %" según el sentido del indicador. */
export function textoMeta({ meta, umbral, unidad, sentido }) {
  if (meta === null || meta === undefined || sentido === 'Informativo') return 'Sin meta: indicador informativo';
  const mayor = sentido === 'Mayor es mejor';
  const partes = [`Meta ${mayor ? '≥' : '≤'} ${formatoValor(meta, unidad)}`];
  if (umbral !== null && umbral !== undefined) partes.push(`alerta ${mayor ? '<' : '>'} ${formatoValor(umbral, unidad)}`);
  return partes.join(' · ');
}

/** Avance hacia la meta entre 0 y 100, para la barra de la tarjeta (null si no aplica). */
export function avance({ valor, meta, sentido }) {
  if (valor === null || meta === null || meta === undefined || sentido === 'Informativo') return null;
  if (sentido === 'Mayor es mejor') return meta > 0 ? Math.max(0, Math.min(100, (100 * valor) / meta)) : 100;
  if (valor <= meta) return 100;
  return Math.max(0, Math.min(100, (100 * meta) / valor));
}

