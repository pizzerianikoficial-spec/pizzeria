import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import MenuGrid from "../components/cajero/MenuGrid";
import OrderTicket from "../components/cajero/OrderTicket";
import JobQueue from "../components/cajero/JobQueue";
import CategoryFilter from "../components/cajero/CategoryFilter";
import CheckoutModal from "../components/cajero/CheckoutModal";
import ExchangeRateWidget from "../components/cajero/ExchangeRateWidget";
import PendingNotifications from "../components/cajero/PendingNotifications";

export default function CajeroScreen() {
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Normal");

  return (
    <div className="flex-1 flex flex-col p-3 sm:p-4 md:p-6 gap-4 overflow-hidden w-full h-full relative">
      {/* Cabecera y Filtros */}
      <header className="bg-white border border-slate-200/60 rounded-xl sm:rounded-2xl px-4 py-3 sm:px-5 sm:py-4 md:px-6 md:py-5 flex flex-row flex-nowrap gap-3 sm:gap-4 items-center shadow-sm shrink-0 overflow-hidden">
        <div className="flex items-center gap-3 sm:gap-4 md:gap-5 shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 bg-pizza-red/10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-pizza-red" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-none truncate">
                Punto de Venta
              </h1>
            </div>
            <p className="text-[10px] sm:text-xs font-medium text-slate-500 mt-1 capitalize">
              {new Date().toLocaleDateString("es-ES", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <ExchangeRateWidget />
        </div>
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0 justify-end">
          <div className="flex-1 min-w-0 overflow-x-auto [scrollbar-width:thin]">
            <CategoryFilter
              selected={selectedCategory}
              onSelect={setSelectedCategory}
            />
          </div>
          <div className="shrink-0">
            <PendingNotifications />
          </div>
        </div>
      </header>

      <div className="flex flex-1 gap-4 md:gap-6 min-h-0 flex-col xl:flex-row">
        {/* Grilla de Productos y Cola de Trabajos */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
            <MenuGrid category={selectedCategory} />
          </div>

          <div className="h-48 sm:h-56 md:h-64 bg-white rounded-xl shadow-sm border border-slate-100 p-3 sm:p-4 shrink-0 flex flex-col overflow-hidden">
            <h2 className="text-base sm:text-lg font-bold text-slate-800 mb-2 sm:mb-3 shrink-0">
              Cola de Trabajos Activos
            </h2>
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
              <JobQueue />
            </div>
          </div>
        </div>

        {/* Ticket de Orden */}
        <aside className="w-full xl:w-[380px] 2xl:w-[400px] bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col shrink-0 overflow-hidden h-[420px] sm:h-[500px] md:h-[560px] xl:h-auto">
          <div className="flex-1 overflow-hidden bg-slate-50">
            <OrderTicket onCheckout={() => setShowCheckout(true)} />
          </div>
        </aside>
      </div>

      {showCheckout && <CheckoutModal onClose={() => setShowCheckout(false)} />}
    </div>
  );
}
