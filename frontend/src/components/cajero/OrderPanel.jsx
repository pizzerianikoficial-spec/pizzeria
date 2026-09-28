import { useApp } from "../../context/AppContext";
import OrderItem from "./OrderItem";
import { ShoppingCart, Trash2, Package } from "lucide-react";

const BOX_ORDER_TYPES = new Set(["takeaway", "pickup", "PickUp", "delivery"]);

export default function OrderPanel({ onPay }) {
  const { currentOrder, subtotal, total, clearCart, boxPrice, setIncludesBox } =
    useApp();
  const { items } = currentOrder;
  const canAddBox = BOX_ORDER_TYPES.has(currentOrder.orderType);
  const includesBox = Boolean(currentOrder.includesBox);

  return (
    <div className="flex flex-col h-full bg-pizza-gray border-l border-pizza-gray-3">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 sm:px-4 sm:py-3  border-b border-pizza-gray-3">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-pizza-red" />
          <h2 className="text-pizza-dark font-bold text-base">Orden Actual</h2>
          {items.length > 0 && (
            <span className="badge bg-pizza-red text-white">
              {items.length}
            </span>
          )}
        </div>
        {items.length > 0 && (
          <button
            onClick={clearCart}
            className="text-pizza-muted hover:text-pizza-red transition-colors p-1.5 rounded-lg hover:bg-pizza-red/10"
            title="Limpiar orden"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 flex flex-col gap-1.5 sm:gap-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-pizza-muted">
            <div className="w-16 h-16 rounded-2xl bg-pizza-gray-2 flex items-center justify-center border border-pizza-gray-3">
              <ShoppingCart className="w-8 h-8" />
            </div>
            <p className="text-sm text-center">
              Agrega productos
              <br />
              del catálogo
            </p>
          </div>
        ) : (
          items.map((item) => <OrderItem key={item.id} item={item} />)
        )}
      </div>

      {/* Totals */}
      {items.length > 0 && (
        <div className="border-t border-pizza-gray-3 p-3 sm:p-4 flex flex-col gap-2 sm:gap-3">
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-sm">
              <span className="text-pizza-muted font-medium">Subtotal</span>
              <span className="text-pizza-dark font-semibold">
                ${subtotal.toFixed(2)}
              </span>
            </div>

            {canAddBox && (
              <label className="flex items-center justify-between gap-3 rounded-xl border border-pizza-gray-3 bg-pizza-gray-2 px-3 py-2.5 cursor-pointer select-none mt-0.5">
                <span className="flex items-center gap-2 text-sm font-semibold text-pizza-dark">
                  <Package className="w-4 h-4 text-pizza-red" />
                  Caja
                  <span className="text-xs font-normal text-pizza-muted">
                    ${boxPrice.toFixed(2)}
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={includesBox}
                  onChange={(e) => setIncludesBox(e.target.checked)}
                  className="h-4 w-4 accent-pizza-red"
                />
              </label>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-pizza-gray-3 mt-1">
              <span className="text-pizza-dark font-bold text-base">Total</span>
              <span className="text-pizza-red font-extrabold text-xl">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>

          <button
            onClick={onPay}
            className="btn-primary w-full py-3.5 text-base font-bold tracking-wide shadow-pizza-lg"
          >
            💳 Pagar ${total.toFixed(2)}
          </button>
        </div>
      )}
    </div>
  );
}