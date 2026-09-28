import { QueryClient } from "@tanstack/react-query";

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        gcTime: 10 * 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        refetchOnMount: false,
      },
    },
  });
