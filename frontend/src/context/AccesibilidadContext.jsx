import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { PREFERENCIAS_BASE, clasesPara, guardarPreferencias, leerPreferencias } from '../utils/accesibilidad';

const AccesibilidadContext = createContext({ prefs: PREFERENCIAS_BASE, cambiar: () => {}, restablecer: () => {} });

export function AccesibilidadProvider({ children }) {
  const [prefs, setPrefs] = useState(() => {
    const guardadas = leerPreferencias();
    // Respeta la configuración del sistema operativo si la persona no eligió otra cosa.
    const sistema = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    return sistema ? { ...guardadas, reducirMovimiento: true } : guardadas;
  });

  useEffect(() => {
    const raiz = document.documentElement;
    raiz.classList.remove('a11y-contraste', 'a11y-dislexia', 'a11y-sin-movimiento', 'a11y-enlaces', 'a11y-cursor');
    raiz.classList.add(...clasesPara(prefs));
    raiz.style.fontSize = `${prefs.tamano}%`;
    guardarPreferencias(prefs);
  }, [prefs]);

  const cambiar = useCallback((clave, valor) => setPrefs((p) => ({ ...p, [clave]: valor })), []);
  const restablecer = useCallback(() => setPrefs({ ...PREFERENCIAS_BASE }), []);

  const valor = useMemo(() => ({ prefs, cambiar, restablecer }), [prefs, cambiar, restablecer]);
  return <AccesibilidadContext.Provider value={valor}>{children}</AccesibilidadContext.Provider>;
}

export const useAccesibilidad = () => useContext(AccesibilidadContext);
