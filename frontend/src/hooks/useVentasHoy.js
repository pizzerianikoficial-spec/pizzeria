import { useQuery } from "@tanstack/react-query";

const API_BASE = "http://localhost:3001/api";

export function useVentasHoy(filters = {}) {
  const { despacho, id_usuario } = filters;
  const params = new URLSearchParams();
  if (despacho) params.append("despacho", despacho);
  if (id_usuario) params.append("id_usuario", id_usuario);
  const queryString = params.toString() ? `?${params.toString()}` : "";

  return useQuery({
    queryKey: ["ventasHoy", despacho || "all", id_usuario || "all"],
    staleTime: 30_000,
    queryFn: async () => {
      try {
        const res = await fetch(
          `${API_BASE}/obtener-ventas-hoy${queryString}`,
          {
            credentials: "include",
          },
        );
        const json = await res.json();
        return json.success ? json.data : null;
      } catch (err) {
        console.error("Error al cargar ventas del día:", err);
        return null;
      }
    },
  });
}
