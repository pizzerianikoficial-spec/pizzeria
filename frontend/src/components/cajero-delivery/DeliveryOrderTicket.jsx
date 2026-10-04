import { useApp, isBoxItem } from "../../context/AppContext";
import OrderItem from "../cajero/OrderItem";
import {
  ShoppingCart,
  Package,
  Trash2,
  UserCheck,
  User,
  Bike,
  Plus,
  Minus,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { useExchangeRate } from "../../hooks/useExchangeRate";
import { useState } from "react";

export default function DeliveryOrderTicket({ onCheckout, onOpenCustomer }) {
  const { currentOrder, total, boxPrice, addBoxes, setDeliveryCost } = useApp();
  const { exchangeRate } = useExchangeRate();
  const { items, pendingRemaining, customer } = currentOrder;

  // Cantidad elegida en el selector
  const [boxesToAdd, setBoxesToAdd] = useState(1);
  const [isEditingCost, setIsEditingCost] = useState(false);
  const [tempCost, setTempCost] = useState("");
  const [tempCurrency, setTempCurrency] = useState("USD");

  const startEditCost = () => {
    setTempCurrency(currentOrder.deliveryCostCurrency || "USD");
    setTempCost(
      currentOrder.deliveryCostRaw !== undefined && currentOrder.deliveryCostRaw !== ""
        ? String(currentOrder.deliveryCostRaw)
        : currentOrder.deliveryCostUSD
          ? String(currentOrder.deliveryCostUSD)
          : "",
    );
    setIsEditingCost(true);
  };

  const handleSaveCost = () => {
    const num = parseFloat(tempCost) || 0;
    const usd = tempCurrency === "Bs" && exchangeRate > 0 ? num / exchangeRate : num;
    const bs = tempCurrency === "USD" ? num * (exchangeRate || 0) : num;
    setDeliveryCost(usd, bs, tempCurrency, tempCost);
    setIsEditingCost(false);
  };

  const addedTotal = items
    .filter((item) => !item.isPendingExisting)
    .reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0),
      0,
    );

  const unitBoxPrice = Number(boxPrice) || 0;
  const hasBoxLine = items.some(
    (item) => isBoxItem(item) && !item.isPendingExisting,
  );
  const displayTotal =
    pendingRemaining != null ? pendingRemaining + addedTotal : total;

  const handleDecrease = () => setBoxesToAdd((q) => Math.max(1, q - 1));
  const handleIncrease = () => setBoxesToAdd((q) => q + 1);
  const handleAddBoxes = () => {
    addBoxes(boxesToAdd);
    setBoxesToAdd(1); // el selector vuelve a 1 tras añadir
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-slate-50">
      {/* Banner de Cliente Delivery */}
      <div className="bg-white border-b border-slate-100 px-3 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-7 h-7 rounded-lg bg-red-100 text-pizza-red flex items-center justify-center shrink-0">
            <Bike className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Cliente Delivery
            </span>
            <span className="text-xs font-bold text-slate-800 truncate">
              {customer?.name || "Sin cliente (se pedirá al cobrar)"}
            </span>
          </div>
        </div>
        {customer?.name && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
            <UserCheck className="w-3 h-3" />
            Listo
          </span>
        )}
      </div>

      {/* Lista de Items */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-3 flex flex-col gap-1.5 sm:gap-2 hide-scrollbar overscroll-contain">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400 p-6">
            <ShoppingCart className="w-8 h-8 opacity-40 text-slate-400" />
            <p className="text-xs text-center font-bold text-slate-600">
              Ticket Vacío
            </p>
            <p className="text-[11px] text-center text-slate-400">
              Selecciona pizzas, bebidas o combos para agregarlos al pedido
              delivery.
            </p>
          </div>
        ) : (
          items.map((item) => <OrderItem key={item.id} item={item} />)
        )}
      </div>

      {/* Totales y Acción */}
      {items.length > 0 && (
        <div className="bg-white border-t border-slate-100 p-3 sm:p-4 flex flex-col gap-2 sm:gap-3 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
          <div className="space-y-1.5 text-sm">
            {/* Control para agregar caja para delivery */}
            {!hasBoxLine && (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                {/* Título + precio unitario */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100">
                    <Package className="w-4 h-4 text-pizza-red" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 leading-tight truncate">
                      Cajas
                    </p>
                    <p className="text-xs font-medium text-slate-400">
                      ${unitBoxPrice.toFixed(2)} c/u
                    </p>
                  </div>
                </div>

                {/* Incrementador + botón Añadir */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center rounded-lg border border-slate-200 bg-white">
                    <button
                      type="button"
                      onClick={handleDecrease}
                      disabled={boxesToAdd <= 1}
                      aria-label="Disminuir cantidad de cajas"
                      className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-40 disabled:hover:text-slate-400 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span
                      className="min-w-[1.75rem] text-center text-sm font-bold text-slate-800 select-none tabular-nums"
                      aria-live="polite"
                    >
                      {boxesToAdd}
                    </span>
                    <button
                      type="button"
                      onClick={handleIncrease}
                      aria-label="Aumentar cantidad de cajas"
                      className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddBoxes}
                    className="rounded-lg bg-pizza-red px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:brightness-95 active:scale-[0.97] transition-all"
                  >
                    Añadir
                  </button>
                </div>
              </div>
            )}

            {/* Costo de Delivery */}
            {!isEditingCost ? (
              <div className="flex items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50/70 p-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-100 text-pizza-red">
                    <Bike className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-800 leading-tight">
                      Costo Delivery
                    </p>
                    {exchangeRate > 0 && (
                      <p className="text-[10px] text-slate-500 font-medium">
                        Bs. {((Number(currentOrder.deliveryCostUSD) || 0) * exchangeRate).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-pizza-red tabular-nums">
                    ${(Number(currentOrder.deliveryCostUSD) || 0).toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={startEditCost}
                    title="Editar costo de delivery"
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 rounded-xl border-2 border-red-300 bg-white p-2.5 shadow-sm animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Bike className="w-3.5 h-3.5 text-pizza-red" />
                    Editar Costo Delivery
                  </span>
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setTempCurrency("USD")}
                      className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        tempCurrency === "USD"
                          ? "bg-pizza-red text-white"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      $
                    </button>
                    <button
                      type="button"
                      onClick={() => setTempCurrency("Bs")}
                      className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        tempCurrency === "Bs"
                          ? "bg-pizza-red text-white"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Bs
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                      {tempCurrency === "USD" ? "$" : "Bs."}
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0.00"
                      value={tempCost}
                      onChange={(e) => setTempCost(e.target.value)}
                      className="w-full pl-7 pr-2 py-1.5 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-pizza-red"
                      autoFocus
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveCost}
                    className="p-1.5 bg-pizza-red text-white rounded-lg hover:bg-red-600 transition-colors shadow-xs"
                    title="Guardar"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingCost(false)}
                    className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors"
                    title="Cancelar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Total USD y Bs */}
            <div className="flex justify-between items-center pt-1">
              <div>
                <span className="text-slate-800 font-black text-sm">
                  Total Delivery
                </span>
                <span className="block text-[10px] text-slate-400">
                  Impuestos y tasa incluidos
                </span>
              </div>
              <div className="text-right">
                <div className="text-slate-900 font-black text-lg sm:text-xl leading-tight">
                  ${displayTotal.toFixed(2)}
                </div>
                {exchangeRate > 0 && (
                  <div className="text-slate-500 text-xs font-bold mt-0.5">
                    Bs. {(displayTotal * exchangeRate).toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onCheckout}
            className="w-full bg-pizza-red hover:bg-pizza-red-dark text-white py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-black shadow-md shadow-pizza-red/25 hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span>Cobrar ${displayTotal.toFixed(2)}</span>
          </button>
        </div>
      )}
    </div>
  );
}
