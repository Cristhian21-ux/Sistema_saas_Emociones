import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import TarjetaIndicador, { RejillaIndicadores } from '../components/TarjetaIndicador';
import { avance, formatoValor, infoEstado, textoMeta } from '../utils/indicadores';

const kpi = { id: 'KPI-23', nombre: 'Entrega de notificaciones', valor: 92, unidad: '%', sentido: 'Mayor es mejor', meta: 95, umbral: 90, estado: 'En riesgo', detalle: '46 de 50 notificaciones' };

describe('indicadores de gestión (B08.8)', () => {
  it('da formato según la unidad y muestra un guion si no hay datos', () => {
    expect(formatoValor(85.4, '%')).toBe('85.4 %');
    expect(formatoValor(12.5, 'USD')).toBe('US$ 12.50');
    expect(formatoValor(1, 'días')).toBe('1 día');
    expect(formatoValor(2.5, 'días')).toBe('2.5 días');
    expect(formatoValor(null, '%')).toBe('—');
  });

  it('describe la meta según el sentido', () => {
    expect(textoMeta(kpi)).toBe('Meta ≥ 95 % · alerta < 90 %');
    expect(textoMeta({ meta: 3, umbral: 7, unidad: 'días', sentido: 'Menor es mejor' })).toBe('Meta ≤ 3 días · alerta > 7 días');
    expect(textoMeta({ meta: null, sentido: 'Informativo' })).toMatch(/informativo/);
  });

  it('calcula el avance hacia la meta entre 0 y 100', () => {
    expect(Math.round(avance(kpi))).toBe(97);
    expect(avance({ valor: 2, meta: 3, sentido: 'Menor es mejor' })).toBe(100);
    expect(avance({ valor: 6, meta: 3, sentido: 'Menor es mejor' })).toBe(50);
    expect(avance({ valor: null, meta: 3, sentido: 'Mayor es mejor' })).toBeNull();
  });

  it('cada estado tiene icono y texto, no solo color', () => {
    expect(infoEstado('Cumple')).toMatchObject({ clase: 'cumple', icono: '✔' });
    expect(infoEstado('No cumple').texto).toMatch(/No cumple/);
    expect(infoEstado('desconocido').clase).toBe('info');
  });

  it('la tarjeta muestra valor, estado, meta y barra accesible', () => {
    render(<TarjetaIndicador indicador={kpi} />);
    expect(screen.getByRole('heading', { name: 'Entrega de notificaciones' })).toBeInTheDocument();
    expect(screen.getByText('92 %')).toBeInTheDocument();
    expect(screen.getByText(/En riesgo/)).toBeInTheDocument();
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '97');
  });

  it('sin indicadores muestra un mensaje', () => {
    render(<RejillaIndicadores indicadores={[]} />);
    expect(screen.getByText(/No hay indicadores/)).toBeInTheDocument();
  });
});
