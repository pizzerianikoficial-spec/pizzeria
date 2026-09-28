import { useState } from "react";
import { useApp, isBoxItem } from "../../context/AppContext";
import OrderItem from "./OrderItem";
import { ShoppingCart, Package, Trash2, Plus, Minus } from "lucide-react";
import { useExchangeRate } from "../../hooks/useExchangeRate";

const BOX_ORDER_TYPES = new Set(["takeaway", "pickup", "PickUp", "delivery"]);

export default function OrderTicket({ onCheckout }) {
  const { currentOrder, total, boxPrice, addBoxes } = useApp();
  const { exchangeRate } = useExchangeRate();
  const { items, pendingRemaining } = currentOrder;

  // Cantidad elegida en el selector
  const [boxesToAdd, setBoxesToAdd] = useState(1);

  const addedTotal = items
    .filter((item) => !item.isPendingExisting)
    .reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0),
      0,
    );
  const unitBoxPrice = Number(boxPrice) || 0;
  const canAddBox = BOX_ORDER_TYPES.has(currentOrder.orderType);
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
      {/* Items */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-3 flex flex-col gap-1.5 sm:gap-2 hide-scrollbar overscroll-contain">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
            <ShoppingCart className="w-8 h-8 opacity-50" />
            <p className="text-xs text-center font-medium">Ticket vacío</p>
            <p className="text-[10px] text-center text-slate-300">
              Agrega un producto para
              <br />
              seleccionar el tipo de pedido
            </p>
          </div>
        ) : (
          items.map((item) => <OrderItem key={item.id} item={item} />)
        )}
      </div>

      {/* Totals */}
      {items.length > 0 && (
        <div className="bg-white border-t border-slate-100 p-3 sm:p-4 flex flex-col gap-2 sm:gap-3 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
          <div className="space-y-1.5 text-sm">
            {canAddBox && !hasBoxLine && (
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

            <div className="flex justify-between items-center pt-1">
              <span className="text-slate-800 font-bold">Total</span>
              <div className="text-right">
                <div className="text-slate-800 font-extrabold text-lg sm:text-xl">
                  ${displayTotal.toFixed(2)}
                </div>
                {exchangeRate > 0 && (
                  <div className="text-slate-500 text-sm font-semibold mt-0.5">
                    Bs. {(displayTotal * exchangeRate).toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onCheckout}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
          >
            Cobrar ${displayTotal.toFixed(2)}
          </button>
        </div>
      )}
    </div>
  );
}
