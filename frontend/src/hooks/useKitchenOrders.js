import { API_BASE } from "../config/api";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApp } from "../context/AppContext";
import { subscribeToPusher } from "../lib/pusherClient";



const kitchenQueryClients = new Map();
let stopKitchenSubscriptions = null;
let kitchenRefreshTimer = null;

const scheduleKitchenRefresh = () => {
  clearTimeout(kitchenRefreshTimer);
  kitchenRefreshTimer = setTimeout(() => {
    kitchenQueryClients.forEach((_count, queryClient) => {
      queryClient.invalidateQueries({
        queryKey: ["kitchenOrders"],
        refetchType: "active",
      });
    });
  }, 150);
};

const statusToUiStatus = {
  Pendiente: "pending",
  Horno: "preparing",
  pDespacho: "ready",
};

const applyKitchenStatus = (payload) => {
  const nextStatus = statusToUiStatus[payload?.estado];
  if (
    !payload?.id_venta ||
    (!nextStatus && !["Despacho", "Completado"].includes(payload.estado))
  ) {
    return false;
  }

  kitchenQueryClients.forEach((_count, queryClient) => {
    queryClient.setQueryData(["kitchenOrders"], (old = []) => {
      if (payload.estado === "Completado") {
        return old.filter(
          (order) => Number(order.db_id) !== Number(payload.id_venta),
        );
      }

      if (payload.estado === "Despacho") {
        const matchingOrders = old.filter(
          (order) => Number(order.db_id) === Number(payload.id_venta),
        );
        const remainingOrders = old.filter(
          (order) => Number(order.db_id) !== Number(payload.id_venta),
        );
        const sourceOrder = matchingOrders[0];

        if (!sourceOrder) return old;

        const deliveredOrder = { ...sourceOrder, status: "delivered" };
        if (sourceOrder.orderType === "Local") {
          return [
            ...remainingOrders,
            deliveredOrder,
            { ...deliveredOrder, status: "waiter_pending" },
          ];
        }

        return [...remainingOrders, deliveredOrder];
      }

      return old.map((order) =>
        Number(order.db_id) === Number(payload.id_venta)
          ? { ...order, status: nextStatus }
          : order,
      );
    });
  });

  return true;
};

const refreshNewKitchenOrder = async () => {
  const pending = await fetchKitchen("obtener-pedidos-cocina", "pending");
  kitchenQueryClients.forEach((_count, queryClient) => {
    queryClient.setQueryData(["kitchenOrders"], (old = []) => {
      const existingIds = new Set(old.map((order) => order.db_id));
      return [
        ...old,
        ...pending.filter((order) => !existingIds.has(order.db_id)),
      ];
    });
  });
};

const subscribeKitchenEvents = (queryClient) => {
  kitchenQueryClients.set(
    queryClient,
    (kitchenQueryClients.get(queryClient) || 0) + 1,
  );

  if (stopKitchenSubscriptions) return;

  const unsubscribeKitchen = subscribeToPusher({
    channelName: "pizzeria-kitchen",
    events: {
      pedido_estado_cambiado: applyKitchenStatus,
    },
  });

  const unsubscribeOrders = subscribeToPusher({
    channelName: "pizzeria-orders",
    events: {
      pedido_actualizado: (payload) => {
        if (!applyKitchenStatus(payload)) scheduleKitchenRefresh();
      },
      pedido_creado: refreshNewKitchenOrder,
    },
  });

  stopKitchenSubscriptions = () => {
    unsubscribeKitchen();
    unsubscribeOrders();
    stopKitchenSubscriptions = null;
  };
};

const unsubscribeKitchenEvents = (queryClient) => {
  const count = kitchenQueryClients.get(queryClient) || 0;
  if (count > 1) {
    kitchenQueryClients.set(queryClient, count - 1);
  } else {
    kitchenQueryClients.delete(queryClient);
  }
  if (kitchenQueryClients.size === 0 && stopKitchenSubscriptions) {
    clearTimeout(kitchenRefreshTimer);
    stopKitchenSubscriptions();
  }
};

const adaptVenta = (venta, status) => ({
  id: venta.codigo_orden,
  db_id: venta.id_venta,
  status,
  createdAt: venta.fecha_hora,
  orderType: venta.despacho,
  table: venta.despacho,
  customerName: venta.nombre_cliente,
  phoneLastDigits: venta.digitos_delivery || "",
  boxCount: Number(venta.cantidad_caja) || 0,
  items: (venta.detalles || []).map((detalle) => ({
    id_detalle: detalle.id_detalle,
    name: detalle.nombre_producto,
    description: detalle.combo_descripcion || "",
    qty: detalle.cantidad,
    note: detalle.nota,
    size: detalle.categoria_pizza,
    category: detalle.tipo_producto === "Combo" ? "combos" : "pizzas",
    extras: detalle.extras || [],
  })),
});

const fetchKitchen = async (endpoint, status) => {
  try {
    const res = await fetch(`${API_BASE}/${endpoint}`, {
      credentials: "include",
    });
    const json = await res.json();
    return json.success
      ? (json.data || []).map((v) => adaptVenta(v, status))
      : [];
  } catch (err) {
    console.error(`Error al cargar ${endpoint}:`, err);
    return [];
  }
};

export function useKitchenOrders() {
  const queryClient = useQueryClient();
  const { currentUser } = useApp();

  useEffect(() => {
    if (!currentUser) return undefined;

    subscribeKitchenEvents(queryClient);

    return () => unsubscribeKitchenEvents(queryClient);
  }, [currentUser, queryClient]);

  const query = useQuery({
    queryKey: ["kitchenOrders"],
    staleTime: 15_000,
    enabled: !!currentUser,
    queryFn: async () => {
      const [pending, preparing, delivered, ready, waiter_pending] =
        await Promise.all([
          fetchKitchen("obtener-pedidos-cocina", "pending"),
          fetchKitchen("obtener-pedidos-horno", "preparing"),
          fetchKitchen("obtener-pedidos-despacho", "delivered"),
          fetchKitchen("obtener-pedidos-pendiente", "ready"),
          fetchKitchen("obtener-pedidos-mesero", "waiter_pending"),
        ]);
      return [
        ...pending,
        ...preparing,
        ...delivered,
        ...ready,
        ...waiter_pending,
      ];
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const orders = queryClient.getQueryData(["kitchenOrders"]) || [];
      const order = orders.find((o) => o.id === id);

      if (order && order.db_id) {
        const res = await fetch(
          `${API_BASE}/actualizar-estado-pedido/${order.db_id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
            credentials: "include",
          },
        );
        const json = await res.json();
        if (!json.success) {
          throw new Error(json.message || "Error al actualizar el estado");
        }
      }
      return { id, status };
    },
    onSuccess: ({ id, status }) => {
      queryClient.setQueryData(["kitchenOrders"], (old = []) =>
        old.map((o) => (o.id === id ? { ...o, status } : o)),
      );
    },
  });

  const updateOrderStatus = (id, status) =>
    updateOrderStatusMutation.mutateAsync({ id, status });

  const archiveOrder = async (id) => {
    queryClient.setQueryData(["kitchenOrders"], (old = []) =>
      old.filter((o) => o.id !== id),
    );
  };

  const updateOrder = async (order) => {
    queryClient.setQueryData(["kitchenOrders"], (old = []) =>
      old.map((o) => (o.id === order.id ? { ...o, ...order } : o)),
    );
  };

  return {
    orders: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
    updateOrderStatus,
    archiveOrder,
    updateOrder,
  };
}
