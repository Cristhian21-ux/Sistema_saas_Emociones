import { describe, expect, it } from 'vitest';
import {
  CLAVE_A11Y, PREFERENCIAS_BASE, cambiarTamano, clasesPara, guardarPreferencias, leerPreferencias, nombreAccesible, textoParaLeer,
} from '../utils/accesibilidad';

const memoria = () => {
  const datos = {};
  return { getItem: (k) => datos[k] ?? null, setItem: (k, v) => { datos[k] = v; } };
};

describe('accesibilidad', () => {
  it('sin preferencias guardadas usa los valores base', () => {
    expect(leerPreferencias(memoria())).toEqual(PREFERENCIAS_BASE);
  });

  it('guarda y recupera las preferencias', () => {
    const almacen = memoria();
    guardarPreferencias({ ...PREFERENCIAS_BASE, contraste: true, tamano: 130 }, almacen);
    expect(leerPreferencias(almacen)).toMatchObject({ contraste: true, tamano: 130 });
  });

  it('un valor dañado en el almacenamiento no rompe la página', () => {
    const almacen = memoria();
    almacen.setItem(CLAVE_A11Y, '{no es json');
    expect(leerPreferencias(almacen)).toEqual(PREFERENCIAS_BASE);
  });

  it('convierte las preferencias en clases CSS', () => {
    expect(clasesPara(PREFERENCIAS_BASE)).toEqual([]);
    expect(clasesPara({ ...PREFERENCIAS_BASE, contraste: true, reducirMovimiento: true })).toEqual(['a11y-contraste', 'a11y-sin-movimiento']);
  });

  it('el tamaño de letra no sale de los límites', () => {
    expect(cambiarTamano(100, 1)).toBe(115);
    expect(cambiarTamano(150, 1)).toBe(150);
    expect(cambiarTamano(100, -1)).toBe(100);
  });

  it('prepara el texto para leerlo en voz alta', () => {
    expect(textoParaLeer({ textContent: '  Hola\n\n  mundo ' })).toBe('Hola mundo');
  });

  it('las opciones nuevas generan sus clases', () => {
    expect(clasesPara({ ...PREFERENCIAS_BASE, focoReforzado: true, ocultarImagenes: true })).toEqual(['a11y-foco', 'a11y-sin-imagenes']);
    expect(clasesPara({ ...PREFERENCIAS_BASE, leerAlEnfocar: true })).toEqual([]);
  });

  it('obtiene el nombre accesible para leerlo en voz alta', () => {
    document.body.innerHTML = '<button aria-label="Cerrar ventana">✕</button><label for="c">Correo</label><input id="c"><p>  Hola   equipo </p>';
    expect(nombreAccesible(document.querySelector('button'))).toBe('Cerrar ventana');
    expect(nombreAccesible(document.querySelector('input'))).toBe('Correo');
    expect(nombreAccesible(document.querySelector('p'))).toBe('Hola equipo');
    expect(nombreAccesible(null)).toBe('');
  });
});
