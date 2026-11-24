import { describe, expect, it } from 'vitest';
import { inclinacion, posicionCarta, siguienteIndice } from '../utils/galeria';

describe('mazo de fotos del login', () => {
  it('rota las fotos dando la vuelta', () => {
    expect(siguienteIndice(0, 4)).toBe(1);
    expect(siguienteIndice(3, 4)).toBe(0);
    expect(siguienteIndice(0, 4, -1)).toBe(3);
    expect(siguienteIndice(5, 4, 0)).toBe(1);
    expect(siguienteIndice(2, 0)).toBe(0);
  });

  it('las cartas de atrás asoman hacia arriba y a la derecha, más pequeñas', () => {
    const arriba = posicionCarta(0);
    const atras = posicionCarta(2);
    expect(arriba).toMatchObject({ x: 0, y: 0, giro: 0, escala: 1 });
    expect(atras.x).toBeGreaterThan(0);
    expect(atras.y).toBeLessThan(0);
    expect(atras.escala).toBeLessThan(1);
    expect(atras.capa).toBeLessThan(arriba.capa);
  });

  it('la inclinación 3D sigue al puntero sin pasar de ±8°', () => {
    expect(inclinacion(50, 50, 100, 100)).toEqual({ rx: 0, ry: 0 });
    expect(inclinacion(100, 0, 100, 100)).toEqual({ rx: 8, ry: 8 });
    expect(inclinacion(500, 500, 100, 100)).toEqual({ rx: -8, ry: 8 });
    expect(inclinacion(10, 10, 0, 0)).toEqual({ rx: 0, ry: 0 });
  });
});
