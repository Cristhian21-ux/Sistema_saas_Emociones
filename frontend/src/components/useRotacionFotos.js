import { useCallback, useEffect, useState } from 'react';
import { siguienteIndice } from '../utils/galeria';

/**
 * Rota las fotos cada `intervalo` ms mientras `activo` sea true y no esté en pausa.
 * Devuelve el índice actual y las acciones para ir a una foto o pausar (WCAG 2.2.2).
 */
export default function useRotacionFotos(total, { intervalo = 5000, activo = true } = {}) {
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [retenido, setRetenido] = useState(false); // pausa temporal mientras el puntero o el foco están en el mazo

  useEffect(() => {
    if (!activo || pausado || retenido || total < 2) return undefined;
    const id = setInterval(() => setIndice((i) => siguienteIndice(i, total)), intervalo);
    return () => clearInterval(id);
  }, [activo, pausado, retenido, total, intervalo]);

  const ir = useCallback((i) => setIndice(siguienteIndice(i, total, 0)), [total]);
  const avanzar = useCallback((paso = 1) => setIndice((i) => siguienteIndice(i, total, paso)), [total]);

  return { indice, ir, avanzar, pausado, setPausado, setRetenido };
}
