import { useState, useEffect } from "react";
import { subscribePusherConnection } from "../lib/pusherClient";

/**
 * Estado Reactivo de la conexión a Pusher.
 * Permite activar el polling de respaldo (TanStack Query) únicamente cuando
 * Pusher está caído y desactivarlo automáticamente cuando vuelve, para no
 * consumir la cuota gratuita de Vercel/Turso con refetchs innecesarios.
 */
export function usePusherConnection() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribePusherConnection(setConnected);
    return unsubscribe;
  }, []);

  return connected;
}