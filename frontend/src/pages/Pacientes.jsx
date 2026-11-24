import { useCallback, useEffect, useState } from 'react';
import api, { mensajeError, obtener } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Campo from '../components/Campo';
import Tabla from '../components/Tabla';
import Aviso from '../components/Aviso';
import { validarPaciente } from '../utils/validaciones';

const VACIO = { nombres: '', apellidos: '', dni: '', telefono: '', email: '', fecha_nacimiento: '' };

export default function Pacientes() {
  const { usuario } = useAuth();
  const puedeEditar = ['admin', 'recepcionista'].includes(usuario.role);
  const [lista, setLista] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [form, setForm] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [aviso, setAviso] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [editando, setEditando] = useState(null);

  const cargar = useCallback(async (termino) => {
    const { data, error } = await obtener('/pacientes', { params: { buscar: termino } });
    if (error) setAviso({ error });
    else setLista(data.data);
  }, []);

  // Busca 300 ms después de la última tecla, en lugar de una petición por letra.
  useEffect(() => {
    const espera = setTimeout(() => { void cargar(buscar); }, 300);
    return () => clearTimeout(espera);
  }, [buscar, cargar]);

  const guardar = async (e) => {
    e.preventDefault();
    const encontrados = validarPaciente(form);
    setErrores(encontrados);
    if (Object.keys(encontrados).length) return;
    setEnviando(true);
    try {
      if (editando) {
        await api.put(`/pacientes/${editando}`, { ...form, telefono: form.telefono || null, email: form.email || null, fecha_nacimiento: form.fecha_nacimiento || null });
        setAviso({ ok: 'Paciente actualizado.' });
      } else {
        const limpio = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''));
        await api.post('/pacientes', limpio);
        setAviso({ ok: 'Paciente registrado.' });
      }
      setForm(VACIO);
      setEditando(null);
      await cargar(buscar);
    } catch (err) {
      setAviso({ error: mensajeError(err) });
    } finally {
      setEnviando(false);
    }
  };

  const editar = (p) => {
    setEditando(p.id);
    setErrores({});
    setAviso({});
    setForm({
      nombres: p.nombres || '', apellidos: p.apellidos || '', dni: p.dni || '', telefono: p.telefono || '',
      email: p.email || '', fecha_nacimiento: p.fecha_nacimiento || '',
    });
  };

  const cancelarEdicion = () => { setEditando(null); setForm(VACIO); setErrores({}); };

  // Borrado lógico en la API: el paciente deja de listarse pero se conserva su historial.
  const eliminar = async (p) => {
    if (!window.confirm(`¿Eliminar a ${p.nombre_completo}?`)) return;
    try {
      await api.delete(`/pacientes/${p.id}`);
      if (editando === p.id) cancelarEdicion();
      setAviso({ ok: 'Paciente eliminado.' });
      await cargar(buscar);
    } catch (err) {
      setAviso({ error: mensajeError(err) });
    }
  };

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <>
      <header className="cabecera cabecera--acciones">
        <div><h1>Pacientes</h1><p>Busca y registra a los pacientes del centro.</p></div>
      </header>
      <Aviso>{aviso.ok}</Aviso><Aviso tipo="error">{aviso.error}</Aviso>
      <div className="rejilla">
        <section className="tarjeta">
          <input type="search" className="buscador" data-cy="buscar-paciente" placeholder="Buscar por nombre, apellido o DNI" aria-label="Buscar pacientes" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
          <Tabla
            vacio={buscar ? 'No hay pacientes que coincidan con la búsqueda.' : 'Aún no hay pacientes registrados.'}
            filas={lista}
            columnas={[
              { titulo: 'Paciente', valor: (p) => p.nombre_completo },
              { titulo: 'DNI', valor: (p) => p.dni },
              { titulo: 'Teléfono', valor: (p) => p.telefono || 'Sin registrar' },
              ...(puedeEditar ? [{
                titulo: 'Acciones',
                valor: (p) => (
                  <span className="acciones">
                    <button type="button" className="btn btn--mini btn--fantasma" onClick={() => editar(p)} data-cy={`editar-${p.dni}`} aria-label={`Editar a ${p.nombre_completo}`}>Editar</button>
                    <button type="button" className="btn btn--mini btn--peligro" onClick={() => eliminar(p)} data-cy={`eliminar-${p.dni}`} aria-label={`Eliminar a ${p.nombre_completo}`}>Eliminar</button>
                  </span>
                ),
              }] : []),
            ]}
          />
        </section>
        {puedeEditar && (
          <form className="tarjeta formulario" onSubmit={guardar} noValidate>
            <h2>{editando ? 'Editar paciente' : 'Nuevo paciente'}</h2>
            <Campo label="Nombres" nombre="nombres" value={form.nombres} onChange={cambiar} error={errores.nombres} />
            <Campo label="Apellidos" nombre="apellidos" value={form.apellidos} onChange={cambiar} error={errores.apellidos} />
            <Campo label="DNI" nombre="dni" inputMode="numeric" maxLength={8} value={form.dni} onChange={cambiar} error={errores.dni} />
            <Campo label="Celular" nombre="telefono" type="tel" inputMode="tel" value={form.telefono} onChange={cambiar} error={errores.telefono} />
            <Campo label="Correo" nombre="email" type="email" value={form.email} onChange={cambiar} />
            <Campo label="Fecha de nacimiento" nombre="fecha_nacimiento" type="date" value={form.fecha_nacimiento} onChange={cambiar} />
            <button type="submit" className="btn" disabled={enviando} data-cy="guardar-paciente">
              {enviando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Registrar'}
            </button>
            {editando && <button type="button" className="btn btn--fantasma" onClick={cancelarEdicion}>Cancelar edición</button>}
          </form>
        )}
      </div>
    </>
  );
}
