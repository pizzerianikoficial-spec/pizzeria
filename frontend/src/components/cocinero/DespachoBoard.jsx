import { useKitchenOrders } from "../../hooks/useKitchenOrders";
import { OrderCard } from "./OrderCard";
import { useState } from "react";
import Swal from "sweetalert2";

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

// determina si un pedido es de tipo "Local"
const isLocalOrder = (order) => {
  if (!order) return false;

  const type = order.orderType?.toLowerCase();
  if (type === "dine_in" || type === "local") return true;

  const table = order.table?.toLowerCase() || "";
  if (table.startsWith("local") || table.startsWith("mesa")) return true;

  return false;
};

// Función para verificar si dos pedidos tienen los mismos nombre y categoría.
const areOrdersCompatible = (order1, order2) => {
  if (!order1 || !order2) return false;
  if (!order1.items || !order2.items) return false;
  if (order1.items.length !== order2.items.length) return false;

  const getItemsString = (order) => {
    return [...order.items]
      .map((item) => `${item.category}-${item.name}-${item.size || ""}`)
      .sort()
      .join("|");
  };

  return getItemsString(order1) === getItemsString(order2);
};

/**
 * Column — columna genérica del board de despacho.
 */
function Column({ title, icon, countClass, orders, renderCard }) {
  return (
    <div className="flex flex-col flex-1 min-w-0 h-[500px] lg:h-full border-b lg:border-b-0 border-pizza-gray-3">
      {/* Encabezado */}
      <div className="flex items-center gap-2.5 px-4 lg:px-6 py-3.5 border-b border-pizza-gray-3 bg-white/95 backdrop-blur-sm sticky top-0 z-10">
        <span className="text-lg 3xl:text-xl">{icon}</span>
        <h2 className="text-pizza-dark font-bold text-base 3xl:text-lg flex-1">
          {title}
        </h2>
        <span
          className={`px-2.5 py-1 rounded-full text-xs 3xl:text-sm font-bold ${countClass}`}
        >
          {orders.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-3 lg:p-4 3xl:p-6 flex flex-col gap-3 lg:gap-4 3xl:gap-6 custom-scrollbar">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[150px] text-pizza-muted gap-2">
            <span className="text-4xl opacity-30">{icon}</span>
            <p className="text-sm 3xl:text-base opacity-60">Sin pedidos</p>
          </div>
        ) : (
          orders.map((order, idx) => renderCard(order, idx))
        )}
      </div>
    </div>
  );
}

export default function DespachoBoard() {
  const { orders, updateOrderStatus, archiveOrder, updateOrder } =
    useKitchenOrders();

  const [orderToSwap, setOrderToSwap] = useState(null);

  const handleSwap = async (hornoOrder) => {
    if (!orderToSwap) return;

    const despOrder = orderToSwap;
    setOrderToSwap(null); // Cierra el modo de intercambio inmediatamente

    try {
      // 1. Mueve el pedido de Despacho a Pendiente ('ready') en la BD y en React
      await updateOrderStatus(despOrder.id, "ready");

      // 2. Mueve el pedido del Horno a Despacho ('delivered') en la BD y en React
      await updateOrderStatus(hornoOrder.id, "delivered");

      // 3. Opcional: Si mantienes una propiedad 'reassigned' localmente
      if (updateOrder) {
        updateOrder({ id: despOrder.id, reassigned: true });
        updateOrder({ id: hornoOrder.id, reassigned: true });
      }
    } catch (error) {
      console.error("Error al intercambiar pedidos:", error);
    }
  };

  // Handler para completar pedidos en la columna Despacho
  const handleDespachoComplete = (order) => {
    updateOrderStatus(order.id, "completed");
  };

  const handlePendienteComplete = (order) => {
    updateOrderStatus(order.id, "completed");
  };

  // Columna A: Horno — pedidos en preparación
  const hornoOrders = orders
    .filter((o) => o.status === "preparing")
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  // Columna B: Pendiente — pedidos listos para entregar
  const pendienteOrders = orders
    .filter((o) => o.status === "ready")
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  // Columna C: Despacho — pedidos en espera de ser recogidos
  const despachoOrders = orders
    .filter((o) => o.status === "delivered")
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const isSwapping = orderToSwap !== null;

  return (
    <div className="flex flex-col lg:flex-row h-full lg:divide-x divide-pizza-gray-3 overflow-y-auto lg:overflow-hidden bg-pizza-gray-2 lg:bg-transparent">
      {/* ── Columna A: Horno (amarillo) — isFirst lógica ── */}
      {/* ── Columna A: Horno (amarillo) — isFirst lógica ── */}
      <Column
        title="Horno"
        icon="🟡"
        countClass="bg-amber-100 text-amber-700"
        orders={hornoOrders}
        renderCard={(order, idx) => {
          const isCompatible = isSwapping
            ? areOrdersCompatible(orderToSwap, order)
            : true;

          return (
            <OrderCard
              key={order.id}
              order={order}
              isFirst={isSwapping ? isCompatible : idx === 0}
              variant={isSwapping ? "orange" : "yellow"}
              compactText={true}
              primaryBtnLabel={
                isSwapping
                  ? isCompatible
                    ? "Seleccionar para Cambio"
                    : "No coincide"
                  : "Listo"
              }
              onPrimary={() => {
                if (isSwapping) {
                  if (isCompatible) handleSwap(order);
                } else {
                  updateOrderStatus(order.id, "delivered");
                }
              }}
              secondaryBtnLabel={!isSwapping ? "Devolver" : null}
              onSecondary={
                !isSwapping
                  ? async () => {
                      const result = await Swal.fire({
                        title: "¿Devolver pedido?",
                        text: "¿Desea devolver el pedido a la cocina?",
                        icon: "question",
                        showCancelButton: true,
                        confirmButtonColor: "#84cc16",
                        cancelButtonColor: "#ef4444",
                        confirmButtonText: "Sí, devolver",
                        cancelButtonText: "Cancelar",
                      });

                      if (result.isConfirmed) {
                        try {
                          await updateOrderStatus(order.id, "pending");
                          // Marcar visualmente como devuelto desde el horno
                          if (updateOrder) {
                            updateOrder({
                              id: order.id,
                              returnedFromOven: true,
                            });
                          }
                          Toast.fire({
                            icon: "success",
                            title: "El pedido ha sido devuelto a la cocina",
                          });
                        } catch (error) {
                          console.error("Error al devolver el pedido:", error);
                          Toast.fire({
                            icon: "error",
                            title: "Error al devolver el pedido",
                          });
                        }
                      }
                    }
                  : null
              }
            />
          );
        }}
      />

      {/* ── Columna B: Pendiente (naranja) — todos activos ── */}
      <Column
        title="Pendiente"
        icon="🟠"
        countClass="bg-orange-100 text-orange-700"
        orders={pendienteOrders}
        renderCard={(order) => (
          <OrderCard
            key={order.id}
            order={order}
            isFirst={true}
            variant="orange"
            primaryBtnLabel="Entregar"
            onPrimary={() => handlePendienteComplete(order)}
            compactText={true}
          />
        )}
      />

      {/* ── Columna C: Despacho (verde) — dos botones ── */}
      <Column
        title="Despacho"
        icon="🟢"
        countClass="bg-emerald-100 text-emerald-700"
        orders={despachoOrders}
        renderCard={(order) => (
          <OrderCard
            key={order.id}
            order={order}
            isFirst={true}
            variant="green"
            compactText={true}
            primaryBtnLabel={isLocalOrder(order) ? "Entregado" : "Entregar"}
            onPrimary={() => handleDespachoComplete(order)}
            secondaryBtnLabel="Pendiente"
            onSecondary={() => {
              if (orderToSwap?.id === order.id) {
                setOrderToSwap(null); // Cancela el intercambio
              } else {
                setOrderToSwap(order); // Inicia el intercambio
              }
            }}
          />
        )}
      />
    </div>
  );
}
