// src/screens/MeseroScreen.jsx
import Header from "../components/layout/Header";
import MeseroBoard from "../components/cocinero/MeseroBoard";
import { useKitchenOrders } from "../hooks/useKitchenOrders";

const isLocalOrder = (order) => {
  if (!order) return false;
  const type = order.orderType?.toLowerCase();
  if (type === "dine_in" || type === "local") return true;
  const table = order.table?.toLowerCase() || "";
  return table.startsWith("local") || table.startsWith("mesa");
};

export default function MeseroScreen() {
  const { orders } = useKitchenOrders();

  // Cambiado: Ahora cuenta los pedidos pendientes de entrega del mesero
  const pendingCount = orders.filter(
    (o) => o.status === "waiter_pending" && isLocalOrder(o),
  ).length;

  return (
    <div className="flex flex-col h-full bg-white">
      <Header title="Pantalla del Mesero">
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-700 text-sm font-semibold">
              {pendingCount} por entregar
            </span>
          </div>
        )}
      </Header>

      <div className="flex-1 overflow-hidden">
        <MeseroBoard />
      </div>
    </div>
  );
}
