import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FondoFotos from '../components/FondoFotos';
import MazoFotos from '../components/MazoFotos';
import useRotacionFotos from '../components/useRotacionFotos';
import { FOTOS_CENTRO } from '../components/fotosCentro';
import { useAccesibilidad } from '../context/AccesibilidadContext';
import Campo from '../components/Campo';
import Aviso from '../components/Aviso';
import { useAuth } from '../context/AuthContext';
import { mensajeError } from '../services/api';
import { validarLogin } from '../utils/validaciones';
import { rutaInicial } from '../utils/menu';
import logo from '../assets/logo-emociones.png';

export default function Login() {
  const { iniciarSesion, modoUnico } = useAuth();
  const navegar = useNavigate();
  const [datos, setDatos] = useState({ email: '', password: '' });
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [verClave, setVerClave] = useState(false);
  const { prefs } = useAccesibilidad();
  const rotacion = useRotacionFotos(FOTOS_CENTRO.length, { activo: !prefs.reducirMovimiento });

  const cambiar = (e) => setDatos({ ...datos, [e.target.name]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    const encontrados = validarLogin(datos);
    setErrores(encontrados);
    setError('');
    if (Object.keys(encontrados).length) return;
    setEnviando(true);
    try {
      const usuario = await iniciarSesion(datos.email, datos.password);
      navegar(rutaInicial(usuario));
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="acceso">
      <a className="saltar" href="#form-acceso">Saltar al formulario de acceso</a>
      <FondoFotos indice={rotacion.indice} />
      <section className="acceso__intro">
        <MazoFotos rotacion={rotacion} />
        <span className="chip chip--brillo">Niño · Adolescente · Adulto · Adulto mayor</span>
        <h1>Expresa lo que<br /><em>sientes…</em></h1>
        <p>Un lugar de acompañamiento para las personas en las situaciones que consideran difíciles. No estás solo, estamos contigo.</p>
      </section>
      <form id="form-acceso" tabIndex={-1} className="tarjeta-vidrio" onSubmit={enviar} noValidate aria-label="Iniciar sesión">
        <div className="tarjeta-vidrio__cabecera">
          <img className="marca__logo marca__logo--grande" src={logo} alt="Logo del Centro Psicológico Emociones" />
          <h2>Iniciar sesión</h2>
          <p>Centro Psicológico Emociones</p>
        </div>
        <Aviso tipo="error">{error}</Aviso>
        <Campo label="Correo" nombre="email" type="email" autoComplete="email" value={datos.email} onChange={cambiar} error={errores.email} />
        <Campo label="Contraseña" nombre="password" type={verClave ? 'text' : 'password'} autoComplete="current-password" value={datos.password} onChange={cambiar} error={errores.password} />
        <label className="check">
          <input type="checkbox" checked={verClave} onChange={() => setVerClave(!verClave)} /> Mostrar contraseña
        </label>
        <button type="submit" className="btn btn--grande" disabled={enviando} data-cy="submit">{enviando ? 'Ingresando…' : 'Ingresar'}</button>
        {modoUnico === false && <p className="acceso__pie">¿Tu centro aún no usa Emociones? <Link to="/registro">Crea tu cuenta gratis</Link></p>}
        {modoUnico === true && <p className="acceso__pie">¿No tienes cuenta? Solicítala al administrador del centro.</p>}
      </form>
    </div>
  );
}
