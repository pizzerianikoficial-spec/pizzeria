import { X, AlertCircle, Zap } from "lucide-react";
import React from "react";

export default function PaymentEntryModal({
  method,
  currency = "Bs",
  exchangeRate = 1,
  remainingUSD,
  onAdd,
  onClose,
}) {
  // Cashea siempre se cobra/muestra en dólares (USD), sin importar la moneda activa
  const activeCurrency = method?.id === "cashea" ? "USD" : currency;

  // Redondeamos el restante hacia ABAJO a 2 decimales para que el monto
  // precargado nunca supere el saldo real restante en USD (evita falsos
  // "El monto no puede exceder" cuando el método previo se pagó en Bs).
  const remainingDisplayUSD =
    remainingUSD == null
      ? null
      : Math.max(0, Math.floor(remainingUSD * 100) / 100);

  // Pre-cargar el monto restante convertido a la moneda activa
  const initialDisplay =
    remainingDisplayUSD == null
      ? ""
      : activeCurrency === "Bs"
        ? (remainingDisplayUSD * (exchangeRate || 0)).toFixed(2)
        : remainingDisplayUSD.toFixed(2);

  const [amountInput, setAmountInput] = React.useState(initialDisplay);
  const [error, setError] = React.useState("");

  const displayRemaining =
    remainingDisplayUSD == null
      ? null
      : activeCurrency === "Bs"
        ? remainingDisplayUSD * (exchangeRate || 0)
        : remainingDisplayUSD;

  const displayRemainingText =
    displayRemaining == null ? null : displayRemaining.toFixed(2);

  const parseToUSD = (val) => {
    const v = parseFloat(val);
    if (isNaN(v) || v <= 0) return NaN;
    if (activeCurrency === "Bs") {
      const r = exchangeRate || 0;
      if (r <= 0) return NaN;
      return v / r;
    }
    return v;
  };

  const amountUSD = parseToUSD(amountInput);
  // Tolerancia de ~1 céntimo por redondeos Bs <-> USD
  const maxAllowedUSD =
    remainingUSD == null ? null : remainingUSD + 0.011;
  const isValid =
    !isNaN(amountUSD) &&
    amountUSD > 0 &&
    (maxAllowedUSD == null || amountUSD <= maxAllowedUSD);
  const exceedsMax =
    maxAllowedUSD != null &&
    !isNaN(amountUSD) &&
    amountUSD > maxAllowedUSD;

  // Equivalencia en tiempo real para la otra moneda
  const equivalent =
    !isNaN(amountUSD) && amountUSD > 0 && (exchangeRate || 0) > 0
      ? activeCurrency === "Bs"
        ? `≈ $${amountUSD.toFixed(2)}`
        : `≈ Bs. ${(amountUSD * exchangeRate).toFixed(2)}`
      : null;

  const handleAdd = () => {
    if (!isValid) {
      setError("Monto inválido o excede el saldo restante");
      return;
    }
    // Clamp: nunca añadir más de lo que queda por pagar en USD
    const finalAmount =
      remainingUSD == null ? amountUSD : Math.min(amountUSD, remainingUSD);
    onAdd(finalAmount);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && isValid) handleAdd();
    if (e.key === "Escape") onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content w-full max-w-[420px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800">{method.label}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {remainingUSD == null ? "Monto del abono" : "Saldo restante:"}{" "}
              {displayRemainingText != null && (
                <span className="font-bold text-slate-700">
                  {activeCurrency === "Bs"
                    ? `Bs. ${displayRemainingText}`
                    : `$${displayRemainingText}`}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 flex flex-col gap-3 sm:gap-4">
          {/* Input de monto — precargado y editable */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              {remainingUSD == null ? "Monto del abono" : "Monto a cobrar"}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">
                {activeCurrency === "Bs" ? "Bs." : "$"}
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amountInput}
                onChange={(e) => {
                  setAmountInput(e.target.value);
                  setError("");
                }}
                onKeyDown={handleKeyDown}
                onFocus={(e) => e.target.select()}
                className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 text-xl sm:text-2xl font-extrabold text-slate-800 bg-slate-50 border-2 border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-pizza-red focus:ring-2 focus:ring-pizza-red/20 transition-all"
                autoFocus
              />
            </div>
            {/* Equivalencia en tiempo real */}
            {equivalent && (
              <p className="text-xs text-slate-500 font-semibold mt-1.5 ml-1">
                {equivalent}
              </p>
            )}
          </div>

          {/* Atajo: rellenar monto exacto restante */}
          {displayRemainingText != null && (
            <button
              onClick={() => {
                setAmountInput(displayRemainingText);
                setError("");
              }}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-semibold transition-colors"
            >
              <Zap className="w-4 h-4 text-pizza-red" />
              Usar monto exacto (
              {activeCurrency === "Bs"
                ? `Bs. ${displayRemainingText}`
                : `$${displayRemainingText}`}
              )
            </button>
          )}

          {/* Error en vivo: supera el máximo permitido */}
          {exceedsMax ? (
            <div className="flex items-center gap-2 text-pizza-red text-sm bg-red-50 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" />{" "}
              {`El monto no puede exceder ${activeCurrency === "Bs" ? `Bs. ${displayRemainingText}` : `$${displayRemainingText}`}`}
            </div>
          ) : (
            error && (
              <div className="flex items-center gap-2 text-pizza-red text-sm bg-red-50 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )
          )}

          {/* Botones */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAdd}
              disabled={!isValid}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                isValid
                  ? "bg-slate-800 hover:bg-slate-900 text-white shadow-md active:scale-[0.98]"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              {remainingUSD == null ? "Registrar abono" : "Registrar pago"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
