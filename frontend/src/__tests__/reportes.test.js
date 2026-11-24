import { describe, expect, it } from 'vitest';
import {
  etiquetaPeriodo, filtrosIniciales, nombreAccion, nombreMes, porcentaje, validarFiltros,
} from '../utils/reportes';

describe('módulo de reportes', () => {
  it('por defecto consulta los últimos 6 meses hasta hoy', () => {
    const f = filtrosIniciales(new Date(2026, 10, 10));
    expect(f.desde).toBe('2026-06-01');
    expect(f.hasta).toBe('2026-11-10');
    expect(f.estado).toBe('');
  });

  it('rechaza un rango de fechas invertido', () => {
    expect(validarFiltros({ desde: '2026-05-10', hasta: '2026-05-01' }).hasta).toMatch(/posterior/);
    expect(validarFiltros({ desde: '2026-05-01', hasta: '2026-05-10' })).toEqual({});
  });

  it('exige ambas fechas', () => {
    expect(Object.keys(validarFiltros({ desde: '', hasta: '' }))).toEqual(['desde', 'hasta']);
  });

  it('formatea meses y porcentajes', () => {
    expect(nombreMes('2026-03')).toBe('mar 26');
    expect(porcentaje(66.666)).toBe('66.7 %');
    expect(porcentaje(null)).toBe('0.0 %');
  });

  it('nombra periodos y acciones de auditoría', () => {
    expect(etiquetaPeriodo('2026-11-09')).toBe('09/11');
    expect(etiquetaPeriodo('2026-11')).toBe('nov 26');
    expect(nombreAccion('login.fallido')).toBe('Clave incorrecta');
    expect(nombreAccion('cita.creada')).toBe('cita.creada');
  });
});
