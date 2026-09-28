import { useState } from "react";
import { X, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { useProducts, useExtras } from "../../hooks/useProducts";
import { useExchangeRate } from "../../hooks/useExchangeRate";
import { useKitchenOrders } from "../../hooks/useKitchenOrders";
import PaymentEntryModal from "./PaymentEntryModal";
import { tieneExtrasGratis } from "../../utils/extrasPrecio";

const SIZE_OPTIONS = ["Normal", "Familiar", "Gigante"];

const calculateItemPrice = (basePrice, size, extras = [], nombreProducto = "") => {
  let multiplier = 1;
  if (size === "Familiar") multiplier = 1.3;
  if (size === "Gigante") multiplier = 1.6;
  const extrasCost = tieneExtrasGratis(nombreProducto)
    ? 0
    : extras.reduce((sum, e) => sum + e.price, 0);
  return basePrice * multiplier + extrasCost;
};

export default function OrderPaymentAdjustmentModal({
  originalOrder,
  editedItems,
  onClose,
}) {
  const { data: products } = useProducts();
  const { data: extras } = useExtras();
  const { exchangeRate } = useExchangeRate();
  const { updateOrder } = useKitchenOrders();
  const pizzaProducts = products?.pizzas || [];

  const findProductByName = (name) => {
    if (!products) return null;
    return Object.values(products)
      .flat()
      .find((product) => product.name === name);
  };

  const isPizzaItem = (item) => pizzaProducts.some((p) => p.name === item.name);

  const fixedItems = (editedItems || originalOrder.items).filter(
    (item) => !isPizzaItem(item),
  );
  const initialPizzaItems = (editedItems || originalOrder.items)
    .filter(isPizzaItem)
    .map((item) => {
      const product = pizzaProducts.find((p) => p.name === item.name) || {};
      return {
        ...item,
        productId: product.id || null,
        basePrice: product.price || item.basePrice || 0,
        emoji: product.emoji || "🍕",
        extras: item.extras ? [...item.extras] : [],
        note: item.note || "",
        size: item.size || "Personal",
      };
    });

  const [pizzaItems, setPizzaItems] = useState(initialPizzaItems);
  const [selectedPizzaId, setSelectedPizzaId] = useState(
    pizzaProducts[0]?.id || "",
  );
  const [selectedSize, setSelectedSize] = useState("Personal");
  const [selectedQty, setSelectedQty] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [selectedNote, setSelectedNote] = useState("");
  const [showPaymentEntry, setShowPaymentEntry] = useState(false);
  const [payments, setPayments] = useState([]);
  const [step, setStep] = useState(1);

  const originalTotal = originalOrder.total || 0;
  const fixedTotal = fixedItems.reduce((sum, item) => {
    const product = findProductByName(item.name);
    const price =
      item.price ||
      calculateItemPrice(
        product?.price || 0,
        item.size,
        item.extras || [],
        item.name,
      );
    return sum + price * item.qty;
  }, 0);
  const pizzaTotal = pizzaItems.reduce(
    (sum, item) =>
      sum +
      calculateItemPrice(item.basePrice, item.size, item.extras, item.name) *
        item.qty,
    0,
  );
  const newTotal = fixedTotal + pizzaTotal;
  const delta = newTotal - originalTotal;
  const paidAdjustment = payments.reduce((sum, value) => sum + value, 0);
  const remainingUSD = Math.max(0, delta - paidAdjustment);

  const displayCurrency = (usd) => `Bs. ${(usd * exchangeRate).toFixed(2)}`;

  const toggleSelectedExtra = (extra) => {
    setSelectedExtras((prev) =>
      prev.some((e) => e.id === extra.id)
        ? prev.filter((e) => e.id !== extra.id)
        : [...prev, extra],
    );
  };

  const addPizzaToOrder = () => {
    const product = pizzaProducts.find((p) => p.id === selectedPizzaId);
    if (!product) return;
    const newItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      productId: product.id,
      name: product.name,
      basePrice: product.price,
      price: calculateItemPrice(
        product.price,
        selectedSize,
        selectedExtras,
        product.name,
      ),
      size: selectedSize,
      qty: selectedQty,
      extras: selectedExtras,
      category: "pizzas",
      emoji: product.emoji,
      note: selectedNote,
    };
    setPizzaItems((prev) => [...prev, newItem]);
    setSelectedQty(1);
    setSelectedExtras([]);
    setSelectedNote("");
  };

  const removePizzaItem = (id) => {
    setPizzaItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQty = (id, qty) => {
    setPizzaItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: Math.max(1, qty) } : item,
      ),
    );
  };

  const updatePizzaItem = (id, update) => {
    setPizzaItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, ...update };
        if (update.extras || update.size) {
          updated.price = calculateItemPrice(
            updated.basePrice,
            updated.size,
            updated.extras || item.extras,
            updated.name,
          );
        }
        return updated;
      }),
    );
  };

  const handleAddAdjustmentPayment = (amountUSD) => {
    setPayments((prev) => {
      const nextPayments = [...prev, amountUSD];
      if (
        nextPayments.reduce((sum, value) => sum + value, 0) >=
        delta - 0.001
      ) {
        setStep(2);
      }
      return nextPayments;
    });
    setShowPaymentEntry(false);
  };

  const handleConfirm = () => {
    const updatedOrder = {
      ...originalOrder,
      items: [...fixedItems, ...pizzaItems],
      total: newTotal,
    };
    updateOrder(updatedOrder);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content w-full max-w-[760px] max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="font-bold text-lg">
              Modificar Pago - {originalOrder.id}
            </h3>
            <p className="text-sm text-slate-500">
              Ajusta las pizzas y revisa la diferencia total
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-pizza-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
              <h4 className="font-semibold text-slate-800 mb-3">
                Pizza actual
              </h4>
              {pizzaItems.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No hay pizzas en el pedido actual.
                </p>
              ) : (
                <div className="space-y-3">
                  {pizzaItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-200 bg-white p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-800">
                            {item.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {item.size} · x{item.qty}
                          </p>
                        </div>
                        <button
                          onClick={() => removePizzaItem(item.id)}
                          className="text-pizza-red text-xs font-semibold flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" /> Eliminar
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className="text-xs text-slate-500">
                            Tamaño
                          </label>
                          <select
                            value={item.size}
                            onChange={(e) =>
                              updatePizzaItem(item.id, {
                                size: e.target.value,
                                extras: item.extras,
                              })
                            }
                            className="input-field w-full mt-1"
                          >
                            {pizzaProducts
                              .find((p) => p.id === item.productId)
                              ?.sizes?.map((size) => (
                                <option key={size} value={size}>
                                  {size}
                                </option>
                              )) || []}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-500">
                            Cantidad
                          </label>
                          <input
                            type="number"
                            value={item.qty}
                            onChange={(e) =>
                              updateQty(
                                item.id,
                                parseInt(e.target.value, 10) || 1,
                              )
                            }
                            className="input-field w-full mt-1"
                            min={1}
                          />
                        </div>
                      </div>
                      <div className="mt-3">
                        <label className="text-xs text-slate-500">Extras</label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {extras.map((extra) => {
                            const selected = item.extras.some(
                              (e) => e.id === extra.id,
                            );
                            return (
                              <button
                                key={extra.id}
                                type="button"
                                onClick={() => {
                                  const nextExtras = selected
                                    ? item.extras.filter(
                                        (e) => e.id !== extra.id,
                                      )
                                    : [
                                        ...item.extras,
                                        { ...extra, isNew: true },
                                      ];
                                  updatePizzaItem(item.id, {
                                    extras: nextExtras,
                                  });
                                }}
                                className={`px-3 py-1 rounded-full text-xs border ${selected ? "bg-pizza-red text-white border-pizza-red" : "bg-white text-slate-700 border-slate-200"}`}
                              >
                                {extra.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      {item.note && (
                        <p className="text-xs text-slate-500 mt-2">
                          Nota: {item.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
              <h4 className="font-semibold text-slate-800 mb-3">
                Agregar / reemplazar pizza
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500">Pizza</label>
                  <select
                    value={selectedPizzaId}
                    onChange={(e) => setSelectedPizzaId(e.target.value)}
                    className="input-field w-full mt-1"
                  >
                    {pizzaProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500">Tamaño</label>
                    <select
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(e.target.value)}
                      className="input-field w-full mt-1"
                    >
                      {SIZE_OPTIONS.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Cantidad</label>
                    <input
                      type="number"
                      value={selectedQty}
                      min={1}
                      onChange={(e) =>
                        setSelectedQty(
                          Math.max(1, parseInt(e.target.value, 10) || 1),
                        )
                      }
                      className="input-field w-full mt-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Extras</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {extras.map((extra) => {
                      const selected = selectedExtras.some(
                        (e) => e.id === extra.id,
                      );
                      return (
                        <button
                          key={extra.id}
                          type="button"
                          onClick={() => toggleSelectedExtra(extra)}
                          className={`px-3 py-1 rounded-full text-xs border ${selected ? "bg-pizza-red text-white border-pizza-red" : "bg-white text-slate-700 border-slate-200"}`}
                        >
                          {extra.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Nota</label>
                  <textarea
                    value={selectedNote}
                    onChange={(e) => setSelectedNote(e.target.value)}
                    className="w-full mt-1 p-2 border rounded text-sm"
                    placeholder="Mitad queso / mitad champiñones"
                  />
                </div>
                <button
                  type="button"
                  onClick={addPizzaToOrder}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-pizza-red text-white font-bold hover:bg-pizza-red-dark transition"
                >
                  <Plus className="w-4 h-4" /> Agregar pizza
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-4 mb-3">
              <div>
                <p className="text-sm text-slate-500">Total anterior</p>
                <p className="font-bold text-slate-800">
                  ${originalTotal.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Nuevo total</p>
                <p className="font-bold text-slate-800">
                  ${newTotal.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Diferencia</p>
                <p
                  className={`font-bold ${delta >= 0 ? "text-emerald-600" : "text-amber-600"}`}
                >
                  {delta >= 0 ? "+" : ""}${Math.abs(delta).toFixed(2)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400 mb-2">
                  Pago actual
                </p>
                <p className="text-sm text-slate-700">
                  No modificado en este flujo
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400 mb-2">
                  Ajuste
                </p>
                <p className="text-sm text-slate-700">
                  {delta >= 0
                    ? "Cobrar monto extra"
                    : "El pedido queda más barato (ajuste de devolución)"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowPaymentEntry(true)}
              disabled={delta <= 0}
              className="btn-primary"
            >
              Modificar Pago
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="btn-secondary"
            >
              Guardar orden
            </button>
          </div>

          {showPaymentEntry && (
            <PaymentEntryModal
              method={{ id: "adjust", label: "Pago Ajuste" }}
              currency="Bs"
              exchangeRate={exchangeRate}
              remainingUSD={remainingUSD}
              onAdd={handleAddAdjustmentPayment}
              onClose={() => setShowPaymentEntry(false)}
            />
          )}

          {step === 2 && (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              <div>
                <p className="font-semibold text-emerald-700">Pago ajustado</p>
                <p className="text-sm text-emerald-700">
                  El monto extra fue registrado y puedes guardar el pedido.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
