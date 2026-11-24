import { useCallback, useEffect, useState } from 'react';
import api, { mensajeError, obtener } from '../services/api';
import Tabla from '../components/Tabla';
import Campo from '../components/Campo';
import Aviso from '../components/Aviso';
import BotonPdf from '../components/BotonPdf';
import EditorHorario from '../components/EditorHorario';
import { useAuth } from '../context/AuthContext';
import { aFormulario, aPayload, HORARIO_SUGERIDO, resumenHorario, validarHorario } from '../utils/horario';

const ROLES = { admin: 'Administración', recepcionista: 'Recepción', psicologo: 'Psicología' };
const VACIO = { name: '', email: '', role: 'psicologo', especialidad: '', password: '' };
const nuevoHorario = () => structuredClone(HORARIO_SUGERIDO);

export default function Personal() {
  const { usuario } = useAuth();
  const [lista, setLista] = useState([]);
  const [form, setForm] = useState(VACIO);
  const [aviso, setAviso] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [editando, setEditando] = useState(null);
  const [horario, setHorario] = useState(nuevoHorario);
  const [errorHorario, setErrorHorario] = useState('');

  const cargar = useCallback(async () => {
    const { data, error } = await obtener('/personal');
    if (error) setAviso({ error });
    else setLista(data);
  }, []);

  useEffect(() => { void cargar(); }, [cargar]);

  const guardar = async (e) => {
    e.preventDefault();
    const esPsicologo = form.role === 'psicologo';
    const fallo = esPsicologo ? validarHorario(horario) : null;
    setErrorHorario(fallo || '');
    if (fallo) return;
    const datos = { ...form, horario: esPsicologo ? aPayload(horario) : null };
    setEnviando(true);
    try {
      if (editando) {
        await api.put(`/personal/${editando.id}`, datos);
        setAviso({ ok: 'Datos actualizados.' });
      } else {
        await api.post('/personal', datos);
        setAviso({ ok: 'Personal agregado.' });
      }
      setForm(VACIO);
      setHorario(nuevoHorario());
      setEditando(null);
      await cargar();
    } catch (err) {
      setAviso({ error: mensajeError(err) });
    } finally {
      setEnviando(false);
    }
  };

  const alternar = async (u) => {
    try {
      await api.patch(`/personal/${u.id}/activo`);
      await cargar();
    } catch (err) {
      setAviso({ error: mensajeError(err) });
    }
  };
  const editar = (u) => {
    setEditando(u);
    setAviso({});
    setForm({ name: u.name, email: u.email, role: u.role, especialidad: u.especialidad || '', password: '' });
    setHorario(aFormulario(u.horario));
    setErrorHorario('');
  };
  const cancelarEdicion = () => { setEditando(null); setForm(VACIO); setHorario(nuevoHorario()); setErrorHorario(''); };
  const esYo = editando?.id === usuario.id;

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <>
      <header className="cabecera cabecera--acciones">
        <div><h1>Personal</h1><p>Psicólogos, recepción y administración del centro.</p></div>
        <BotonPdf tipo="personal" onError={(error) => setAviso({ error })} />
      </header>
      <Aviso>{aviso.ok}</Aviso><Aviso tipo="error">{aviso.error}</Aviso>
      <div className="rejilla">
        <section className="tarjeta">
          <h2>Equipo del centro</h2>
          <Tabla filas={lista} vacio="Aún no hay personal registrado." columnas={[
            { titulo: 'Nombre', valor: (u) => u.name },
            { titulo: 'Rol', valor: (u) => ROLES[u.role] },
            { titulo: 'Especialidad', valor: (u) => u.especialidad || 'No aplica' },
            { titulo: 'Atiende', valor: (u) => (u.role === 'psicologo' ? (u.horario_resumen || resumenHorario(u.horario)) : 'No aplica') },
            { titulo: 'Estado', valor: (u) => <button type="button" className={`btn btn--mini ${u.activo ? '' : 'btn--peligro'}`} onClick={() => alternar(u)} data-cy={`estado-${u.email}`} aria-label={`${u.activo ? 'Desactivar' : 'Activar'} a ${u.name}`} title={u.activo ? 'Clic para desactivar' : 'Clic para activar'}>{u.activo ? 'Activo' : 'Inactivo'}</button> },
            { titulo: 'Acciones', valor: (u) => <button type="button" className="btn btn--mini btn--fantasma" onClick={() => editar(u)} data-cy={`editar-${u.email}`} aria-label={`Editar a ${u.name}`}>Editar</button> },
          ]} />
        </section>
        <form className="tarjeta formulario" onSubmit={guardar}>
          <h2>{editando ? `Editar a ${editando.name}` : 'Agregar personal'}</h2>
          <Campo label="Nombre" nombre="name" value={form.name} onChange={cambiar} required />
          <Campo label="Correo" nombre="email" type="email" value={form.email} onChange={cambiar} required />
          <Campo as="select" label="Rol" nombre="role" value={form.role} onChange={cambiar} disabled={esYo}>
            {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Campo>
          {form.role === 'psicologo' && <Campo label="Especialidad" nombre="especialidad" value={form.especialidad} onChange={cambiar} required />}
          {form.role === 'psicologo' && <EditorHorario valor={horario} onChange={setHorario} error={errorHorario} />}
          {esYo && <p className="ayuda">No puedes cambiar tu propio rol.</p>}
          {editando ? (
            <Campo label="Nueva contraseña (opcional)" nombre="password" type="password" autoComplete="new-password" value={form.password} onChange={cambiar} />
          ) : (
            <Campo label="Contraseña inicial" nombre="password" type="password" autoComplete="new-password" value={form.password} onChange={cambiar} required />
          )}
          {editando && <p className="ayuda">Déjala vacía para mantener la actual. Si cambias el rol o la contraseña, se cerrarán sus sesiones abiertas.</p>}
          <button type="submit" className="btn" disabled={enviando} data-cy={editando ? 'guardar-personal' : 'agregar-personal'}>
            {enviando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Agregar'}
          </button>
          {editando && <button type="button" className="btn btn--fantasma" onClick={cancelarEdicion}>Cancelar edición</button>}
        </form>
      </div>
    </>
  );
}
