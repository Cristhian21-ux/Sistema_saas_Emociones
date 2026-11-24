import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import EditorHorario from '../components/EditorHorario';
import { aFormulario, aPayload, HORARIO_SUGERIDO, resumenHorario, validarHorario } from '../utils/horario';

const MANANAS = { 1: { inicio: '08:00', fin: '13:00' }, 2: { inicio: '08:00', fin: '13:00' }, 3: { inicio: '08:00', fin: '13:00' },
  4: { inicio: '08:00', fin: '13:00' }, 5: { inicio: '08:00', fin: '13:00' }, 6: { inicio: '09:00', fin: '12:00' } };

describe('horario de atención del psicólogo', () => {
  it('resume los días seguidos con la misma hora', () => {
    expect(resumenHorario(MANANAS)).toBe('Lun–Vie 08:00–13:00 · Sáb 09:00–12:00');
    expect(resumenHorario({ 3: { inicio: '15:00', fin: '19:00' } })).toBe('Mié 15:00–19:00');
    expect(resumenHorario(null)).toBe('Horario general del centro');
  });

  it('convierte entre la API y el formulario', () => {
    const form = aFormulario(MANANAS);
    expect(form[7].activo).toBe(false);
    expect(form[6]).toEqual({ activo: true, inicio: '09:00', fin: '12:00' });
    expect(aPayload(form)).toEqual(Object.fromEntries(Object.entries(MANANAS).map(([d, t]) => [d, t])));
    expect(aFormulario(null)).toEqual(HORARIO_SUGERIDO);
  });

  it('valida antes de enviar', () => {
    const form = aFormulario(MANANAS);
    expect(validarHorario(form)).toBeNull();
    expect(validarHorario({ ...form, 1: { activo: true, inicio: '13:00', fin: '09:00' } })).toMatch(/Lunes: la hora de fin/);
    expect(validarHorario({ ...form, 2: { activo: true, inicio: '08:15', fin: '12:00' } })).toMatch(/en punto o y media/);
    expect(validarHorario(aFormulario({}))).toMatch(/al menos un día/);
  });

  it('desmarcar un día lo deja como descanso', () => {
    const onChange = vi.fn();
    render(<EditorHorario valor={aFormulario(MANANAS)} onChange={onChange} />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Lunes' }));
    expect(onChange.mock.calls[0][0][1].activo).toBe(false);
    expect(screen.getAllByText('Descanso')).toHaveLength(1); // el domingo
    expect(screen.getByLabelText('Hora de inicio del sábado')).toHaveValue('09:00');
  });
});
