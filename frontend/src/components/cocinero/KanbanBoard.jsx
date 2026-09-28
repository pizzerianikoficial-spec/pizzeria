import { useKitchenOrders } from "../../hooks/useKitchenOrders";
import { OrderCard } from "./OrderCard";

/**
 * KanbanBoard — Pantalla del Cocinero
 * Muestra únicamente los pedidos en estado "pending" (columna "Preparación").
 * Layout centrado con cards de mayor ancho para mejor visibilidad.
 * Solo el primer pedido de la cola tiene el botón "Preparar" activo.
 */

const KITCHEN_CATEGORIES = ["pizzas", "combos"];

export default function KanbanBoard() {
  const { orders, updateOrderStatus } = useKitchenOrders();

  const allPendingOrders = orders
    .filter((o) => o.status === "pending")
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const pendingOrders = allPendingOrders.filter((o) =>
    o.items.some(
      (it) => it.category && KITCHEN_CATEGORIES.includes(it.category),
    ),
  );

  const nonKitchenPendingCount = allPendingOrders.length - pendingOrders.length;

  // const pendingOrders = orders
  //   .filter((o) => o.status === 'pending')
  //   .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return (
    <div className="flex justify-center h-full p-4 sm:p-6 3xl:p-10">
      <div className="w-full max-w-md sm:max-w-2xl 3xl:max-w-4xl flex flex-col h-full min-h-0">
        {/* Encabezado de columna */}
        <div className="flex items-center gap-2.5 px-4 py-3.5 border border-pizza-gray-3 bg-white rounded-t-xl flex-shrink-0 shadow-sm">
          <span className="text-base">🔴</span>
          <h2 className="text-pizza-dark font-bold flex-1">Preparación</h2>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-status-pending/20 text-status-pending">
            {pendingOrders.length}
          </span>
        </div>

        {/* Cards */}
        <div className="flex flex-col gap-3 p-3 border border-t-0 border-pizza-gray-3 rounded-b-xl flex-1 overflow-y-auto min-h-0">
          {pendingOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-pizza-muted gap-2">
              <span className="text-4xl opacity-30">🍕</span>
              <p className="text-sm opacity-60">Sin pedidos pendientes</p>
            </div>
          ) : (
            pendingOrders.map((order, idx) => (
              <OrderCard
                key={order.id}
                order={order}
                isFirst={idx <= 1}
                primaryBtnLabel="Preparar"
                onPrimary={() => updateOrderStatus(order.id, "preparing")}
                itemsFilter={KITCHEN_CATEGORIES}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
