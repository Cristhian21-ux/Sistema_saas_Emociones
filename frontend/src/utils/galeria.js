/** Índice siguiente (o anterior con paso -1) dando la vuelta al llegar al final. */
export function siguienteIndice(actual, total, paso = 1) {
  if (!total) return 0;
  return (((actual + paso) % total) + total) % total;
}

/**
 * Posición de cada carta del mazo según su distancia a la carta de arriba (0 = arriba).
 * Las de atrás asoman hacia arriba y a la derecha, como un mazo de fotos.
 */
export function posicionCarta(distancia) {
  const d = Math.max(0, distancia);
  // "0 - d * 12" en lugar de "d * -12": con d = 0 da 0 y no -0.
  return { x: d * 14, y: 0 - d * 12, giro: d * 2.2, escala: 1 - d * 0.035, capa: 10 - d };
}

/** Inclinación 3D del mazo según la posición del puntero dentro de la caja (máximo ±8°). */
export function inclinacion(px, py, ancho, alto, maximo = 8) {
  if (!ancho || !alto) return { rx: 0, ry: 0 };
  const nx = Math.min(1, Math.max(-1, (px / ancho) * 2 - 1));
  const ny = Math.min(1, Math.max(-1, (py / alto) * 2 - 1));
  return { rx: +(-ny * maximo).toFixed(2), ry: +(nx * maximo).toFixed(2) };
}
