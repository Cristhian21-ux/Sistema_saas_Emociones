/** Módulos del sistema y roles que pueden verlos (mismo RBAC que la API). */
export const MODULOS = [
  { ruta: '/panel', etiqueta: 'Panel', icono: 'panel', grupo: 'Atención', roles: ['admin', 'recepcionista', 'psicologo'] },
  { ruta: '/citas', etiqueta: 'Citas y agenda', icono: 'citas', grupo: 'Atención', roles: ['admin', 'recepcionista', 'psicologo'] },
  { ruta: '/pacientes', etiqueta: 'Pacientes', icono: 'pacientes', grupo: 'Atención', roles: ['admin', 'recepcionista', 'psicologo'] },
  { ruta: '/espera', etiqueta: 'Lista de espera', icono: 'espera', grupo: 'Atención', roles: ['admin', 'recepcionista'] },
  { ruta: '/historias', etiqueta: 'Historias clínicas', icono: 'historias', grupo: 'Clínica', roles: ['admin', 'psicologo'] },
  { ruta: '/evaluaciones', etiqueta: 'Evaluaciones', icono: 'evaluaciones', grupo: 'Clínica', roles: ['admin', 'psicologo'], plan: 'evaluaciones' },
  { ruta: '/emociones', etiqueta: 'Análisis IA', icono: 'ia', grupo: 'Clínica', roles: ['admin', 'psicologo'], plan: 'analisis_emociones' },
  { ruta: '/reportes', etiqueta: 'Reportes e impacto', icono: 'reportes', grupo: 'Gestión', roles: ['admin', 'recepcionista', 'psicologo'] },
  { ruta: '/personal', etiqueta: 'Personal', icono: 'personal', grupo: 'Gestión', roles: ['admin'] },
  { ruta: '/suscripcion', etiqueta: 'Mi suscripción', icono: 'suscripcion', grupo: 'Gestión', roles: ['admin'], soloSaas: true },
  { ruta: '/auditoria', etiqueta: 'Auditoría', icono: 'auditoria', grupo: 'Gestión', roles: ['admin'] },
  { ruta: '/plataforma', etiqueta: 'Centros SaaS', icono: 'plataforma', grupo: 'Plataforma', roles: ['superadmin'] },
];

/**
 * Módulos visibles para el usuario. En modo clínica única no hay planes:
 * se muestran todas las funciones y se oculta "Mi suscripción".
 */
export function modulosPara(usuario, modoUnico = false) {
  if (!usuario) return [];
  const plan = usuario.centro?.plan || {};
  return MODULOS.filter((m) => {
    if (!m.roles.includes(usuario.role)) return false;
    if (modoUnico) return !m.soloSaas;
    return !m.plan || Boolean(plan[m.plan]);
  });
}

/** Agrupa los módulos por sección, respetando el orden de aparición. */
export function agruparModulos(modulos) {
  const grupos = new Map();
  modulos.forEach((m) => grupos.set(m.grupo, [...(grupos.get(m.grupo) || []), m]));
  return [...grupos].map(([titulo, items]) => ({ titulo, items }));
}

export function rutaInicial(usuario) {
  return usuario?.role === 'superadmin' ? '/plataforma' : '/panel';
}
