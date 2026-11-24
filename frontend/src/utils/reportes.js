/** Utilidades del módulo de reportes (puras, para poder probarlas con Vitest). */

const aIso = (fecha) => {
  const local = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

/** Por defecto: desde el inicio del mes de hace 5 meses hasta hoy (6 meses). */
export function filtrosIniciales(hoy = new Date()) {
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1);
  return { desde: aIso(inicio), hasta: aIso(hoy), estado: '', psicologo_id: '' };
}

export function validarFiltros({ desde, hasta }) {
  const errores = {};
  if (!desde) errores.desde = 'Elige la fecha inicial.';
  if (!hasta) errores.hasta = 'Elige la fecha final.';
  if (desde && hasta && desde > hasta) errores.hasta = 'La fecha final debe ser posterior a la inicial.';
  return errores;
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** "2026-03" -> "mar 26" */
export function nombreMes(periodo) {
  const [anio, mes] = String(periodo).split('-');
  return `${MESES[Number(mes) - 1] ?? mes} ${String(anio).slice(2)}`;
}

export const porcentaje = (valor) => `${Number(valor || 0).toFixed(1)} %`;

/** "2026-11-09" -> "09/11"; "2026-11" -> "nov 26". */
export function etiquetaPeriodo(periodo) {
  const partes = String(periodo).split('-');
  return partes.length === 3 ? `${partes[2]}/${partes[1]}` : nombreMes(periodo);
}

/** Nombre legible de las acciones de auditoría. */
export const ACCIONES = {
  login: 'Inicio de sesión',
  'login.fallido': 'Clave incorrecta',
  'login.bloqueado': 'Cuenta desactivada (bloqueado)',
  logout: 'Cierre de sesión',
  'perfil.actualizado': 'Perfil actualizado',
  'personal.creado': 'Alta de personal',
  'personal.actualizado': 'Datos de personal editados',
  'personal.activado': 'Personal activado',
  'personal.desactivado': 'Personal desactivado',
  'centro.registrado': 'Centro registrado',
  'reporte.descargado': 'Reporte descargado',
};
export const nombreAccion = (a) => ACCIONES[a] || a;
