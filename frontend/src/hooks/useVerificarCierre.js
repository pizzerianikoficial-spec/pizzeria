import { API_BASE as API } from "../config/api";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";



export function useVerificarCierre() {
  return useQuery({
    queryKey: ["verificarCierrePendiente"],
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data } = await axios.get(`${API}/cierre/pendiente`, {
        withCredentials: true,
      });
      return {
        pendiente: Boolean(data.pendiente),
        pendiente_delivery: Boolean(data.pendiente_delivery),
      };
    },
  });
}
