import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useApp } from "../context/AppContext";

const API_BASE = "http://localhost:3001/api";

export function useExchangeRate() {
  const queryClient = useQueryClient();
  const { currentUser } = useApp();

  const query = useQuery({
    queryKey: ["exchangeRate"],
    staleTime: 60_000,
    enabled: !!currentUser,
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE}/tasa`);
        const json = await res.json();
        if (json.success && json.data?.tasa_sistema) {
          return Number(json.data.tasa_sistema);
        }
        return 0;
      } catch (error) {
        console.error("Error fetching exchange rate", error);
        return 0;
      }
    },
  });

  const updateExchangeRate = useCallback(
    (rate) => {
      queryClient.setQueryData(["exchangeRate"], parseFloat(rate) || 0);
    },
    [queryClient],
  );

  return {
    exchangeRate: query.data ?? 0,
    updateExchangeRate,
    refetch: query.refetch,
    isLoading: query.isLoading,
  };
}
