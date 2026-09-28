import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useEffect } from "react";
// Ajusta la ruta a tu archivo de configuración de Pusher
import { subscribeToPusher } from "../lib/pusherClient";

export function useContadorCajero() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["contadorCajero"],
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryFn: async () => {
      const { data } = await axios.get(
        "http://localhost:3001/api/obtener-contador-cajero",
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
