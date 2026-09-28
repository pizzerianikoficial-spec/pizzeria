import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useApp } from "../../context/AppContext";
import { useExchangeRate } from "../../hooks/useExchangeRate";
import {
  X,
  Smartphone,
  Banknote,
  CreditCard,
  Coins,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

const PAYMENT_METHODS = [
  {
    id: "mobile",
    label: "Pago Móvil",
    icon: Smartphone,
    color: "text-blue-400",
    bg: "bg-blue-400/10 border-blue-400/30 hover:border-blue-400",
  },
  {
    id: "cash",
    label: "Efectivo",
    icon: Banknote,
    color: "text-green-400",
    bg: "bg-green-400/10 border-green-400/30 hover:border-green-400",
  },
  {
    id: "pos",
    label: "Punto de Venta",
    icon: CreditCard,
    color: "text-purple-400",
    bg: "bg-purple-400/10 border-purple-400/30 hover:border-purple-400",
  },
  {
    id: "binance",
    label: "Binance/Zelle",
    icon: Coins,
    color: "text-amber-400",
    bg: "bg-amber-400/10 border-amber-400/30 hover:border-amber-400",
  },
];

function PaymentBadge({ method, amount, currency, exchangeRate }) {
  const m = PAYMENT_METHODS.find((p) => p.id === method);
  if (!m) return null;
  const Icon = m.icon;
  const display =
    currency === "Bs"
      ? `Bs. ${(amount * (exchangeRate || 0)).toFixed(2)}`
      : `$${amount.toFixed(2)}`;
  return (
    <div className="flex items-center gap-2 bg-pizza-gray-2 border border-pizza-gray-3 rounded-lg px-3 py-2">
      <Icon className={`w-4 h-4 ${m.color}`} />
      <span className="text-sm text-pizza-muted">{m.label}</span>
      <span className="text-pizza-dark font-bold ml-auto">{display}</span>
    </div>
  );
}

export default function PaymentModal({ onClose }) {
  const { total, currentOrder, addPayment, confirmSale, amountPaid } = useApp();
  const { exchangeRate } = useExchangeRate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1); // 1 = select method, 2 = enter amount, 3 = done
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [amountInput, setAmountInput] = useState("");
  const [error, setError] = useState("");

  const [orderType, setOrderType] = useState(null);
  const [overrideTotalEnabled, setOverrideTotalEnabled] = useState(false);
  const [overrideTotal, setOverrideTotal] = useState("");
  const [currency, setCurrency] = useState("Bs"); // 'Bs' or 'USD'

  const totalPaidSoFar = currentOrder.payments.reduce(
    (s, p) => s + p.amount,
    0,
  );

  const SelectedIcon = selectedMethod ? selectedMethod.icon : null;

  const totalToUse =
    overrideTotalEnabled &&
    !isNaN(parseFloat(overrideTotal)) &&
    parseFloat(overrideTotal) > 0
      ? parseFloat(overrideTotal)
      : total;
  const localRemainingUSD = Math.max(0, totalToUse - totalPaidSoFar);

  const formatDisplay = (usd) => {
    if (currency === "Bs") {
      const rate = exchangeRate || 0;
      return `Bs. ${(usd * rate).toFixed(2)}`;
    }
    return `$${usd.toFixed(2)}`;
  };

  const parseInputToUSD = (inputVal) => {
    const v = parseFloat(inputVal);
    if (isNaN(v) || v <= 0) return NaN;
    if (currency === "Bs") {
      const rate = exchangeRate || 0;
      if (rate <= 0) return NaN;
      return v / rate;
    }
    return v;
  };

  const handleSelectMethod = (method) => {
    setSelectedMethod(method);
    setStep(2);
    // show remaining in selected currency
    const displayRemaining =
      currency === "Bs"
        ? (localRemainingUSD * (exchangeRate || 0)).toFixed(2)
        : localRemainingUSD.toFixed(2);
    setAmountInput(displayRemaining);
    setError("");
  };

  const handleApply = () => {
    const amountUSD = parseInputToUSD(amountInput);
    if (isNaN(amountUSD) || amountUSD <= 0) {
      setError("Ingresa un monto válido.");
      return;
    }
    if (amountUSD > localRemainingUSD + 0.001) {
      setError(`El monto no puede exceder ${formatDisplay(localRemainingUSD)}`);
      return;
    }

    // store amounts in USD internally
    addPayment({
      method: selectedMethod.id,
      label: selectedMethod.label,
      amount: amountUSD,
    });

    const newRemaining = localRemainingUSD - amountUSD;
    if (newRemaining <= 0.01) {
      setStep(3);
    } else {
      // Return to method selection for next payment
      setStep(1);
      setSelectedMethod(null);
      setAmountInput("");
      setError("");
    }
  };

  const handleConfirm = () => {
    confirmSale({
      total: totalToUse,
      items: currentOrder.items,
      payments: [...currentOrder.payments],
      orderType: orderType,
    });
    onClose();
    // Refrescar cola y métricas sin recargar página
    queryClient.invalidateQueries({ queryKey: ["pedidosActivos"] });
    queryClient.invalidateQueries({ queryKey: ["ventasHoy"] });
  };

  // totalPaidSoFar already computed above

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content w-full max-w-[480px] overflow-hidden max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-pizza-gray-3">
          <div>
            <h2 className="text-pizza-dark font-bold text-lg">
              {step === 3 ? "¡Pago Completado!" : "Procesar Pago"}
            </h2>
            <p className="text-pizza-muted text-sm">
              Total de la orden:{" "}
              <span className="text-pizza-dark font-semibold">
                {formatDisplay(totalToUse)}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-pizza-muted hover:text-pizza-dark p-1.5 rounded-lg hover:bg-pizza-gray-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 flex flex-col gap-3 sm:gap-5">
          {/* Payments applied so far */}
          {currentOrder.payments.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-pizza-muted text-xs font-semibold uppercase tracking-wider">
                Pagos Aplicados
              </p>
              {currentOrder.payments.map((p, i) => (
                <PaymentBadge
                  key={i}
                  method={p.method}
                  amount={p.amount}
                  currency={currency}
                  exchangeRate={exchangeRate}
                />
              ))}
            </div>
          )}

          {/* Override total + Remaining balance */}
          {step !== 3 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <label className="text-pizza-muted text-sm">Moneda:</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrency("Bs")}
                      className={`px-3 py-1 rounded-lg ${currency === "Bs" ? "bg-pizza-red/10 text-pizza-red" : "bg-pizza-gray-2"}`}
                    >
                      Bs
                    </button>
                    <button
                      onClick={() => setCurrency("USD")}
                      className={`px-3 py-1 rounded-lg ${currency === "USD" ? "bg-pizza-red/10 text-pizza-red" : "bg-pizza-gray-2"}`}
                    >
                      $
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-pizza-muted text-sm">
                    Modificar total:
                  </label>
                  <input
                    type="checkbox"
                    checked={overrideTotalEnabled}
                    onChange={(e) => setOverrideTotalEnabled(e.target.checked)}
                  />
                </div>
              </div>

              {overrideTotalEnabled && (
                <div className="flex gap-2">
                  <input
                    value={overrideTotal}
                    onChange={(e) => setOverrideTotal(e.target.value)}
                    className="input-field"
                    placeholder="Total personalizado en USD"
                  />
                  <div className="text-pizza-muted text-sm flex items-center">
                    (se usa como USD internamente)
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between bg-pizza-gray-2 border border-pizza-gray-3 rounded-xl p-4">
                <span className="text-pizza-muted font-medium">
                  Saldo Pendiente
                </span>
                <span className="text-pizza-red font-extrabold text-2xl">
                  {formatDisplay(localRemainingUSD)}
                </span>
              </div>
            </div>
          )}

          {/* STEP 1: Method selection */}
          {step === 1 && (
            <div className="flex flex-col gap-2">
              {!orderType ? (
                <div className="flex flex-col gap-2">
                  <p className="text-pizza-dark font-semibold text-sm mb-1">
                    ¿Tipo de orden?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setOrderType("dine_in")}
                      className="btn-secondary"
                    >
                      Local
                    </button>
                    <button
                      onClick={() => setOrderType("takeaway")}
                      className="btn-secondary"
                    >
                      Llevar
                    </button>

                    <button
                      onClick={() => setOrderType("delivery_ws")}
                      className="btn-secondary"
                    >
                      Delivery
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-pizza-dark font-semibold text-sm mb-1">
                    Selecciona el método de pago:
                  </p>
                  <p className="text-pizza-muted text-sm">
                    Tipo de orden:{" "}
                    <span className="font-semibold text-pizza-dark">
                      {orderType.replace("_", " ")}
                    </span>
                  </p>
                </>
              )}
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    onClick={() =>
                      orderType
                        ? handleSelectMethod(method)
                        : setError("Selecciona el tipo de orden primero")
                    }
                    className={`flex items-center gap-4 px-4 py-4 rounded-xl border transition-all duration-200 ${method.bg}`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center bg-current/5`}
                    >
                      <Icon className={`w-5 h-5 ${method.color}`} />
                    </div>
                    <span className="text-pizza-dark font-semibold flex-1 text-left">
                      {method.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-pizza-muted" />
                  </button>
                );
              })}
            </div>
          )}

          {/* STEP 2: Amount entry */}
          {step === 2 && selectedMethod && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setStep(1);
                    setError("");
                  }}
                  className="text-pizza-muted hover:text-pizza-dark transition-colors"
                >
                  ← Volver
                </button>
                <div className="flex items-center gap-2">
                  {SelectedIcon && (
                    <SelectedIcon
                      className={`w-5 h-5 ${selectedMethod.color}`}
                    />
                  )}
                  <span className="text-pizza-dark font-semibold">
                    {selectedMethod.label}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-pizza-muted text-sm mb-2 block">
                  Monto a pagar:
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-pizza-muted font-bold text-lg">
                    {currency === "Bs" ? "Bs." : "$"}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amountInput}
                    onChange={(e) => {
                      setAmountInput(e.target.value);
                      setError("");
                    }}
                    className="input-field pl-8 text-xl font-bold py-4 text-right"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleApply()}
                  />
                </div>
                {error && (
                  <div className="flex items-center gap-2 mt-2 text-pizza-red text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}
              </div>

              {/* Quick amounts */}
              <div className="flex gap-2 flex-wrap">
                {[localRemainingUSD, 20, 50, 100]
                  .filter((v, i, a) => a.indexOf(v) === i && v > 0)
                  .map((v) => (
                    <button
                      key={v}
                      onClick={() => {
                        const val =
                          currency === "Bs"
                            ? (
                                Math.min(v, localRemainingUSD) *
                                (exchangeRate || 0)
                              ).toFixed(2)
                            : Math.min(v, localRemainingUSD).toFixed(2);
                        setAmountInput(val);
                      }}
                      className="px-3 py-1.5 bg-pizza-gray-2 hover:bg-pizza-gray-3 border border-pizza-gray-3 text-pizza-dark text-sm rounded-lg transition-colors"
                    >
                      {currency === "Bs"
                        ? `Bs. ${Math.min(v, localRemainingUSD * 1).toFixed(2)}`
                        : `$${Math.min(v, localRemainingUSD).toFixed(2)}`}
                    </button>
                  ))}
              </div>

              <button
                onClick={handleApply}
                className="btn-primary py-3.5 font-bold text-base"
              >
                Pagar{" "}
                {currency === "Bs"
                  ? `Bs. ${parseFloat(amountInput || 0).toFixed(2)}`
                  : `$${parseFloat(amountInput || 0).toFixed(2)}`}
              </button>
            </div>
          )}

          {/* STEP 3: Confirmation */}
          {step === 3 && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center animate-fade-in">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <div className="text-center">
                <h3 className="text-pizza-dark font-bold text-lg">
                  Venta Confirmada
                </h3>
                <p className="text-pizza-muted text-sm mt-1">
                  La orden fue enviada a cocina
                </p>
              </div>
              <div className="w-full bg-pizza-gray-2 border border-pizza-gray-3 rounded-xl p-4 flex justify-between items-center">
                <span className="text-pizza-muted">Total pagado</span>
                <span className="text-green-500 font-extrabold text-xl">
                  {formatDisplay(totalToUse)}
                </span>
              </div>
              <button
                onClick={handleConfirm}
                className="btn-primary w-full py-3.5 font-bold text-base"
              >
                ✓ Cerrar y Nueva Orden
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
