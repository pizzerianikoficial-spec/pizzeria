import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useEffect } from "react";
import { subscribeToPusher } from "../lib/pusherClient";
import { useApp } from "../context/AppContext";

export function useEntregas() {
  const queryClient = useQueryClient();
  const { currentUser } = useApp();
  // El rol "cashierdelivery" (cajero-delivery) solo muestra pedidos de Delivery
  const soloDelivery = currentUser?.role === "cashierdelivery";

  const query = useQuery({
    queryKey: ["entregas"],
    staleTime: 5000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryFn: async () => {
      const res = await axios.get("http://localhost:3001/api/entregas", {
        withCredentials: true,
      });

      // Extracción segura para garantizar que React Query almacene un arreglo
      let list = [];
      if (Array.isArray(res.data)) list = res.data;
      else if (res.data?.data && Array.isArray(res.data.data))
        list = res.data.data;
      else if (res.data?.orders && Array.isArray(res.data.orders))
        list = res.data.orders;

      if (soloDelivery) {
        list = list.filter((o) => o.type === "delivery");
      }

      return list;
    },
  });

  useEffect(() => {
    const refreshEntregas = () => {
      queryClient.invalidateQueries({ queryKey: ["entregas"] });
    };

    const unsubscribeOrders = subscribeToPusher({
      channelName: "pizzeria-orders",
      events: {
        pedido_actualizado: refreshEntregas,
        pedido_creado: refreshEntregas,
        nuevo_pedido: refreshEntregas,
      },
    });

    const unsubscribeKitchen = subscribeToPusher({
      channelName: "pizzeria-kitchen",
      events: {
        pedido_estado_cambiado: refreshEntregas,
      },
    });

    return () => {
      unsubscribeOrders();
      unsubscribeKitchen();
    };
  }, [queryClient]);

  return query;
}
