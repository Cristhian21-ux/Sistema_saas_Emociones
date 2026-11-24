/** Horario de atención de cada psicólogo. Formato de la API: { "1": { inicio: "08:00", fin: "13:00" }, ... } (1 = lunes). */

export const DIAS = [
  { n: 1, corto: 'Lun', largo: 'Lunes' },
  { n: 2, corto: 'Mar', largo: 'Martes' },
  { n: 3, corto: 'Mié', largo: 'Miércoles' },
  { n: 4, corto: 'Jue', largo: 'Jueves' },
  { n: 5, corto: 'Vie', largo: 'Viernes' },
  { n: 6, corto: 'Sáb', largo: 'Sábado' },
  { n: 7, corto: 'Dom', largo: 'Domingo' },
];

/** Horario sugerido para un psicólogo nuevo: el general del centro (lunes a sábado de 8:00 a 18:00). */
export const HORARIO_SUGERIDO = Object.fromEntries(DIAS.map(({ n }) => [n, { activo: n <= 6, inicio: '08:00', fin: '18:00' }]));

/** Estado del formulario (los 7 días, marcados o no) a partir de lo que guarda la API. */
export function aFormulario(horario) {
  if (!horario) return structuredClone(HORARIO_SUGERIDO);
  return Object.fromEntries(DIAS.map(({ n }) => {
    const tramo = horario[n] ?? horario[String(n)];
    return [n, tramo ? { activo: true, inicio: tramo.inicio, fin: tramo.fin } : { activo: false, inicio: '08:00', fin: '13:00' }];
  }));
}

/** Lo que se envía a la API: solo los días marcados. */
export function aPayload(form) {
  return Object.fromEntries(DIAS.filter(({ n }) => form[n]?.activo).map(({ n }) => [String(n), { inicio: form[n].inicio, fin: form[n].fin }]));
}

const minutos = (h) => {
  const [hh, mm] = h.split(':').map(Number);
  return hh * 60 + mm;
};

/** Errores antes de enviar (el backend vuelve a validar). Devuelve un texto o null. */
export function validarHorario(form, duracion = 60) {
  const marcados = DIAS.filter(({ n }) => form[n]?.activo);
  if (marcados.length === 0) return 'Marca al menos un día de atención.';
  for (const { n, largo } of marcados) {
    const { inicio, fin } = form[n];
    if (!/^\d{2}:(00|30)$/.test(inicio || '') || !/^\d{2}:(00|30)$/.test(fin || '')) return `${largo}: usa horas en punto o y media.`;
    if (minutos(fin) - minutos(inicio) < duracion) return `${largo}: la hora de fin debe ser al menos ${duracion} minutos después del inicio.`;
  }
  return null;
}

/** "Lun–Vie 08:00–13:00 · Sáb 09:00–12:00": agrupa días seguidos con la misma hora. */
export function resumenHorario(horario) {
  if (!horario) return 'Horario general del centro';
  const grupos = [];
  DIAS.forEach(({ n, corto }) => {
    const tramo = horario[n] ?? horario[String(n)];
    if (!tramo) return;
    const horas = `${tramo.inicio}–${tramo.fin}`;
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.horas === horas && ultimo.hasta === n - 1) {
      ultimo.hasta = n;
      ultimo.fin = corto;
    } else {
      grupos.push({ desde: n, hasta: n, ini: corto, fin: corto, horas });
    }
  });
  if (grupos.length === 0) return 'Sin días de atención';
  return grupos.map((g) => `${g.ini}${g.hasta > g.desde ? `–${g.fin}` : ''} ${g.horas}`).join(' · ');
}
