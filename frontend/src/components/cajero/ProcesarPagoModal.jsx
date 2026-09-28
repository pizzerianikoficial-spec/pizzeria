import { useState } from "react";
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
  Zap,
} from "lucide-react";

const PAYMENT_METHODS = [
  {
    id: "mobile",
    label: "Pago Móvil",
    icon: Smartphone,
    color: "text-blue-400",
    bg: "bg-blue-400/10 border-blue-400/30 hover:border-blue-400",
    reqRef: false,
  },
  {
    id: "cash",
    label: "Efectivo",
    icon: Banknote,
    color: "text-green-400",
    bg: "bg-green-400/10 border-green-400/30 hover:border-green-400",
    reqRef: false,
  },
  {
    id: "pos",
    label: "Punto de Venta",
    icon: CreditCard,
    color: "text-purple-400",
    bg: "bg-purple-400/10 border-purple-400/30 hover:border-purple-400",
    reqRef: false,
  },
  {
    id: "binance",
    label: "Binance/Zelle",
    icon: Coins,
    color: "text-amber-400",
    bg: "bg-amber-400/10 border-amber-400/30 hover:border-amber-400",
    reqRef: false,
  },
];

export default function ProcesarPagoModal({
  montoSobreescrito,
  cliente,
  pizzaItems = [],
  onClose,
  onSuccess,
}) {
  const { exchangeRate } = useExchangeRate();
  const [step, setStep] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [amountInput, setAmountInput] = useState("");
  const [referencia, setReferencia] = useState("");
  const [error, setError] = useState("");
  const [currency, setCurrency] = useState("Bs");
  const [paymentUSD, setPaymentUSD] = useState(0);

  const remainingUSD = Number(montoSobreescrito || 0);
  const SelectedIcon = selectedMethod?.icon;

  const formatDisplay = (usd) => {
    if (currency === "Bs") {
      const rate = exchangeRate || 0;
      return `Bs. ${(usd * rate).toFixed(2)}`;
    }
    return `$${usd.toFixed(2)}`;
  };

  const formatDisplayUSD = (usd) => `$${usd.toFixed(2)}`;

  const parseInputToUSD = (inputVal) => {
    const value = inputVal?.toString().replace(",", ".");
    const v = parseFloat(value);
    if (isNaN(v) || v <= 0) return NaN;
    if (currency === "Bs") {
      const rate = exchangeRate || 0;
      if (rate <= 0) return NaN;
      return v / rate;
    }
    return v;
  };

  const orderSummary = pizzaItems.map((item) => {
    const extrasLabel = (item.extras || [])
      .map((extra) => extra.nombre)
      .filter(Boolean)
      .join(", ");
    return `${item.cantidad} x ${item.nombre_producto}${
      extrasLabel ? ` (${extrasLabel})` : ""
    }`;
  });

  const displayRemaining =
    currency === "Bs"
      ? (remainingUSD * (exchangeRate || 0)).toFixed(2)
      : remainingUSD.toFixed(2);

  const equivalentAmount = () => {
    const amountUSD = parseInputToUSD(amountInput);
    if (isNaN(amountUSD) || amountUSD <= 0 || !exchangeRate) return null;
    return currency === "Bs"
      ? `≈ $${amountUSD.toFixed(2)}`
      : `≈ Bs. ${(amountUSD * exchangeRate).toFixed(2)}`;
  };

  const handleSelectMethod = (method) => {
    setSelectedMethod(method);
    setStep(2);
    setAmountInput(displayRemaining);
    setReferencia("");
    setError("");
  };

  const handleCurrencyChange = (nextCurrency) => {
    setCurrency(nextCurrency);
    if (step === 2) {
      setAmountInput(
        nextCurrency === "Bs"
          ? (remainingUSD * (exchangeRate || 0)).toFixed(2)
          : remainingUSD.toFixed(2),
      );
    }
  };

  const handleApply = () => {
    const amountUSD = parseInputToUSD(amountInput);
    if (isNaN(amountUSD) || amountUSD <= 0) {
      setError("Ingresa un monto válido.");
      return;
    }

    if (amountUSD < remainingUSD - 0.01) {
      setError(
        `Debes cobrar la diferencia completa: ${formatDisplay(remainingUSD)}`,
      );
      return;
    }

    if (selectedMethod?.reqRef && !referencia.trim()) {
      setError(
        "El número de referencia es obligatorio para este método de pago.",
      );
      return;
    }

    setPaymentUSD(amountUSD);
    setStep(3);
  };

  const handleConfirm = () => {
    const amountUSD = paymentUSD;
    const amountLocal =
      currency === "Bs"
        ? Number((amountUSD * (exchangeRate || 0)).toFixed(2))
        : Number(parseFloat(amountInput || "0").toFixed(2));

    onSuccess({
      metodo: selectedMethod?.id,
      referencia: selectedMethod?.reqRef ? referencia.trim() || null : null,
      moneda: currency,
      monto_usd: Number(amountUSD.toFixed(2)),
      monto_local: amountLocal,
      cliente,
      pizzas: pizzaItems,
    });
  };

  return (
    <div className="modal-backdrop z-[90]" onClick={onClose}>
      <div
        className="modal-content w-full max-w-[520px] overflow-hidden max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
          <div>
            <h2 className="text-slate-900 font-bold text-xl">
              {step === 3 ? "¡Pago Registrado!" : "Cobrar Diferencia"}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Cliente:{" "}
              <span className="font-semibold text-slate-900">
                {cliente?.nombre || "N/A"}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 bg-slate-50 space-y-4 sm:space-y-5">
          {step !== 3 && (
            <div className="rounded-xl sm:rounded-2xl md:rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                    Moneda
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleCurrencyChange("Bs")}
                    className={`px-3 py-1 rounded-full text-sm font-semibold transition ${
                      currency === "Bs"
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    Bs
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCurrencyChange("USD")}
                    className={`px-3 py-1 rounded-full text-sm font-semibold transition ${
                      currency === "USD"
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    $
                  </button>
                </div>
              </div>
              <div className="rounded-3xl bg-slate-50 border border-slate-200 p-4 flex items-center justify-between">
                <div className="text-slate-500 uppercase tracking-[0.22em] text-xs font-semibold">
                  Diferencia a pagar
                </div>
                <div className="text-right">
                  <div className="text-slate-900 font-black text-2xl">
                    {formatDisplay(remainingUSD)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {currency === "Bs"
                      ? formatDisplayUSD(remainingUSD)
                      : `Bs. ${(remainingUSD * (exchangeRate || 0)).toFixed(2)}`}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-800">
                Selecciona el método de pago
              </p>
              <div className="grid gap-3">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => handleSelectMethod(method)}
                      className={`w-full flex items-center gap-4 rounded-3xl border px-4 py-4 text-left transition ${method.bg}`}
                    >
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-white shadow-sm">
                        <Icon className={`w-5 h-5 ${method.color}`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">
                          {method.label}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {method.id === "pos"
                            ? "Punto de venta"
                            : method.id === "cash"
                              ? "Pago en efectivo"
                              : method.id === "binance"
                                ? "Binance / Zelle"
                                : "Pago móvil rápido"}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && selectedMethod && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError("");
                  }}
                  className="text-slate-500 hover:text-slate-900 text-sm font-semibold"
                >
                  ← Volver
                </button>
                <div className="inline-flex items-center gap-2 text-slate-900 font-semibold text-sm">
                  {SelectedIcon && (
                    <SelectedIcon
                      className={`${selectedMethod.color} w-5 h-5`}
                    />
                  )}
                  <span>{selectedMethod.label}</span>
                </div>
              </div>

              <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-sm">
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Monto a cobrar
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-lg">
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
                      onKeyDown={(e) => e.key === "Enter" && handleApply()}
                      className="w-full pl-14 pr-4 py-4 text-3xl font-extrabold text-slate-900 border border-slate-200 rounded-3xl focus:outline-none focus:border-pizza-red focus:ring-2 focus:ring-pizza-red/10 transition"
                      autoFocus
                    />
                  </div>
                  {equivalentAmount() && (
                    <p className="text-xs text-slate-500 mt-2">
                      {equivalentAmount()}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAmountInput(displayRemaining);
                    setError("");
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-slate-100 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
                >
                  <Zap className="w-4 h-4 text-pizza-red" />
                  Usar monto exacto (
                  {currency === "Bs"
                    ? `Bs. ${displayRemaining}`
                    : `$${displayRemaining}`}
                  )
                </button>

                {selectedMethod.reqRef && (
                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Número de referencia
                    </label>
                    <input
                      type="text"
                      value={referencia}
                      onChange={(e) => {
                        setReferencia(e.target.value);
                        setError("");
                      }}
                      placeholder="Ej. 123456"
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-pizza-red focus:ring-2 focus:ring-pizza-red/10 transition"
                      onKeyDown={(e) => e.key === "Enter" && handleApply()}
                    />
                  </div>
                )}

                {error && (
                  <div className="mt-4 flex items-center gap-2 rounded-3xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-pizza-red">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleApply}
                  className="w-full mt-6 rounded-3xl bg-slate-900 py-3.5 text-sm font-bold text-white hover:bg-slate-950 transition"
                >
                  Validar pago
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Pago procesado
              </h3>
              <p className="text-sm text-slate-500 mt-2">
                Se ha registrado el pago de la diferencia correctamente.
              </p>
              <div className="mt-6 text-left rounded-3xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700">
                <div className="flex justify-between mb-2">
                  <span className="font-semibold">Método</span>
                  <span>{selectedMethod?.label}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="font-semibold">Monto</span>
                  <span>{formatDisplay(paymentUSD)}</span>
                </div>
                {selectedMethod?.reqRef && (
                  <div className="flex justify-between text-slate-500">
                    <span>Referencia</span>
                    <span>{referencia || "N/A"}</span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleConfirm}
                className="mt-6 w-full rounded-3xl bg-slate-900 py-3.5 text-sm font-bold text-white hover:bg-slate-950 transition"
              >
                Guardar cambios del pedido
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
