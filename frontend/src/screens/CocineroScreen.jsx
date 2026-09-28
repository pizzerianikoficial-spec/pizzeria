import { useApp } from "../context/AppContext";
import { LogOut } from "lucide-react";
import KanbanBoard from "../components/cocinero/KanbanBoard";
import Header from "../components/layout/Header";
import { useKitchenOrders } from "../hooks/useKitchenOrders";

export default function CocineroScreen() {
  const { logout } = useApp();
  const { orders } = useKitchenOrders();

  const pending = orders.filter((o) => o.status === "pending").length;
  const preparing = orders.filter((o) => o.status === "preparing").length;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* ── Header reutilizable con indicadores ── */}
      <Header title="Pantalla del Cocinero">
        {pending > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            <span className="text-red-700 text-sm font-semibold">
              {pending} en cola
            </span>
          </div>
        )}
        {preparing > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-amber-700 text-sm font-semibold">
              {preparing} en preparación
            </span>
          </div>
        )}
      </Header>

      {/* Kanban de preparación */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <KanbanBoard />
      </div>
    </div>
  );
}
