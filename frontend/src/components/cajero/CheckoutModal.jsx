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
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  Printer,
} from "lucide-react";
import PaymentEntryModal from "./PaymentEntryModal";
import logo from "../../assets/login/logo.png";

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
    id: "binance",
    label: "Binance/Zelle",
    icon: Coins,
    color: "text-amber-500",
    bg: "bg-amber-50 border-amber-200 hover:border-amber-400",
  },
];

export default function CheckoutModal({ onClose }) {
  const { total, currentOrder, confirmSale, clearCart, currentUser, boxPrice } =
    useApp();
  const { exchangeRate } = useExchangeRate();
  const queryClient = useQueryClient();

  // Leer tipo de pedido y abono del contexto (seleccionados en OrderTypeModal)
  const ctxOrderType = currentOrder.orderType;
  const ctxPaymentStatus = currentOrder.paymentStatus;
  const ctxAdvanceAmount = currentOrder.advanceAmount || 0;
  const ctxAdvancePaymentMethod = currentOrder.advancePaymentMethod;
  const ctxAdvanceCurrency = currentOrder.advanceCurrency || "USD";
  const isPendingSale = Boolean(currentOrder.pendingSaleId);
  const pendingOriginalTotal = currentOrder.pendingOriginalTotal ?? total;
  const pendingAddedTotal = currentOrder.items
    .filter((item) => !item.isPendingExisting)
    .reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0),
      0,
    );

  // Cajas vendidas en esta venta (solo pedidos nuevos que admiten caja)
  const newBoxItems = currentOrder.items.filter(
    (item) => isBoxItem(item) && !item.isPendingExisting,
  );
  const soldBoxes = newBoxItems.reduce(
    (sum, item) => sum + Number(item.qty || 0),
    0,
  );
  const boxesTotalUSD = newBoxItems.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0),
    0,
  );
  const boxUnitPriceUSD =
    soldBoxes > 0 ? boxesTotalUSD / soldBoxes : Number(boxPrice) || 0;

  const ORDER_TYPE_LABELS = {
    local: "Local",
    takeaway: "Para Llevar",
    delivery: "Delivery",
    pickup: "Pickup",
    // backward compat
    dine_in: "Local",
    delivery_call: "Delivery (Llamada)",
    delivery_ws: "Delivery (WhatsApp)",
  };

  // Si ya hay un abono previo, precargarlo como pago inicial
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
                    : ctxAdvancePaymentMethod === "binance"
                      ? "Binance/Zelle (abono)"
                      : "Abono previo",
            amount: ctxAdvanceAmount,
            currency: ctxAdvanceCurrency,
          },
        ]
      : [];

  // internal payments array to allow splits
  const [step, setStep] = useState(1); // 1 = select/orderType & methods, 2 = preview/confirmed
  const [orderType, setOrderType] = useState(ctxOrderType || null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [paymentsInternal, setPaymentsInternal] = useState(initialPayments);
  const [currency, setCurrency] = useState("Bs");
  const [overrideTotalEnabled, setOverrideTotalEnabled] = useState(false);
  const [overrideTotal, setOverrideTotal] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // overrideTotal may be entered in current `currency`. Convert to USD internally.
  const parsedOverride = !isNaN(parseFloat(overrideTotal))
    ? parseFloat(overrideTotal)
    : null;
  let overrideUSD = null;
  if (overrideTotalEnabled && parsedOverride) {
    if (currency === "Bs") {
      const r = exchangeRate || 0;
      overrideUSD = r > 0 ? parsedOverride / r : null;
    } else {
      overrideUSD = parsedOverride;
    }
  }
  const totalToUse = isPendingSale
    ? pendingOriginalTotal + pendingAddedTotal
    : overrideUSD && overrideUSD > 0
      ? overrideUSD
      : total;
  const paidSoFar = paymentsInternal.reduce((s, p) => s + p.amount, 0);
  const remainingLocalUSD = Math.max(0, totalToUse - paidSoFar);

  const formatDisplay = (usd) => {
    if (currency === "Bs")
      return `Bs. ${(usd * (exchangeRate || 0)).toFixed(2)}`;
    return `$${usd.toFixed(2)}`;
  };

  const parseToUSD = (val) => {
    const v = parseFloat(val);
    if (isNaN(v) || v <= 0) return NaN;
    if (currency === "Bs") {
      const r = exchangeRate || 0;
      if (r <= 0) return NaN;
      return v / r;
    }
    return v;
  };

  const normalizeId = (value) => {
    const candidate =
      value && typeof value === "object"
        ? (value.id ?? value.id_delivery)
        : value;
    const numeric = Number(candidate);
    return Number.isInteger(numeric) && numeric > 0 ? numeric : null;
  };

  const mapOrderTypeToApiValue = (type) => {
    switch (type) {
      case "local":
      case "dine_in":
        return "Local";
      case "takeaway":
        return "Llevar";
      case "delivery":
      case "delivery_call":
      case "delivery_ws":
        return "Delivery";
      case "pickup":
        return "Pick Up";
      default:
        return null;
    }
  };

  const mapPaymentMethodToApi = (method) => {
    switch (method) {
      case "pos":
        return "Punto";
      case "cash":
        return "Efectivo";
      case "mobile":
        return "Pago_Movil";
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
    // open modal to enter full/partial amount
    setShowPaymentEntry(true);
  };

  const [showPaymentEntry, setShowPaymentEntry] = useState(false);

  const handleAddFromModal = (amountUSD) => {
    const deliveryId = normalizeId(currentOrder.deliveryId);
    if (mapOrderTypeToApiValue(orderType) === "Delivery" && !deliveryId) {
      setError("Debe buscar y seleccionar un repartidor antes de continuar.");
      return;
    }

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
    if (
      totalToUse -
        (paymentsInternal.reduce((s, p) => s + p.amount, 0) + amountUSD) <=
      0.01
    ) {
      setStep(2);
    }
  };

  const handleAddPayment = () => {
    const amountUSD = parseToUSD(amountInput);
    if (isNaN(amountUSD) || amountUSD <= 0) {
      setError("Monto inválido");
      return;
    }
    const deliveryId = normalizeId(currentOrder.deliveryId);
    if (mapOrderTypeToApiValue(orderType) === "Delivery" && !deliveryId) {
      setError("Debe buscar y seleccionar un repartidor antes de continuar.");
      return;
    }
    if (amountUSD > remainingLocalUSD + 0.001) {
      setError("El monto excede el restante");
      return;
    }
    setPaymentsInternal((prev) => [
      ...prev,
      {
        method: selectedMethod.id,
        label: selectedMethod.label,
        amount: amountUSD,
        currency: currency,
      },
    ]);
    setSelectedMethod(null);

    setAmountInput("");
    if (remainingLocalUSD - amountUSD <= 0.01) {
      setStep(2);
    }
  };

  const handleProcesarVenta = async () => {
    setError("");

    if (!currentOrder.items.length) {
      setError("El carrito no debe estar vacío.");
      return;
    }

    const productItems = currentOrder.items.filter((item) => !isBoxItem(item));
    if (!productItems.length) {
      setError("Debe haber al menos un producto además de las cajas.");
      return;
    }

    const despacho = mapOrderTypeToApiValue(orderType);
    if (!despacho) {
      setError("Debe seleccionar un tipo de despacho.");
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
    // Id del cliente Real, tan real como anuel aa. Brrr
    const clienteIdReal = currentOrder.customer?.id
      ? currentOrder.customer.id
      : 1;

    const deliveryIdReal =
      despacho === "Delivery" ? normalizeId(currentOrder.deliveryId) : null;

    if (despacho === "Delivery" && !deliveryIdReal) {
      setError(
        "Debe seleccionar un repartidor válido para procesar esta venta.",
      );
      return;
    }

    let payload;
    try {
      payload = {
        id_cliente: clienteIdReal,
        id_usuario: 1,
        id_delivery: deliveryIdReal,
        despacho,
        tasa_cambio: Number((exchangeRate || 0).toFixed(2)),
        monto_total_usd: Number(totalToUse.toFixed(2)),
        monto_total_bs: Number((totalToUse * (exchangeRate || 0)).toFixed(2)),
        cantidad_cajas: soldBoxes,
        precio_caja_usd: Number(boxUnitPriceUSD.toFixed(2)),
        monto_cajas_usd: Number(boxesTotalUSD.toFixed(2)),
        monto_cajas_bs: Number(
          (boxesTotalUSD * (exchangeRate || 0)).toFixed(2),
        ),
        pagos: paymentsInternal.map((payment) => {
          const isUSD = payment.currency === "USD";
          const isBs = payment.currency === "Bs";
          const isCash = mapPaymentMethodToApi(payment.method) === "Efectivo";

          return {
            metodo: mapPaymentMethodToApi(payment.method),
            monto_usd: isCash
              ? isUSD
                ? Number(payment.amount.toFixed(2))
                : 0
              : Number(payment.amount.toFixed(2)),
            monto_bs: isCash
              ? isBs
                ? Number((payment.amount * (exchangeRate || 0)).toFixed(2))
                : 0
              : Number((payment.amount * (exchangeRate || 0)).toFixed(2)),
            referencia: payment.currency || "Bs",
          };
        }),

        detalles: productItems.map((item) => {
          const idOrigen = getProductOriginId(item);

          return {
            id_detalle: item.id_detalle || null,
            tipo_producto: getProductTypeForApi(item.category),
            id_producto_origen: idOrigen,
            cantidad: item.qty,
            monto_total: Number((item.price * item.qty).toFixed(2)),
            nota: item.note || "",
            extras: item.extras
              ? item.extras.map((extra) =>
                  typeof extra.id === "string"
                    ? parseInt(extra.id.replace(/\D/g, ""))
                    : Number(extra.id),
                )
              : [],
          };
        }),
      };
    } catch (error) {
      setError(error.message);
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = isPendingSale
        ? `http://localhost:3001/api/completar-venta-pendiente/${currentOrder.pendingSaleId}`
        : "http://localhost:3001/api/procesar-venta";
      const requestPayload = isPendingSale
        ? {
            id_usuario: currentUser?.id || 1,
            monto_total_usd: Number(
              (pendingOriginalTotal + pendingAddedTotal).toFixed(2),
            ),
            monto_total_bs: Number(
              (
                (pendingOriginalTotal + pendingAddedTotal) *
                (exchangeRate || 0)
              ).toFixed(2),
            ),
            detalles: payload.detalles,
            cantidad_cajas: payload.cantidad_cajas,
            precio_caja_usd: payload.precio_caja_usd,
            monto_cajas_usd: payload.monto_cajas_usd,
            monto_cajas_bs: payload.monto_cajas_bs,
            pagos: payload.pagos.slice(currentOrder.payments.length),
          }
        : payload;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
        credentials: "include",
      });

      // 1. Validar el tipo de contenido antes de intentar parsear a JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textError = await response.text();
        console.error("Respuesta del servidor (No JSON):", textError);
        throw new Error(
          "El servidor devolvió un formato incorrecto (HTML). Verifica que tu backend esté corriendo en el puerto 3001 y que la ruta exista.",
        );
      }

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Error procesando la venta.");
      }

      confirmSale({
        total: totalToUse,
        items: currentOrder.items,
        payments: paymentsInternal,
        orderType,
      });
      clearCart();
      onClose();
      // Refrescar cola y métricas sin recargar página
      queryClient.invalidateQueries({ queryKey: ["pedidosActivos"] });
      queryClient.invalidateQueries({ queryKey: ["ventasHoy"] });
      queryClient.invalidateQueries({ queryKey: ["contadorCajero"] });
      queryClient.invalidateQueries({ queryKey: ["entregas"] });

      window.Toast.fire({
        icon: "success",
        title: "¡Venta procesada exitosamente!",
      });
    } catch (error) {
      console.error("Error al procesar la venta:", error);
      setError(error.message || "Error de conexión con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmAndPrint = () => {
    handleProcesarVenta();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div
        className="bg-white rounded-xl sm:rounded-2xl w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-slate-800 font-bold text-lg">
              {step === 2 ? "Ticket de Factura" : "Procesar Pago"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl p-4">
                <div>
                  <span className="text-slate-600 font-medium">
                    Total a Pagar
                  </span>
                  <div className="text-slate-800 font-extrabold text-lg">
                    {formatDisplay(totalToUse)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrency("Bs")}
                      className={`px-3 py-1 rounded-lg ${currency === "Bs" ? "bg-pizza-red/10 text-pizza-red" : "bg-slate-100"}`}
                    >
                      Bs
                    </button>
                    <button
                      onClick={() => setCurrency("USD")}
                      className={`px-3 py-1 rounded-lg ${currency === "USD" ? "bg-pizza-red/10 text-pizza-red" : "bg-slate-100"}`}
                    >
                      $
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-slate-600 text-sm">
                  Modificar total:
                </label>
                <input
                  type="checkbox"
                  checked={overrideTotalEnabled}
                  onChange={(e) => setOverrideTotalEnabled(e.target.checked)}
                />
                {overrideTotalEnabled && (
                  <input
                    value={overrideTotal}
                    onChange={(e) => setOverrideTotal(e.target.value)}
                    className="input-field ml-2"
                    placeholder={`Total en ${currency === "Bs" ? "Bs" : "USD"}`}
                  />
                )}
              </div>

              {!orderType ? (
                <div className="flex flex-col gap-3">
                  <p className="text-slate-600 font-medium text-sm">
                    ¿Tipo de orden?
                  </p>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <button
                      onClick={() => setOrderType("dine_in")}
                      className="btn-secondary hover:bg-pizza-red/10 hover:text-pizza-red"
                    >
                      Local
                    </button>
                    <button
                      onClick={() => setOrderType("takeaway")}
                      className="btn-secondary hover:bg-pizza-red/10 hover:text-pizza-red"
                    >
                      Llevar
                    </button>

                    <button
                      onClick={() => setOrderType("delivery_ws")}
                      className="btn-secondary hover:bg-pizza-red/10 hover:text-pizza-red"
                    >
                      Delivery
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-slate-600 font-medium text-sm">
                    Tipo:{" "}
                    <span className="font-semibold text-slate-800">
                      {ORDER_TYPE_LABELS[orderType] || orderType}
                    </span>
                  </p>

                  <p className="text-slate-600 font-medium text-sm">
                    Selecciona el método de pago:
                  </p>
                  <div className="flex flex-col gap-3">
                    {PAYMENT_METHODS.map((method) => {
                      const Icon = method.icon;
                      return (
                        <button
                          key={method.id}
                          onClick={() => handleSelectMethod(method)}
                          className={`flex items-center gap-4 px-4 py-4 rounded-xl border transition-all duration-200 ${method.bg}`}
                        >
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm">
                            <Icon className={`w-5 h-5 ${method.color}`} />
                          </div>
                          <span className="text-slate-800 font-bold flex-1 text-left">
                            {method.label}
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

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

              {paymentsInternal.length > 0 && (
                <div className="bg-white border rounded-xl p-3">
                  <p className="text-slate-600 text-sm font-semibold">Pagos</p>
                  <div className="mt-2">
                    {paymentsInternal.map((p, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <div>{p.label}</div>
                        <div>
                          {currency === "Bs"
                            ? `Bs. ${(p.amount * (exchangeRate || 0)).toFixed(2)}`
                            : `$${p.amount.toFixed(2)}`}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between font-bold mt-3">
                    <div>Restante</div>
                    <div>{formatDisplay(remainingLocalUSD)}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col items-center gap-4">
              {/* Ticket Preview */}
              <div className="w-full bg-slate-50 border border-slate-200 border-dashed rounded-lg p-3 sm:p-5 font-mono text-xs sm:text-sm shadow-sm relative">
                <div className="text-center mb-4 mt-1">
                  <div className="flex justify-center items-center gap-3 mb-3">
                    <img
                      src={logo}
                      alt="Logo Pizzería"
                      className="w-20 h-auto"
                    />
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shadow-sm border border-emerald-100">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    </div>
                  </div>
                  <h3 className="font-bold text-lg tracking-widest uppercase text-slate-800">
                    PIZZERÍA
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Ticket de Venta #{Math.floor(Math.random() * 10000)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Emisión: {new Date().toLocaleDateString()} -{" "}
                    {new Date().toLocaleTimeString()}
                  </p>
                </div>

                {/* Info Cliente */}
                {(currentOrder.customer?.name ||
                  currentOrder.customer?.cedula) && (
                  <div className="border-t border-dashed border-slate-300 py-3 text-xs text-slate-600 space-y-1">
                    <div className="font-bold text-slate-800 mb-1">
                      DATOS DEL CLIENTE
                    </div>
                    {currentOrder.customer?.name && (
                      <div className="flex justify-between">
                        <span>Nombre:</span>
                        <span className="font-medium">
                          {currentOrder.customer.name}
                        </span>
                      </div>
                    )}
                    {currentOrder.customer?.cedula && (
                      <div className="flex justify-between">
                        <span>C.I./RIF:</span>
                        <span className="font-medium">
                          {currentOrder.customer.cedula}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2 border-t border-b border-dashed border-slate-300 py-3 mb-3">
                  {currentOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>
                        {item.qty}x {item.name}
                      </span>
                      <span>
                        {currency === "Bs"
                          ? `Bs. ${(item.price * item.qty * (exchangeRate || 0)).toFixed(2)}`
                          : `$${(item.price * item.qty).toFixed(2)}`}
                      </span>
                    </div>
                  ))}
                  {/* {soldBoxes > 0 && (
                    <div className="flex justify-between font-semibold">
                      <span>
                        {soldBoxes}x {soldBoxes === 1 ? "Caja" : "Cajas"}
                      </span>
                      <span>{formatDisplay(boxesTotalUSD)}</span>
                    </div>
                  )} */}
                </div>
                <div className="flex justify-between font-bold text-base border-t border-slate-300 pt-2">
                  <span>TOTAL PAGADO</span>
                  <div className="text-right">
                    <div>
                      {currency === "Bs"
                        ? `Bs. ${(paidSoFar * (exchangeRate || 0)).toFixed(2)}`
                        : `$${paidSoFar.toFixed(2)}`}
                    </div>
                    <div className="text-slate-500 text-xs font-semibold mt-0.5">
                      {currency === "Bs"
                        ? formatDisplay(totalToUse)
                        : formatDisplay(totalToUse)}
                    </div>
                  </div>
                </div>
                <div className="text-center text-xs text-slate-500 mt-4 uppercase">
                  {paymentsInternal.map((p, i) => (
                    <div key={i}>
                      {p.label}
                      {i < paymentsInternal.length - 1 ? " + " : ""}
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              <div className="flex w-full gap-3 mt-4">
                <button
                  onClick={handleConfirmAndPrint}
                  disabled={isSubmitting}
                  className={` flex-1 py-3.5 rounded-xl font-bold text-base shadow-md transition-all flex items-center justify-center gap-2 ${isSubmitting ? "bg-slate-400 text-slate-200 cursor-not-allowed" : "bg-slate-800 hover:bg-slate-900 text-white"}`}
                >
                  <Printer className="w-5 h-5" />
                  {isSubmitting ? "Procesando..." : "Imprimir"}
                </button>
                <button
                  onClick={handleProcesarVenta}
                  disabled={isSubmitting}
                  className={`flex-1 py-3.5 rounded-xl font-bold text-base shadow-md transition-all flex items-center justify-center gap-2 ${isSubmitting ? "bg-slate-400 text-slate-200 cursor-not-allowed" : "bg-pizza-red hover:opacity-90 text-white"}`}
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
