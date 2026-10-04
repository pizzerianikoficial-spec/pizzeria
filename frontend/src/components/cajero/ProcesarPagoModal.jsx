import { useState } from "react";
import { useExchangeRate } from "../../hooks/useExchangeRate";
import {
  X,
  Smartphone,
  Banknote,
  CreditCard,
  Coins,
  Wallet,
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
    id: "cashea",
    label: "Cashea",
    icon: Wallet,
    color: "text-pink-400",
    bg: "bg-pink-400/10 border-pink-400/30 hover:border-pink-400",
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
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center overflow-hidden overscroll-contain bg-white/70 p-2 backdrop-blur-sm sm:p-4"
      onClick={onClose}
    >
      <div
        className="modal-content modal-max-h flex w-full max-w-[520px] flex-col overflow-hidden lg:max-w-[600px] 3xl:max-w-[680px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-whiteflex shrink-0 items-start justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6 sm:py-4 [@media(max-height:500px)]:py-2">
          <div className="min-w-0">
            <h2 className="truncate text-slate-900 font-bold text-lg sm:text-xl">
              {step === 3 ? "¡Pago Registrado!" : "Cobrar Diferencia"}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5 sm:mt-1">
              Cliente:{" "}
              <span className="font-semibold text-slate-900">
                {cliente?.nombre || "N/A"}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="-mr-1 shrink-0 rounded-lg p-2.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-scroll min-h-0 flex-1 space-y-4 bg-slate-50 p-4 sm:space-y-5 sm:p-6">
          {step !== 3 && (
            <div className="rounded-xl sm:rounded-2xl md:rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-3 sm:mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                    Moneda
                  </p>
                </div>
                <div className="flex gap-2">
                  {[
                    { value: "Bs", label: "Bs" },
                    { value: "USD", label: "$" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleCurrencyChange(opt.value)}
                      className={`min-h-[40px] min-w-[52px] rounded-full px-4 text-sm font-semibold transition ${
                        currency === opt.value
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                <div className="text-slate-500 uppercase tracking-[0.18em] text-xs font-semibold">
                  Diferencia a pagar
                </div>
                <div className="ml-auto min-w-0 text-right">
                  <div className="break-words text-xl font-black text-slate-900 sm:text-2xl">
                    {formatDisplay(remainingUSD)}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 sm:mt-1">
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
              <div className="flex flex-col gap-2.5 sm:gap-3">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => handleSelectMethod(method)}
                      className={`flex min-h-[60px] w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition sm:gap-4 sm:px-4 sm:py-4 ${method.bg}`}
                    >
                      <div className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-2xl flex items-center justify-center bg-white shadow-sm">
                        <Icon className={`w-5 h-5 ${method.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900">
                          {method.label}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {method.id === "pos"
                            ? "Punto de venta"
                            : method.id === "cash"
                              ? "Pago en efectivo"
                              : method.id === "cashea"
                                ? "Cashea - crédito digital"
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
                  className="min-h-[40px] shrink-0 text-sm font-semibold text-slate-500 hover:text-slate-900"
                >
                  ← Volver
                </button>
                <div className="inline-flex min-w-0 items-center gap-2 text-slate-900 font-semibold text-sm">
                  {SelectedIcon && (
                    <SelectedIcon
                      className={`${selectedMethod.color} w-5 h-5 shrink-0`}
                    />
                  )}
                  <span>{selectedMethod.label}</span>
                </div>
              </div>

              <div className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200 p-4 sm:p-5 shadow-sm">
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
                      className="w-full min-w-0 rounded-2xl border border-slate-200 py-3 pl-14 pr-4 text-2xl font-extrabold text-slate-900 transition focus:border-pizza-red focus:outline-none focus:ring-2 focus:ring-pizza-red/10 sm:rounded-3xl sm:py-4 sm:text-3xl"
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
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-200 sm:rounded-3xl"
                >
                  <Zap className="w-4 h-4 shrink-0 text-pizza-red" />
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
                      className="w-full min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 transition focus:border-pizza-red focus:outline-none focus:ring-2 focus:ring-pizza-red/10 sm:rounded-3xl sm:text-sm"
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
            <div className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200 p-4 sm:p-6 shadow-sm text-center">
              <div className="mx-auto mb-3 sm:mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="w-9 h-9 sm:w-10 sm:h-10 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Pago procesado
              </h3>
              <p className="text-sm text-slate-500 mt-2">
                Se ha registrado el pago de la diferencia correctamente.
              </p>
              <div className="mt-5 sm:mt-6 text-left rounded-2xl bg-slate-50 border border-slate-200 p-3 sm:p-4 text-sm text-slate-700">
                <div className="flex justify-between mb-2 gap-3">
                  <span className="font-semibold">Método</span>
                  <span className="min-w-0 break-words text-right">
                    {selectedMethod?.label}
                  </span>
                </div>
                <div className="flex justify-between mb-2 gap-3">
                  <span className="font-semibold">Monto</span>
                  <span className="min-w-0 break-words text-right">
                    {formatDisplay(paymentUSD)}
                  </span>
                </div>
                {selectedMethod?.reqRef && (
                  <div className="flex justify-between gap-3 text-slate-500">
                    <span>Referencia</span>
                    <span className="min-w-0 break-words text-right">
                      {referencia || "N/A"}
                    </span>
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
