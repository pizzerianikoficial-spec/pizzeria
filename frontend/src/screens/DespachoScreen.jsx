import { useApp } from "../context/AppContext";
import { LogOut } from "lucide-react";
import DespachoBoard from "../components/cocinero/DespachoBoard";
import Header from "../components/layout/Header";
import { useKitchenOrders } from "../hooks/useKitchenOrders";

export default function DespachoScreen() {
  const { logout } = useApp();
  const { orders } = useKitchenOrders();

  const preparing = orders.filter((o) => o.status === "preparing").length;
  const ready     = orders.filter((o) => o.status === "ready").length;
  const delivered = orders.filter((o) => o.status === "delivered").length;

  return (
    <div className="flex flex-col h-full bg-white">
      <Header title="Pantalla de Despacho">
        {preparing > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-amber-700 text-sm font-semibold">
              {preparing} en horno
            </span>
          </div>
        )}
        {ready > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            <span className="text-orange-700 text-sm font-semibold">
              {ready} pendiente{ready !== 1 ? "s" : ""}
            </span>
          </div>
        )}
        {delivered > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-emerald-700 text-sm font-semibold">
              {delivered} en despacho
            </span>
          </div>
        )}
      </Header>

      {/* Board de despacho */}
      <div className="flex-1 overflow-hidden">
        <DespachoBoard />
      </div>
    </div>
  );
}
