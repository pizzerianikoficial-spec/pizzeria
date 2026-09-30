import { API_BASE } from "../config/api";
import { useQuery } from "@tanstack/react-query";
import { usePusherConnection } from "./usePusherConnection";



export function usePedidosActivos(filters = {}) {
  const { despacho, id_usuario } = filters;
  const pusherConnected = usePusherConnection();
  const params = new URLSearchParams();
  if (despacho) params.append("despacho", despacho);
  if (id_usuario) params.append("id_usuario", id_usuario);
  const queryString = params.toString() ? `?${params.toString()}` : "";

  return useQuery({
    queryKey: ["pedidosActivos", despacho || "all", id_usuario || "all"],
    staleTime: 15_000,
    // Polling SOLO cuando Pusher está caído.
    refetchInterval: pusherConnected ? false : 10_000,
    queryFn: async () => {
      try {
        const res = await fetch(
          `${API_BASE}/obtener-pedidos-activos${queryString}`,
          {
            credentials: "include",
          },
        );
        const json = await res.json();
        return json.success ? json.data : [];
      } catch (err) {
        console.error("Error al cargar pedidos activos:", err);
        return [];
      }
    },
  });
}
