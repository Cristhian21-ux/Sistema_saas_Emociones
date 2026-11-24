import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Indicador, etiquetaDia, saludo } from '../pages/Panel';
import { agruparModulos, modulosPara } from '../utils/menu';

describe('panel', () => {
  it('saluda según la hora del día', () => {
    expect(saludo(new Date(2026, 10, 23, 8))).toBe('Buenos días');
    expect(saludo(new Date(2026, 10, 23, 15))).toBe('Buenas tardes');
    expect(saludo(new Date(2026, 10, 23, 21))).toBe('Buenas noches');
  });

  it('nombra el día de las próximas citas', () => {
    const hoy = new Date(2026, 10, 23, 10);
    expect(etiquetaDia('2026-11-23', hoy)).toBe('Hoy');
    expect(etiquetaDia('2026-11-24', hoy)).toBe('Mañana');
    expect(etiquetaDia('2026-11-25', hoy)).toMatch(/25/);
  });

  it('un indicador con destino es un enlace al módulo', () => {
    render(<MemoryRouter><Indicador titulo="Pacientes" valor={12} a="/pacientes" detalle="registrados" /></MemoryRouter>);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/pacientes');
    expect(screen.getByTestId('indicador-Pacientes')).toHaveTextContent('12');
  });

  it('el menú se agrupa por secciones en orden', () => {
    const admin = { role: 'admin', centro: { plan: {} } };
    expect(agruparModulos(modulosPara(admin, true)).map((g) => g.titulo)).toEqual(['Atención', 'Clínica', 'Gestión']);
  });
});
