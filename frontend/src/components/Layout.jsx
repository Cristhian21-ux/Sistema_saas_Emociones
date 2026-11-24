import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { agruparModulos, modulosPara } from '../utils/menu';
import Chatbot from './Chatbot';
import Icono from './Icono';
import logo from '../assets/logo-emociones.png';

const ROLES = { admin: 'Administración', recepcionista: 'Recepción', psicologo: 'Psicología', superadmin: 'Plataforma' };

const iniciales = (nombre = '') => nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

export default function Layout() {
  const { usuario, cerrarSesion, modoUnico } = useAuth();
  const navegar = useNavigate();
  const grupos = agruparModulos(modulosPara(usuario, modoUnico));

  const salir = async () => {
    await cerrarSesion();
    navegar('/login');
  };

  return (
    <div className="app">
      <a href="#contenido" className="saltar" data-cy="saltar-contenido">Saltar al contenido principal</a>
      <aside className="lateral" aria-label="Menú principal">
        <div className="marca">
          <img className="marca__logo" src={logo} alt="Logo del Centro Psicológico Emociones" />
          <div>
            <strong>Emociones</strong>
            <small>{usuario.centro?.nombre || 'Plataforma SaaS'}</small>
          </div>
        </div>
        <nav aria-label="Módulos" className="lateral__nav">
          {grupos.map((g) => (
            <div key={g.titulo} className="lateral__grupo" role="group" aria-labelledby={`grupo-${g.titulo}`}>
              <p className="lateral__titulo" id={`grupo-${g.titulo}`}>{g.titulo}</p>
              {g.items.map((m) => (
                <NavLink key={m.ruta} to={m.ruta} className="lateral__link">
                  <Icono nombre={m.icono} /> {m.etiqueta}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="lateral__pie">
          {usuario.centro && !modoUnico && <span className={`chip chip--${usuario.centro.plan.codigo}`}>Plan {usuario.centro.plan.nombre}</span>}
          <NavLink to="/perfil" className="usuario" title="Mi perfil">
            <span className="usuario__avatar" aria-hidden="true">{iniciales(usuario.name)}</span>
            <span className="usuario__datos">
              <strong>{usuario.name}</strong>
              <small>{ROLES[usuario.role] || usuario.role} · Mi perfil</small>
            </span>
          </NavLink>
          <button type="button" className="lateral__salir" onClick={salir}>
            <Icono nombre="salir" /> <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
      <main className="contenido" id="contenido" tabIndex={-1}><Outlet /></main>
      <Chatbot />
    </div>
  );
}
