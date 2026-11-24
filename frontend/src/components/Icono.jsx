/** Íconos de línea (24×24, trazo 1.75) dibujados en SVG; heredan el color del texto. */
const TRAZOS = {
  panel: <><rect x="3.5" y="3.5" width="7" height="8" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="5" rx="1.5" /><rect x="13.5" y="11.5" width="7" height="9" rx="1.5" /><rect x="3.5" y="14.5" width="7" height="6" rx="1.5" /></>,
  citas: <><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /><path d="M8 14h3" /></>,
  pacientes: <><circle cx="9" cy="8.5" r="3.5" /><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5" /><path d="M15.5 5.2a3.5 3.5 0 0 1 0 6.6M18 14.8c1.9.7 3.1 2.4 3.5 5.2" /></>,
  reportes: <><path d="M4 20.5h16" /><path d="M6.5 16.5v-5M11 16.5V6.5M15.5 16.5v-7M20 16.5v-3" /></>,
  espera: <><path d="M6.5 3.5h11M6.5 20.5h11" /><path d="M7.5 3.5c0 4.5 4.5 5.5 4.5 8.5s-4.5 4-4.5 8.5M16.5 3.5c0 4.5-4.5 5.5-4.5 8.5s4.5 4 4.5 8.5" /></>,
  historias: <><path d="M14 3.5H7A2 2 0 0 0 5 5.5v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5z" /><path d="M14 3.5v5h5M8.5 13h7M8.5 16.5h5" /></>,
  evaluaciones: <><rect x="5" y="4.5" width="14" height="16" rx="2" /><path d="M9 3.5h6v2.5H9z" /><path d="m9 13 2 2 4-4.5" /></>,
  ia: <><path d="M12 3.5c.6 3.9 2.6 5.9 6.5 6.5-3.9.6-5.9 2.6-6.5 6.5-.6-3.9-2.6-5.9-6.5-6.5 3.9-.6 5.9-2.6 6.5-6.5z" /><path d="M18.5 15.5c.3 1.6 1 2.3 2.5 2.5-1.5.3-2.2 1-2.5 2.5-.3-1.5-1-2.2-2.5-2.5 1.5-.2 2.2-.9 2.5-2.5z" /></>,
  personal: <><rect x="3.5" y="5" width="17" height="14" rx="2" /><circle cx="9" cy="11" r="2.2" /><path d="M5.8 16c.5-1.6 1.7-2.4 3.2-2.4s2.7.8 3.2 2.4M14.5 10h3.5M14.5 13.5h2.5" /></>,
  suscripcion: <path d="m12 3.8 2.5 5.1 5.6.8-4 4 .9 5.6-5-2.7-5 2.7.9-5.6-4-4 5.6-.8z" />,
  auditoria: <><path d="M12 3.5 5 6v5.5c0 4.3 3 7.7 7 9 4-1.3 7-4.7 7-9V6z" /><path d="m9.2 12 2 2 3.8-4" /></>,
  plataforma: <><path d="M4 20.5V6.5l7-3v17M11 20.5V9.5l9 3v8M2.5 20.5h19" /><path d="M7 9h1M7 12.5h1M7 16h1M14.5 14.5h2M14.5 17.5h2" /></>,
  salir: <><path d="M14 4.5h3.5a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H14" /><path d="M10 16.5 5.5 12 10 7.5M5.5 12H15" /></>,
  flecha: <path d="M5 12h14M13 6l6 6-6 6" />,
  descargar: <><path d="M12 4v11M7 10.5l5 5 5-5" /><path d="M5 19.5h14" /></>,
};

export default function Icono({ nombre, tamano = 18, className = '' }) {
  return (
    <svg className={`icono ${className}`} width={tamano} height={tamano} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {TRAZOS[nombre]}
    </svg>
  );
}
