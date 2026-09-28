import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useApp } from "../context/AppContext";
import { subscribeToPusher } from "../lib/pusherClient";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

export function useReportes({ sucursalId, periodo, fecha, modulo }) {
  const { currentUser } = useApp();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!currentUser) return undefined;

    const invalidateReportes = () => {
      queryClient.invalidateQueries({ queryKey: ["reportes"] });
    };

    const unsubscribeOrders = subscribeToPusher({
      channelName: "pizzeria-orders",
      events: {
        pedido_creado: invalidateReportes,
        pedido_actualizado: invalidateReportes,
      },
    });

    return () => {
      unsubscribeOrders();
    };
  }, [currentUser, queryClient]);

  const sucursalesQuery = useQuery({
    queryKey: ["reportes", "sucursales"],
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data } = await api.get("/reportes/sucursales");
      return data.sucursales || [];
    },
    enabled: !!currentUser,
  });

  const filtros = { sucursalId, periodo, fecha, modulo };
  const puedeCargarReportes =
    !!currentUser &&
    (sucursalId !== null ||
      (!sucursalesQuery.isLoading && sucursalesQuery.data?.length === 0));
  const reportesQuery = useQuery({
    queryKey: ["reportes", filtros],
    staleTime: 60_000,
    placeholderData: (previousData) => previousData,
    enabled: puedeCargarReportes,
    queryFn: async () => {
      const params = {
        id_sucursal: sucursalId,
        periodo,
        fecha,
        modulo,
      };

      const requests = await Promise.allSettled([
        api.get("/reportes/resumen", { params }),
        api.get("/reportes/pagos", { params }),
        api.get("/reportes/tendencia", { params }),
        api.get("/reportes/top-productos", { params }),
      ]);

      const [resumen, pagos, tendencia, topProductos] = requests;

      return {
        resumen:
          resumen.status === "fulfilled"
            ? resumen.value.data.resumen || null
            : null,
        comparativa:
          resumen.status === "fulfilled"
            ? resumen.value.data.comparativa || []
            : [],
        pagos: pagos.status === "fulfilled" ? pagos.value.data.pagos || [] : [],
        tendencia:
          tendencia.status === "fulfilled"
            ? tendencia.value.data.tendencia || []
            : [],
        topProductos:
          topProductos.status === "fulfilled"
            ? topProductos.value.data.topProductos || []
            : [],
        hasError: requests.some((request) => request.status === "rejected"),
      };
    },
  });

  return {
    sucursales: sucursalesQuery.data || [],
    sucursalesLoading: sucursalesQuery.isLoading,
    reportes: reportesQuery.data,
    reportesLoading: reportesQuery.isLoading,
    reportesFetching: reportesQuery.isFetching,
    reportesError: reportesQuery.error,
    refetchReportes: reportesQuery.refetch,
  };
}
