import { API_BASE } from "../../config/api";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useApp, isBoxItem } from "../../context/AppContext";
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
  Printer,
  Bike,
} from "lucide-react";
import PaymentEntryModal from "../cajero/PaymentEntryModal";
import logo from "../../assets/login/logo.png";
import axios from "axios";
import Swal from "sweetalert2";

const PAYMENT_METHODS = [
  {
    id: "mobile",
    label: "Pago Móvil",
    icon: Smartphone,
    color: "text-blue-500",
    bg: "bg-blue-50 border-blue-200 hover:border-blue-400",
  },
  {
    id: "cash",
    label: "Efectivo",
    icon: Banknote,
    color: "text-emerald-500",
    bg: "bg-emerald-50 border-emerald-200 hover:border-emerald-400",
  },
  {
    id: "pos",
    label: "Punto de Venta",
    icon: CreditCard,
    color: "text-purple-500",
    bg: "bg-purple-50 border-purple-200 hover:border-purple-400",
  },
  {
    id: "cashea",
    label: "Cashea",
    icon: Wallet,
    color: "text-pink-500",
    bg: "bg-pink-50 border-pink-200 hover:border-pink-400",
  },
  {
    id: "binance",
    label: "Binance/Zelle",
    icon: Coins,
    color: "text-amber-500",
    bg: "bg-amber-50 border-amber-200 hover:border-amber-400",
  },
];

export default function DeliveryCheckoutModal({ onClose }) {
  const { total, currentOrder, clearCart, currentUser, boxPrice } = useApp();
  const { exchangeRate } = useExchangeRate();
  const queryClient = useQueryClient();

  const ctxOrderType = currentOrder.orderType || "delivery";
  const ctxPaymentStatus = currentOrder.paymentStatus;
  const ctxAdvanceAmount = currentOrder.advanceAmount || 0;
  const ctxAdvancePaymentMethod = currentOrder.advancePaymentMethod;
  const ctxAdvanceCurrency = currentOrder.advanceCurrency || "USD";

  const initialPayments =
    ctxPaymentStatus === "partial" && ctxAdvanceAmount > 0
      ? [
          {
            method: ctxAdvancePaymentMethod || "advance",
            label:
              ctxAdvancePaymentMethod === "mobile"
                ? "Pago Móvil (abono)"
                : ctxAdvancePaymentMethod === "cash"
                  ? "Efectivo (abono)"
                  : ctxAdvancePaymentMethod === "pos"
                    ? "Punto de Venta (abono)"
                    : ctxAdvancePaymentMethod === "cashea"
                      ? "Cashea (abono)"
                      : ctxAdvancePaymentMethod === "binance"
                        ? "Binance/Zelle (abono)"
                        : "Abono previo",
            amount: ctxAdvanceAmount,
            currency: ctxAdvanceCurrency,
          },
        ]
      : [];

  const [step, setStep] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [paymentsInternal, setPaymentsInternal] = useState(initialPayments);
  const [currency, setCurrency] = useState("USD");
  const [showPaymentEntry, setShowPaymentEntry] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalToUse = total;
  const paidSoFar = paymentsInternal.reduce((s, p) => s + p.amount, 0);
  const remainingLocalUSD = Math.max(0, totalToUse - paidSoFar);

  const boxItems = currentOrder.items.filter(
    (item) => isBoxItem(item) && !item.isPendingExisting,
  );
  const soldBoxes = boxItems.reduce((sum, i) => sum + Number(i.qty || 0), 0);
  const boxesTotalUSD = boxItems.reduce(
    (sum, i) => sum + Number(i.price || 0) * Number(i.qty || 0),
    0,
  );
  const boxUnitPriceUSD =
    soldBoxes > 0 ? boxesTotalUSD / soldBoxes : Number(boxPrice) || 0;

  const formatDisplay = (usd) => {
    if (currency === "Bs") {
      return `Bs. ${(usd * (exchangeRate || 0)).toFixed(2)}`;
    }
    return `$${usd.toFixed(2)}`;
  };

  const mapPaymentMethodToApi = (method) => {
    switch (method) {
      case "pos":
        return "Punto";
      case "cash":
        return "Efectivo";
      case "mobile":
        return "Pago_Movil";
      case "cashea":
        return "Cashea";
      case "binance":
        return "Binance/Zelle";
      case "advance":
        return "Abono";
      default:
        return method;
    }
  };

  const getProductTypeForApi = (category) => {
    switch (category) {
      case "pizzas":
        return "Pizza";
      case "drinks":
        return "Bebida";
      case "icecream":
        return "Helado";
      case "combos":
        return "Combo";
      default:
        return "Pizza";
    }
  };

  const getProductOriginId = (item) => {
    const value =
      item.productId ??
      item.productOriginId ??
      item.id ??
      item.id_helado ??
      item.id_heladeria;
    const id = typeof value === "string" ? parseInt(value, 10) : Number(value);
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error(
        `El producto "${item.name || "sin nombre"}" no tiene un identificador válido.`,
      );
    }
    return id;
  };

  const handleSelectMethod = (method) => {
    setSelectedMethod(method);
    setShowPaymentEntry(true);
  };

  const handleAddFromModal = (amountUSD) => {
    setPaymentsInternal((prev) => [
      ...prev,
      {
        method: selectedMethod.id,
        label: selectedMethod.label,
        amount: amountUSD,
        currency: currency,
      },
    ]);
    setShowPaymentEntry(false);
    setSelectedMethod(null);

    if (totalToUse - (paidSoFar + amountUSD) <= 0.01) {
      setStep(2);
    }
  };

  const handleProcesarVenta = async () => {
    setError("");

    if (!currentOrder.items.length) {
      setError("El carrito no debe estar vacío.");
      return;
    }

    const paymentTotalUsd = paymentsInternal.reduce(
      (sum, payment) => sum + payment.amount,
      0,
    );
    if (paymentTotalUsd + 0.0001 < totalToUse) {
      setError(
        "La suma de los pagos debe igualar o superar el monto total en USD.",
      );
      return;
    }

    const clienteIdReal = currentOrder.customer?.id
      ? currentOrder.customer.id
      : 1;

    let payload;
    try {
      payload = {
        id_cliente: clienteIdReal,
        id_usuario: currentUser?.id || 1,
        id_delivery: currentOrder.deliveryId || null,
        despacho: "Delivery",
        tasa_cambio: Number((exchangeRate || 0).toFixed(2)),
        monto_total_usd: Number(totalToUse.toFixed(2)),
        monto_total_bs: Number((totalToUse * (exchangeRate || 0)).toFixed(2)),
        cantidad_cajas: soldBoxes,
        precio_caja_usd: Number(boxUnitPriceUSD.toFixed(2)),
        monto_cajas_usd: Number(boxesTotalUSD.toFixed(2)),
        monto_cajas_bs: Number(
          (boxesTotalUSD * (exchangeRate || 0)).toFixed(2),
        ),
        pagos: paymentsInternal.map((payment) => ({
          metodo: mapPaymentMethodToApi(payment.method),
          monto_usd: Number(payment.amount.toFixed(2)),
          monto_bs: Number((payment.amount * (exchangeRate || 0)).toFixed(2)),
          referencia: payment.reference || payment.currency,
        })),
        detalles: currentOrder.items
          .filter((item) => !isBoxItem(item))
          .map((item) => ({
            tipo_producto: getProductTypeForApi(item.category),
            id_producto_origen: getProductOriginId(item),
            cantidad: Number(item.qty || 1),
            monto_total: Number(
              (Number(item.price || 0) * Number(item.qty || 1)).toFixed(2),
            ),
            nota: item.note || "",
            extras: (item.extras || []).map((extra) => Number(extra.id)),
          })),
      };
    } catch (validationError) {
      setError(validationError.message);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `${API_BASE}/procesar-venta`,
        payload,
        { withCredentials: true },
      );

      if (response.data?.success) {
        Swal.fire({
          icon: "success",
          title: "¡Orden Creada!",
          text: "La orden delivery ha sido registrada y enviada a cocina exitosamente.",
          confirmButtonColor: "#EA2A33",
          confirmButtonText: "Aceptar",
          timer: 2500,
          timerProgressBar: true,
          customClass: {
            popup: "rounded-2xl font-sans shadow-2xl border border-slate-100",
            title: "text-lg font-black text-slate-800",
            confirmButton: "px-6 py-2.5 font-bold rounded-xl text-sm",
          },
        });
        if (window.Toast) {
          window.Toast.fire({
            icon: "success",
            title: "¡Venta delivery procesada exitosamente!",
          });
        }
        queryClient.invalidateQueries({ queryKey: ["ventasHoy"] });
        queryClient.invalidateQueries({ queryKey: ["pedidosActivos"] });
        queryClient.invalidateQueries({ queryKey: ["entregas"] });
        clearCart();
        onClose();
      } else {
        setError(response.data?.message || "No se pudo procesar la venta.");
      }
    } catch (err) {
      console.error("Error al procesar la venta:", err);
      const errMsg =
        err.response?.data?.message ||
        "Ocurrió un error en el servidor al procesar la venta.";
      setError(errMsg);
      Swal.fire({
        icon: "error",
        title: "Error al crear la orden",
        text: errMsg,
        confirmButtonColor: "#EA2A33",
        confirmButtonText: "Entendido",
        customClass: {
          popup: "rounded-2xl font-sans shadow-2xl border border-slate-100",
          title: "text-lg font-black text-slate-800",
          confirmButton: "px-6 py-2.5 font-bold rounded-xl text-sm",
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmAndPrint = async () => {
    window.print();
    await handleProcesarVenta();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-800 text-lg">
              {step === 1 ? "Resumen de Pago" : "Ticket de Venta"}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-red-100 text-pizza-red px-2 py-0.5 rounded-full border border-red-200">
              <Bike className="w-3.5 h-3.5" />
              Delivery
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 hide-scrollbar">
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-semibold">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-4">
              {/* Tarjeta de Total a Pagar y Moneda */}
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200/60 rounded-xl">
                <div>
                  <span className="text-slate-500 font-bold text-xs uppercase tracking-wider block">
                    Total a Pagar
                  </span>
                  <div className="text-slate-800 font-black text-2xl mt-0.5">
                    {formatDisplay(totalToUse)}
                  </div>
                  {exchangeRate > 0 && (
                    <div className="text-slate-500 text-xs font-semibold mt-0.5">
                      {currency === "USD"
                        ? `≈ Bs. ${(totalToUse * exchangeRate).toFixed(2)}`
                        : `≈ $${totalToUse.toFixed(2)}`}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setCurrency("USD")}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                      currency === "USD"
                        ? "bg-pizza-red text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-800"
                    }`}
                  >
                    USD ($)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency("Bs")}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                      currency === "Bs"
                        ? "bg-pizza-red text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-800"
                    }`}
                  >
                    Bs.
                  </button>
                </div>
              </div>

              {/* Cliente Asociado */}
              {currentOrder.customer && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-emerald-800 block">
                      Cliente: {currentOrder.customer.name}
                    </span>
                    <span className="text-emerald-600">
                      {currentOrder.customer.phone ||
                        currentOrder.customer.cedula ||
                        "Delivery"}
                    </span>
                  </div>
                  <span className="bg-emerald-100 text-emerald-700 font-extrabold px-2 py-0.5 rounded-md text-[10px]">
                    Confirmado
                  </span>
                </div>
              )}

              <p className="text-slate-600 font-bold text-sm">
                Selecciona el método de pago:
              </p>

              {/* Lista de Métodos */}
              <div className="flex flex-col gap-2.5">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => handleSelectMethod(method)}
                      className={`flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all duration-200 ${method.bg} active:scale-[0.99]`}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm">
                        <Icon className={`w-5 h-5 ${method.color}`} />
                      </div>
                      <span className="text-slate-800 font-bold flex-1 text-left text-sm">
                        {method.label}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  );
                })}
              </div>

              {/* Modal de Ingreso de Monto para el método */}
              {showPaymentEntry && selectedMethod && (
                <PaymentEntryModal
                  method={selectedMethod}
                  currency={currency}
                  exchangeRate={exchangeRate}
                  remainingUSD={remainingLocalUSD}
                  onAdd={handleAddFromModal}
                  onClose={() => setShowPaymentEntry(false)}
                />
              )}

              {/* Pagos Agregados */}
              {paymentsInternal.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <p className="text-slate-700 text-xs font-black uppercase tracking-wider mb-2">
                    Pagos Registrados
                  </p>
                  <div className="flex flex-col gap-1.5 divide-y divide-slate-100">
                    {paymentsInternal.map((p, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center text-sm pt-1.5"
                      >
                        <span className="font-semibold text-slate-700">
                          {p.label}
                        </span>
                        <span className="font-bold text-slate-900">
                          {currency === "Bs"
                            ? `Bs. ${(p.amount * (exchangeRate || 0)).toFixed(2)}`
                            : `$${p.amount.toFixed(2)}`}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between font-extrabold text-sm border-t border-slate-200 mt-3 pt-2 text-slate-800">
                    <span>Restante por pagar</span>
                    <span
                      className={
                        remainingLocalUSD > 0.01
                          ? "text-red-600"
                          : "text-emerald-600"
                      }
                    >
                      {formatDisplay(remainingLocalUSD)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col items-center gap-4">
              {/* Ticket Preview Exacto */}
              <div className="w-full bg-slate-50 border border-slate-200 border-dashed rounded-xl p-4 sm:p-5 font-mono text-xs shadow-sm relative">
                <div className="text-center mb-4">
                  <div className="flex justify-center items-center gap-3 mb-2">
                    <img
                      src={logo}
                      alt="Logo Pizzería"
                      className="w-16 h-auto"
                    />
                    <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center shadow-sm border border-emerald-100">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>
                  </div>
                  <h3 className="font-black text-base tracking-widest uppercase text-slate-800">
                    PIZZERÍA
                  </h3>
                  <span className="inline-block bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold mt-1">
                    ORDEN DELIVERY
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Ticket #{Math.floor(Math.random() * 10000)}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {new Date().toLocaleDateString()} -{" "}
                    {new Date().toLocaleTimeString()}
                  </p>
                </div>

                {/* Datos del Cliente */}
                {currentOrder.customer && (
                  <div className="border-t border-dashed border-slate-300 py-2.5 text-xs text-slate-600 space-y-1">
                    <div className="font-bold text-slate-800 text-[11px]">
                      DATOS DEL CLIENTE
                    </div>
                    <div className="flex justify-between">
                      <span>Nombre:</span>
                      <span className="font-bold">
                        {currentOrder.customer.name}
                      </span>
                    </div>
                    {currentOrder.customer.phone && (
                      <div className="flex justify-between">
                        <span>Teléfono:</span>
                        <span className="font-medium">
                          {currentOrder.customer.phone}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Items */}
                <div className="space-y-1.5 border-t border-b border-dashed border-slate-300 py-2.5 my-2">
                  {currentOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span className="text-slate-700">
                        {item.qty}x {item.name}
                      </span>
                      <span className="font-bold text-slate-800">
                        {currency === "Bs"
                          ? `Bs. ${(item.price * item.qty * (exchangeRate || 0)).toFixed(2)}`
                          : `$${(item.price * item.qty).toFixed(2)}`}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="flex justify-between font-black text-sm border-t border-slate-300 pt-2">
                  <span>TOTAL PAGADO</span>
                  <div className="text-right">
                    <div>
                      {currency === "Bs"
                        ? `Bs. ${(paidSoFar * (exchangeRate || 0)).toFixed(2)}`
                        : `$${paidSoFar.toFixed(2)}`}
                    </div>
                    <div className="text-slate-500 text-[10px] font-normal">
                      {currency === "Bs"
                        ? formatDisplay(totalToUse)
                        : formatDisplay(totalToUse)}
                    </div>
                  </div>
                </div>

                {/* Métodos Usados */}
                <div className="text-center text-[10px] text-slate-500 mt-3 uppercase font-semibold">
                  {paymentsInternal.map((p, i) => (
                    <span key={i}>
                      {p.label}
                      {i < paymentsInternal.length - 1 ? " + " : ""}
                    </span>
                  ))}
                </div>
              </div>

              {/* Botones de acción final */}
              <div className="flex w-full gap-3 mt-2">
                <button
                  type="button"
                  onClick={handleConfirmAndPrint}
                  disabled={isSubmitting}
                  className={`flex-1 py-3.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                    isSubmitting
                      ? "bg-slate-400 text-slate-200 cursor-not-allowed"
                      : "bg-slate-800 hover:bg-slate-900 text-white"
                  }`}
                >
                  <Printer className="w-4 h-4" />
                  {isSubmitting ? "Procesando..." : "Imprimir"}
                </button>
                <button
                  type="button"
                  onClick={handleProcesarVenta}
                  disabled={isSubmitting}
                  className={`flex-1 py-3.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                    isSubmitting
                      ? "bg-slate-400 text-slate-200 cursor-not-allowed"
                      : "bg-pizza-red hover:bg-red-600 text-white"
                  }`}
                >
                  {isSubmitting ? "Procesando..." : "Cerrar"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
