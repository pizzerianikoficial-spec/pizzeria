import { API_BASE } from "../config/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useEffect } from "react";
// Ajusta la ruta a tu archivo de configuración de Pusher
import { subscribeToPusher } from "../lib/pusherClient";
import { usePusherConnection } from "./usePusherConnection";

export function useContadorCajero() {
  const queryClient = useQueryClient();
  const pusherConnected = usePusherConnection();

  const query = useQuery({
    queryKey: ["contadorCajero"],
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    // Polling SOLO cuando Pusher está caído: con Pusher activo no se refetcha.
    refetchInterval: pusherConnected ? false : 15_000,
    queryFn: async () => {
      const { data } = await axios.get(
        `${API_BASE}/obtener-contador-cajero`,
        { withCredentials: true },
      );
      return data.success ? data.total : 0;
    },
  });

  useEffect(() => {
    const unsubscribe = subscribeToPusher({
      channelName: "pizzeria-orders",
      events: {
        pedido_actualizado: () => {
          queryClient.invalidateQueries({
            queryKey: ["contadorCajero"],
            refetchType: "active",
          });
        },
        pedido_creado: () => {
          queryClient.invalidateQueries({
            queryKey: ["contadorCajero"],
            refetchType: "active",
          });
        },
      },
    });

    return () => unsubscribe();
  }, [queryClient]);

  return query;
}
