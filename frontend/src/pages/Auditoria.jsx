import { useCallback, useEffect, useState } from 'react';
import { obtener } from '../services/api';
import Aviso from '../components/Aviso';
import Campo from '../components/Campo';
import Tabla from '../components/Tabla';
import { ACCIONES, nombreAccion } from '../utils/reportes';

const VACIO = { accion: '', desde: '', hasta: '' };

export default function Auditoria() {
  const [lista, setLista] = useState([]);
  const [filtros, setFiltros] = useState(VACIO);
  const [error, setError] = useState('');

  const cargar = useCallback(async (valores) => {
    const params = Object.fromEntries(Object.entries(valores).filter(([, v]) => v !== ''));
    const { data, error: fallo } = await obtener('/auditoria', { params });
    if (fallo) setError(fallo);
    else { setError(''); setLista(data.data); }
  }, []);

  useEffect(() => { void cargar(VACIO); }, [cargar]);

  const cambiar = (e) => setFiltros({ ...filtros, [e.target.name]: e.target.value });
  const filtrar = (e) => { e.preventDefault(); void cargar(filtros); };

  return (
    <>
      <header className="cabecera"><h1>Auditoría</h1><p>Registro de acciones críticas: quién, qué, cuándo y desde qué IP (ISO/IEC 27001).</p></header>
      <form className="tarjeta filtros" onSubmit={filtrar} aria-label="Filtros de auditoría" data-cy="filtros-auditoria">
        <Campo label="Acción" nombre="accion" as="select" value={filtros.accion} onChange={cambiar}>
          <option value="">Todas</option>
          <option value="login">Accesos (login, fallidos y bloqueados)</option>
          {Object.entries(ACCIONES).filter(([k]) => k !== 'login').map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          <option value="paciente">Pacientes</option>
          <option value="cita">Citas</option>
          <option value="pago">Pagos</option>
        </Campo>
        <Campo label="Desde" nombre="desde" type="date" value={filtros.desde} onChange={cambiar} />
        <Campo label="Hasta" nombre="hasta" type="date" value={filtros.hasta} onChange={cambiar} />
        <div className="filtros__acciones">
          <button type="submit" className="btn" data-cy="filtrar-auditoria">Filtrar</button>
          <button type="button" className="btn btn--fantasma" onClick={() => { setFiltros(VACIO); void cargar(VACIO); }}>Limpiar</button>
        </div>
      </form>
      <Aviso tipo="error">{error}</Aviso>
      <section className="tarjeta" data-cy="tabla-auditoria">
        <Tabla filas={lista} vacio="No hay acciones registradas con esos filtros." columnas={[
          { titulo: 'Fecha', valor: (a) => a.created_at?.replace('T', ' ').slice(0, 19) },
          { titulo: 'Usuario', valor: (a) => a.usuario?.name || a.detalle?.email || 'Sistema' },
          { titulo: 'Acción', valor: (a) => <><code>{a.accion}</code> <small>{nombreAccion(a.accion) !== a.accion ? nombreAccion(a.accion) : ''}</small></> },
          { titulo: 'Entidad', valor: (a) => (a.entidad ? `${a.entidad} #${a.entidad_id}` : 'General') },
          { titulo: 'IP', valor: (a) => a.ip },
        ]} />
      </section>
    </>
  );
}
