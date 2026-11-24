import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from '../pages/Login';

const iniciarSesion = vi.fn();
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ iniciarSesion }) }));
const navegar = vi.fn();
vi.mock('react-router-dom', async (orig) => ({ ...(await orig()), useNavigate: () => navegar }));

const montar = () => render(<MemoryRouter><Login /></MemoryRouter>);

describe('Login con fotos del centro', () => {
  beforeEach(() => { iniciarSesion.mockReset(); navegar.mockReset(); });

  it('muestra el formulario, el fondo con las fotos y el mazo de fotos del centro', () => {
    montar();
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Expresa lo que/ })).toBeInTheDocument();
    expect(screen.getByTestId('fondo-fotos')).toBeInTheDocument();
    expect(screen.getByTestId('mazo-fotos').querySelectorAll('figure')).toHaveLength(4);
  });

  it('describe la foto visible y permite cambiarla con los botones', async () => {
    montar();
    expect(screen.getByTestId('foto-actual')).toHaveTextContent('Foto 1 de 4');
    await userEvent.click(screen.getByRole('button', { name: 'Foto siguiente' }));
    expect(screen.getByTestId('foto-actual')).toHaveTextContent('Foto 2 de 4');
    await userEvent.click(screen.getByRole('button', { name: /Foto 4 de 4/ }));
    expect(screen.getByTestId('foto-actual')).toHaveTextContent('Foto 4 de 4');
    await userEvent.click(screen.getByRole('button', { name: 'Foto anterior' }));
    expect(screen.getByTestId('foto-actual')).toHaveTextContent('Foto 3 de 4');
  });

  it('ofrece saltar al formulario', () => {
    montar();
    expect(screen.getByRole('link', { name: 'Saltar al formulario de acceso' })).toHaveAttribute('href', '#form-acceso');
  });

  it('permite pausar y reanudar la rotación de las fotos', async () => {
    montar();
    const boton = screen.getByRole('button', { name: /Pausar/ });
    expect(boton).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(boton);
    expect(screen.getByRole('button', { name: /Reanudar/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('valida los campos antes de enviar', async () => {
    montar();
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(screen.getByText('Ingresa un correo válido.')).toBeInTheDocument();
    expect(iniciarSesion).not.toHaveBeenCalled();
  });

  it('inicia sesión y navega al panel', async () => {
    iniciarSesion.mockResolvedValue({ role: 'admin' });
    montar();
    await userEvent.type(screen.getByLabelText('Correo'), 'admin@emociones.test');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'Emociones2026');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(iniciarSesion).toHaveBeenCalledWith('admin@emociones.test', 'Emociones2026');
    expect(navegar).toHaveBeenCalledWith('/panel');
  });

  it('muestra el error del servidor', async () => {
    iniciarSesion.mockRejectedValue({ response: { data: { message: 'Credenciales incorrectas.' } } });
    montar();
    await userEvent.type(screen.getByLabelText('Correo'), 'x@y.pe');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'mala');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Credenciales incorrectas.');
  });

  it('permite mostrar la contraseña', async () => {
    montar();
    const clave = screen.getByLabelText('Contraseña');
    expect(clave).toHaveAttribute('type', 'password');
    await userEvent.click(screen.getByLabelText('Mostrar contraseña'));
    expect(clave).toHaveAttribute('type', 'text');
  });
});
