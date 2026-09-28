import { useState, useRef, useEffect } from "react";
import axios from "axios"; // <-- Importación de axios agregada
import { useApp } from "../../context/AppContext";
import { useExchangeRate } from "../../hooks/useExchangeRate";
import PaymentEntryModal from "./PaymentEntryModal";
import {
  UtensilsCrossed,
  ShoppingBag,
  Bike,
  Store,
  CheckCircle2,
  CreditCard,
  Clock,
  X,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  Search,
  UserPlus,
  Phone,
  User,
  IdCard,
  Smartphone,
  Banknote,
  Coins,
} from "lucide-react";

// ─── Configuración estática ───────────────────────────────────────────────────
const ORDER_TYPES = [
  {
    id: "local",
    label: "Local",
    sublabel: "Mesa / Salón",
    icon: UtensilsCrossed,
    colorLight: "bg-blue-50 border-blue-200",
    colorSelected: "bg-blue-500 border-blue-500",
    colorIcon: "text-blue-500",
  },
  {
    id: "takeaway",
    label: "Para Llevar",
    sublabel: "Retira en el local",
    icon: ShoppingBag,
    colorLight: "bg-amber-50 border-amber-200",
    colorSelected: "bg-amber-500 border-amber-500",
    colorIcon: "text-amber-500",
  },
  {
    id: "delivery",
    label: "Delivery",
    sublabel: "Envío a domicilio",
    icon: Bike,
    colorLight: "bg-red-50 border-red-200",
    colorSelected: "bg-red-500 border-red-500",
    colorIcon: "text-pizza-red",
  },
  {
    id: "pickup",
    label: "Pickup",
    sublabel: "Cliente pasa a buscar",
    icon: Store,
    colorLight: "bg-emerald-50 border-emerald-200",
    colorSelected: "bg-emerald-500 border-emerald-500",
    colorIcon: "text-emerald-500",
  },
];

const PAYMENT_STATUS_OPTIONS = [
  {
    id: "paid",
    label: "Ya pagaron completo",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-300",
    selectedBg: "bg-emerald-500 border-emerald-500",
  },
  {
    id: "partial",
    label: "Hicieron un abono",
    icon: CreditCard,
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-300",
    selectedBg: "bg-blue-500 border-blue-500",
  },
  {
    id: "pending",
    label: "Pago totalmente pendiente",
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-300",
    selectedBg: "bg-amber-500 border-amber-500",
  },
];

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

// ─── Componente principal ─────────────────────────────────────────────────────
export default function OrderTypeModal({ onConfirm, onClose, pendingProduct }) {
  const {
    setOrderType,
    addCustomer,
    currentOrder,
    clearCart,
    currentUser,
    total,
  } = useApp();
  const { exchangeRate } = useExchangeRate();

  // ── Pasos: 1 = Tipo y Estado Pago, 2 = Cliente ──
  const [step, setStep] = useState(1);

  // Paso 1 - Tipo de pedido y Estado de Pago
  const [selectedType, setSelectedType] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [advanceCurrency, setAdvanceCurrency] = useState("USD");
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [advancePaymentMethod, setAdvancePaymentMethod] = useState(null);
  const [showAdvancePaymentEntry, setShowAdvancePaymentEntry] = useState(false);
  const [isRegisteringPending, setIsRegisteringPending] = useState(false);
  const [isSearchingDelivery, setIsSearchingDelivery] = useState(false);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);

  // Estados para el flujo de Delivery y Pickup (solo registro directo)
  const [deliveryName, setDeliveryName] = useState("");
  const [deliveryDigits, setDeliveryDigits] = useState("");
  const [foundDelivery, setFoundDelivery] = useState(null);
  const [deliveryLookupDone, setDeliveryLookupDone] = useState(false);
  const [showDeliveryAliasPrompt, setShowDeliveryAliasPrompt] = useState(false);
  const [wantsDeliveryAlias, setWantsDeliveryAlias] = useState(null);
  const [deliveryAlias, setDeliveryAlias] = useState("");

  const needsPaymentInfo =
    selectedType === "delivery" || selectedType === "pickup";
  const needsDeliveryDigits = selectedType === "delivery";
  const needsCustomerStep =
    selectedType === "local" ||
    selectedType === "takeaway" ||
    selectedType === "delivery" ||
    selectedType === "pickup";
  const skipsCustomerStep = !needsCustomerStep;
  const advanceRaw = parseFloat(advanceAmount) || 0;
  const advanceUSD =
    advanceCurrency === "Bs" && exchangeRate > 0
      ? advanceRaw / exchangeRate
      : advanceRaw;

  const pendingTotal = pendingProduct?.product
    ? Number(pendingProduct.product.price || 0) *
      (pendingProduct.size === "Mediana"
        ? 1.3
        : pendingProduct.size === "Familiar"
          ? 1.6
          : 1)
    : 0;
  const orderMaxUSD = Number(total) + pendingTotal;
  const maxAbonoUSD = Math.max(0, orderMaxUSD - 0.01);

  // Paso 2 - Cliente
  const [searchQuery, setSearchQuery] = useState("");
  const [foundCustomer, setFoundCustomer] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [showAliasPrompt, setShowAliasPrompt] = useState(false);
  const [wantsAlias, setWantsAlias] = useState(null);
  const [alias, setAlias] = useState("");
  const searchRef = useRef(null);

  // Focus en la búsqueda al ir al paso 2
  useEffect(() => {
    let timeoutId;

    if (step === 2) {
      timeoutId = setTimeout(() => searchRef.current?.focus(), 80);
    }

    return () => clearTimeout(timeoutId);
  }, [step]);

  // Resetear campos dependientes cuando cambia el tipo en Paso 1
  const handleTypeSelect = (typeId) => {
    setSelectedType(typeId);
    setPaymentStatus(null);
    setAdvanceAmount("");
    setAdvancePaymentMethod(null);
    setShowAdvancePaymentEntry(false);
    setDeliveryName("");
    setDeliveryDigits("");
    setFoundDelivery(null);
    setDeliveryLookupDone(false);
    setShowDeliveryAliasPrompt(false);
    setWantsDeliveryAlias(null);
    setDeliveryAlias("");
    setShowAliasPrompt(false);
    setWantsAlias(null);
    setAlias("");
  };

  const handleDeliverySearch = async () => {
    if (isSearchingDelivery) return;
    const digits = deliveryDigits.trim();
    if (digits.length !== 4) return;

    setIsSearchingDelivery(true);
    try {
      const { data } = await axios.get(
        `http://localhost:3001/api/buscar-delivery?q=${digits}`,
      );

      setDeliveryLookupDone(true);
      if (data.success && data.delivery) {
        setFoundDelivery(data.delivery);
        setShowDeliveryAliasPrompt(false);
        setWantsDeliveryAlias(null);
        setDeliveryAlias("");
      } else {
        setFoundDelivery(null);
        setShowDeliveryAliasPrompt(true);
        setWantsDeliveryAlias(null);
        setDeliveryAlias("");
      }
    } catch (error) {
      console.error("Error buscando el delivery:", error);
      setDeliveryLookupDone(false);
    } finally {
      setIsSearchingDelivery(false);
    }
  };

  // ── Buscar Cliente (Refactorizado a Axios) ──
  const handleSearch = async () => {
    if (isSearchingCustomer) return;
    const q = searchQuery.trim();
    if (!q) return;

    setIsSearchingCustomer(true);
    try {
      if (selectedType === "delivery" || selectedType === "pickup") {
        const { data } = await axios.post(
          "http://localhost:3001/api/buscar-o-registrar-cliente-delivery",
          { phoneLastDigits: q },
          { withCredentials: true },
        );

        if (data.success && data.cliente) {
          setFoundCustomer({ ...data.cliente, isDeliveryNew: data.created });
          setNotFound(false);
          setShowAliasPrompt(Boolean(data.created));
          setWantsAlias(null);
          setAlias("");
        }
        return;
      }

      const { data } = await axios.get(
        `http://localhost:3001/api/buscar-clientes?q=${encodeURIComponent(q)}`,
      );

      if (data.success && data.cliente) {
        setFoundCustomer(data.cliente);
        setNotFound(false);
        setNewName("");
        setNewPhone("");
      } else {
        setFoundCustomer(null);
        setNotFound(true);
        setNewName("");
        setNewPhone("");
      }
    } catch (error) {
      console.error("Error en la búsqueda del cliente:", error);
    } finally {
      setIsSearchingCustomer(false);
    }
  };

  const mapOrderTypeToApiValue = (type) =>
    type === "delivery" ? "Delivery" : type === "pickup" ? "Pick Up" : type;

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
      default:
        return method;
    }
  };

  const getProductTypeForApi = (category) => {
    switch (category) {
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

  const getPendingDetails = () => {
    const items = currentOrder.items.length
      ? currentOrder.items
      : pendingProduct
        ? [
            {
              ...pendingProduct.product,
              qty: 1,
              size: pendingProduct.size || null,
              extras: [],
              note: "",
            },
          ]
        : [];

    return items.map((item) => {
      const sizeMultiplier =
        item.size === "Mediana" ? 1.3 : item.size === "Familiar" ? 1.6 : 1;
      const unitPrice = currentOrder.items.length
        ? Number(item.price || 0)
        : Number(item.price || 0) * sizeMultiplier;
      return {
        tipo_producto: getProductTypeForApi(item.category),
        id_producto_origen: getProductOriginId(item),
        cantidad: Number(item.qty || 1),
        monto_total: Number((unitPrice * (item.qty || 1)).toFixed(2)),
        nota: item.note || "",
        extras: (item.extras || []).map((extra) => Number(extra.id)),
      };
    });
  };

  const registerPendingOrder = async (finalCustomer, finalDelivery) => {
    const despacho = mapOrderTypeToApiValue(selectedType);
    const productsTotal = getPendingDetails().reduce(
      (sum, detail) => sum + detail.monto_total,
      0,
    );
    const total = productsTotal;
    const isPartial = paymentStatus === "partial";
    const paymentMethod = mapPaymentMethodToApi(advancePaymentMethod?.id);
    const paymentAmountBs = advanceUSD * (exchangeRate || 0);

    const response = await axios.post(
      "http://localhost:3001/api/registrar-pedido-pendiente",
      {
        id_cliente: finalCustomer?.id ?? finalCustomer?.id_cliente ?? 1,
        id_usuario: currentUser?.id || 1,
        id_delivery:
          selectedType === "delivery"
            ? (finalDelivery?.id ?? finalDelivery?.id_delivery)
            : null,
        despacho,
        tasa_cambio: Number((exchangeRate || 0).toFixed(2)),
        monto_total_usd: isPartial ? Number(total.toFixed(2)) : 0,
        monto_total_bs: isPartial
          ? Number((total * (exchangeRate || 0)).toFixed(2))
          : 0,
        monto_pendiente: Number(
          Math.max(0, total - (isPartial ? advanceUSD : 0)).toFixed(2),
        ),
        pagos:
          isPartial && paymentMethod
            ? [
                {
                  metodo: paymentMethod,
                  monto_usd:
                    paymentMethod === "Efectivo" && advanceCurrency === "Bs"
                      ? 0
                      : Number(advanceUSD.toFixed(2)),
                  monto_bs:
                    paymentMethod === "Efectivo" && advanceCurrency === "USD"
                      ? 0
                      : Number(paymentAmountBs.toFixed(2)),
                  referencia: advanceCurrency,
                },
              ]
            : [],
        detalles: getPendingDetails(),
      },
      { withCredentials: true },
    );

    if (!response.data?.success) {
      throw new Error(
        response.data?.message || "No se pudo registrar el pedido.",
      );
    }
  };

  // ── Confirmar y Guardar ──
  const handleConfirm = async () => {
    if (isRegisteringPending) return;

    const shouldRegisterPending =
      needsPaymentInfo && ["partial", "pending"].includes(paymentStatus);

    setIsRegisteringPending(true);

    // 1. Determinar y registrar el Delivery (siempre se registra para delivery o pickup)
    let finalDelivery = null;

    if (needsDeliveryDigits && deliveryDigits.trim() && !foundDelivery) {
      try {
        const { data: dataDelivery } = await axios.post(
          "http://localhost:3001/api/registrar-delivery",
          {
            name: deliveryAlias.trim() || `Delivery-${deliveryDigits.trim()}`,
            phone: deliveryDigits.trim(),
          },
        );

        if (dataDelivery.success) {
          finalDelivery = dataDelivery.delivery;
        }
      } catch (error) {
        console.error("Error registrando al nuevo delivery:", error);
        setIsRegisteringPending(false);
        return; // Detenemos si falla el registro
      }
    } else {
      finalDelivery = foundDelivery;
    }

    // 2. Lógica para registrar Cliente si es nuevo
    let finalCustomer = selectedCustomer;

    if (selectedCustomer?.isDeliveryNew && alias.trim()) {
      try {
        const { data } = await axios.put(
          `http://localhost:3001/api/clientes/${selectedCustomer.id}/alias`,
          { name: alias.trim() },
        );

        if (data.success && data.cliente) {
          finalCustomer = {
            ...selectedCustomer,
            ...data.cliente,
          };
        }
      } catch (error) {
        console.error("Error guardando el alias del cliente:", error);
        setIsRegisteringPending(false);
        return;
      }
    }

    if (selectedCustomer?.isNew) {
      try {
        const { data } = await axios.post(
          "http://localhost:3001/api/registrar-clientes",
          {
            cedula: selectedCustomer.cedula,
            name: selectedCustomer.name,
            phone: selectedCustomer.phone,
          },
        );

        if (data.success) {
          finalCustomer = data.cliente;
          addCustomer({
            ...data.cliente,
            lastVisit: new Date().toISOString().split("T")[0],
          });
        }
      } catch (error) {
        console.error("Error registrando al nuevo cliente:", error);
        setIsRegisteringPending(false);
        return; // Detenemos si falla el registro
      }
    }

    if (shouldRegisterPending) {
      try {
        await registerPendingOrder(finalCustomer, finalDelivery);
        clearCart();
        onConfirm?.({ pendingRegistered: true });
      } catch (error) {
        console.error("Error registrando el pedido pendiente:", error);
        return;
      } finally {
        setIsRegisteringPending(false);
      }
      return;
    }

    // 3. Setear el tipo de pedido en el estado global
    setOrderType(
      selectedType,
      needsPaymentInfo ? paymentStatus : null,
      paymentStatus === "partial" ? advanceUSD : 0,
      finalCustomer
        ? {
            id: finalCustomer.id, // Verifica que tu JSON de respuesta devuelva "id" y no "id_cliente"
            name: finalCustomer.name,
            cedula: finalCustomer.cedula,
            phone: finalCustomer.phone,
          }
        : null,
      needsPaymentInfo ? deliveryDigits : "",
      finalDelivery
        ? {
            id: finalDelivery.id ?? finalDelivery.id_delivery,
          }
        : null,
      paymentStatus === "partial" ? advancePaymentMethod?.id : null,
      paymentStatus === "partial" ? advanceCurrency : "USD",
    );
    onConfirm?.({ pendingRegistered: false });
  };

  const clearSearch = () => {
    setSearchQuery("");
    setFoundCustomer(null);
    setNotFound(false);
    setNewName("");
    setNewPhone("");
    setFoundDelivery(null);
    setDeliveryLookupDone(false);
    setShowDeliveryAliasPrompt(false);
    setWantsDeliveryAlias(null);
    setDeliveryAlias("");
    setShowAliasPrompt(false);
    setWantsAlias(null);
    setAlias("");
  };

  const selectedCustomer = foundCustomer
    ? foundCustomer
    : notFound && newName
      ? {
          name: newName,
          cedula: searchQuery.trim(),
          phone: newPhone,
          isNew: true,
        }
      : null;

  // ── Validaciones ──
  let step1Valid = false;
  if (selectedType !== null) {
    if (needsPaymentInfo) {
      const isPaymentStatusSelected = paymentStatus !== null;
      const isAbonoValid =
        paymentStatus !== "partial" ||
        (advancePaymentMethod !== null &&
          parseFloat(advanceAmount) > 0 &&
          advanceUSD <= maxAbonoUSD + 0.001);

      const isDeliveryValid =
        !needsDeliveryDigits ||
        (deliveryDigits.trim().length === 4 &&
          deliveryLookupDone &&
          (!showDeliveryAliasPrompt ||
            wantsDeliveryAlias === false ||
            (wantsDeliveryAlias === true && deliveryAlias.trim())));

      step1Valid = isPaymentStatusSelected && isAbonoValid && isDeliveryValid;
    } else {
      step1Valid = true;
    }
  }

  const step2Valid =
    selectedCustomer !== null &&
    (!showAliasPrompt ||
      wantsAlias === false ||
      (wantsAlias === true && alias.trim().length > 0));

  const goNext = () => {
    if (step === 1 && step1Valid) {
      setStep(2);
    }
  };

  const goBack = () => {
    setStep(1);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-full flex items-center justify-center p-4 py-8">
        <div
          className="bg-white w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-4 sm:px-6 sm:py-5 rounded-t-2xl sm:rounded-t-3xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-white font-extrabold text-xl tracking-tight">
                  {step === 1 ? "¿Cómo es este pedido?" : "Datos del cliente"}
                </h2>
                <p className="text-slate-300 text-sm mt-0.5">
                  {step === 1
                    ? "Selecciona tipo de pedido y estado de pago"
                    : "Asocia o registra al cliente"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progreso de Pasos */}
            <div className="flex gap-2">
              {["Tipo de Pedido", "Cliente"].map((label, i) => (
                <div key={i} className="flex items-center gap-1.5 flex-1">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      i + 1 < step
                        ? "bg-emerald-400 text-white"
                        : i + 1 === step
                          ? "bg-white text-slate-800"
                          : "bg-white/20 text-white/60"
                    }`}
                  >
                    {i + 1 < step ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span
                    className={`text-xs font-semibold ${i + 1 === step ? "text-white" : "text-white/50"}`}
                  >
                    {label}
                  </span>
                  {i === 0 && (
                    <div
                      className={`flex-1 h-0.5 rounded-full ${step > 1 ? "bg-emerald-400" : "bg-white/20"}`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Cuerpo */}
          <div className="p-4 sm:p-6 flex flex-col gap-4 sm:gap-5">
            {/* ══ PASO 1: Tipo de pedido y Estado de pago ══ */}
            {step === 1 && (
              <div className="flex flex-col gap-5 animate-fade-in">
                {/* Opciones de tipo de pedido */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {ORDER_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selectedType === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => handleTypeSelect(type.id)}
                        className={`relative flex flex-col items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border-2 transition-all duration-200 active:scale-[0.97] cursor-pointer ${
                          isSelected
                            ? `${type.colorSelected} shadow-lg`
                            : `${type.colorLight} hover:shadow-md`
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute top-2.5 right-2.5">
                            <CheckCircle2 className="w-4 h-4 text-white drop-shadow" />
                          </span>
                        )}
                        <div
                          className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm ${isSelected ? "bg-white/20" : "bg-white"}`}
                        >
                          <Icon
                            className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 ${isSelected ? "text-white" : type.colorIcon}`}
                          />
                        </div>
                        <div className="text-center">
                          <p
                            className={`font-extrabold text-base ${isSelected ? "text-white" : "text-slate-800"}`}
                          >
                            {type.label}
                          </p>
                          <p
                            className={`text-xs mt-0.5 ${isSelected ? "text-white/80" : "text-slate-500"}`}
                          >
                            {type.sublabel}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Datos del Delivery o Pickup (Últimos 4 dígitos) */}
                {needsDeliveryDigits && (
                  <div className="flex flex-col gap-3 p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl animate-fade-in">
                    <div className="flex items-center gap-2 text-slate-700 pb-1 border-b border-slate-200 mb-1">
                      <Phone className="w-4 h-4 text-pizza-red" />
                      <span className="text-sm font-bold">
                        Teléfono del Delivery (últimos 4 dígitos) *
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        pattern="[0-9]*"
                        maxLength={4}
                        placeholder="Últimos 4 dígitos del teléfono *"
                        value={deliveryDigits}
                        onChange={(e) => {
                          setDeliveryDigits(
                            e.target.value.replace(/\D/g, "").slice(0, 4),
                          );
                          setFoundDelivery(null);
                          setDeliveryLookupDone(false);
                          setShowDeliveryAliasPrompt(false);
                          setWantsDeliveryAlias(null);
                          setDeliveryAlias("");
                        }}
                        className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-pizza-red focus:ring-2 focus:ring-pizza-red/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={handleDeliverySearch}
                        disabled={deliveryDigits.trim().length !== 4}
                        className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                          deliveryDigits.trim().length === 4
                            ? "bg-slate-800 text-white hover:bg-slate-900"
                            : "bg-slate-200 text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        Buscar delivery
                      </button>
                    </div>

                    {foundDelivery && (
                      <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-semibold text-emerald-800">
                          {foundDelivery.name} · {foundDelivery.phone}
                        </span>
                      </div>
                    )}

                    {showDeliveryAliasPrompt && !foundDelivery && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex flex-col gap-2">
                        <span className="text-sm font-semibold text-blue-800">
                          Delivery no registrado. ¿Desea agregarle un nombre o
                          alias?
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setWantsDeliveryAlias(true)}
                            className={`flex-1 py-2 rounded-lg border text-sm font-semibold ${
                              wantsDeliveryAlias === true
                                ? "bg-blue-500 border-blue-500 text-white"
                                : "bg-white border-blue-200 text-blue-700"
                            }`}
                          >
                            Sí
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setWantsDeliveryAlias(false);
                              setDeliveryAlias("");
                            }}
                            className={`flex-1 py-2 rounded-lg border text-sm font-semibold ${
                              wantsDeliveryAlias === false
                                ? "bg-slate-700 border-slate-700 text-white"
                                : "bg-white border-slate-200 text-slate-700"
                            }`}
                          >
                            No
                          </button>
                        </div>
                        {wantsDeliveryAlias === true && (
                          <input
                            type="text"
                            placeholder="Nombre o alias del delivery"
                            value={deliveryAlias}
                            onChange={(e) => setDeliveryAlias(e.target.value)}
                            className="w-full px-3 py-2.5 bg-white border border-blue-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            autoFocus
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Estado del pago si es Delivery o Pickup */}
                {needsPaymentInfo && (
                  <div className="border-2 border-slate-200 rounded-2xl overflow-hidden animate-fade-in">
                    <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-pizza-red" />
                      <span className="text-sm font-bold text-slate-700">
                        Estado del pago *
                      </span>
                    </div>

                    <div className="p-4 flex flex-col gap-3">
                      {PAYMENT_STATUS_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        const isSelected = paymentStatus === opt.id;
                        return (
                          <button
                            key={opt.id}
                            onClick={() => {
                              setPaymentStatus(opt.id);
                              if (opt.id !== "partial") {
                                setAdvanceAmount("");
                                setAdvancePaymentMethod(null);
                                setShowAdvancePaymentEntry(false);
                              }
                            }}
                            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                              isSelected
                                ? `${opt.selectedBg} shadow-md`
                                : `${opt.bg} hover:opacity-90`
                            }`}
                          >
                            <Icon
                              className={`w-5 h-5 shrink-0 ${isSelected ? "text-white" : opt.color}`}
                            />
                            <span
                              className={`font-semibold text-sm flex-1 text-left ${isSelected ? "text-white" : "text-slate-700"}`}
                            >
                              {opt.label}
                            </span>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                            )}
                          </button>
                        );
                      })}

                      {/* Método y monto del abono */}
                      {paymentStatus === "partial" && (
                        <div className="mt-1 p-4 bg-blue-50 rounded-xl border border-blue-200 flex flex-col gap-3 animate-fade-in">
                          <label className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                            Método de pago del abono
                          </label>
                          <div className="flex gap-1 self-end bg-white rounded-lg p-0.5 border border-blue-200">
                            {["USD", "Bs"].map((currency) => (
                              <button
                                key={currency}
                                type="button"
                                onClick={() => {
                                  setAdvanceCurrency(currency);
                                  setAdvanceAmount("");
                                }}
                                className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                                  advanceCurrency === currency
                                    ? "bg-blue-500 text-white shadow-sm"
                                    : "text-blue-600 hover:bg-blue-100"
                                }`}
                              >
                                {currency}
                              </button>
                            ))}
                          </div>
                          <div className="flex flex-col gap-2">
                            {PAYMENT_METHODS.map((method) => {
                              const Icon = method.icon;
                              const isSelected =
                                advancePaymentMethod?.id === method.id;
                              return (
                                <button
                                  key={method.id}
                                  type="button"
                                  onClick={() => {
                                    setAdvancePaymentMethod(method);
                                    setShowAdvancePaymentEntry(true);
                                  }}
                                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${method.bg} ${isSelected ? "ring-2 ring-blue-400" : ""}`}
                                >
                                  <Icon className={`w-4 h-4 ${method.color}`} />
                                  <span className="text-sm font-semibold text-slate-700 flex-1 text-left">
                                    {method.label}
                                  </span>
                                  {isSelected && (
                                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                          {advancePaymentMethod && (
                            <p className="text-xs font-semibold text-blue-700">
                              Abono:{" "}
                              {advanceRaw > 0
                                ? `${advanceCurrency === "Bs" ? "Bs." : "$"} ${advanceRaw.toFixed(2)}`
                                : "pendiente de monto"}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══ PASO 2: Cliente ══ */}
            {step === 2 && needsCustomerStep && (
              <div className="flex flex-col gap-4 animate-fade-in">
                {/* Buscador */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <IdCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      ref={searchRef}
                      type="text"
                      placeholder={
                        selectedType === "delivery" || selectedType === "pickup"
                          ? "4 últimos dígitos del teléfono del cliente..."
                          : "Cédula o nombre del cliente..."
                      }
                      inputMode={
                        selectedType === "delivery" || selectedType === "pickup"
                          ? "numeric"
                          : undefined
                      }
                      maxLength={
                        selectedType === "delivery" || selectedType === "pickup"
                          ? 4
                          : undefined
                      }
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(
                          selectedType === "delivery" ||
                            selectedType === "pickup"
                            ? e.target.value.replace(/\D/g, "").slice(0, 4)
                            : e.target.value,
                        );
                        setFoundCustomer(null);
                        setNotFound(false);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="w-full pl-9 pr-3 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pizza-red focus:ring-2 focus:ring-pizza-red/20 transition-all"
                    />
                  </div>
                  <button
                    onClick={handleSearch}
                    className="px-4 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold text-sm flex items-center gap-1.5 transition-colors"
                  >
                    <Search className="w-4 h-4" />
                    Buscar
                  </button>
                </div>

                {/* Cliente Encontrado */}
                {foundCustomer && (
                  <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 flex items-center gap-3 animate-fade-in">
                    <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 truncate">
                        {foundCustomer.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {foundCustomer.cedula} · {foundCustomer.orders} pedidos
                      </p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <button
                      onClick={clearSearch}
                      className="text-slate-400 hover:text-slate-600 ml-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {showAliasPrompt && foundCustomer?.isDeliveryNew && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 flex flex-col gap-3 animate-fade-in">
                    <span className="text-sm font-bold text-blue-700">
                      ¿Desea agregarle un nombre o alias?
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setWantsAlias(true)}
                        className={`flex-1 py-2 rounded-xl border font-semibold text-sm transition-colors ${
                          wantsAlias === true
                            ? "bg-blue-500 border-blue-500 text-white"
                            : "bg-white border-blue-200 text-blue-700 hover:border-blue-400"
                        }`}
                      >
                        Sí
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setWantsAlias(false);
                          setAlias("");
                        }}
                        className={`flex-1 py-2 rounded-xl border font-semibold text-sm transition-colors ${
                          wantsAlias === false
                            ? "bg-slate-700 border-slate-700 text-white"
                            : "bg-white border-slate-200 text-slate-700 hover:border-slate-400"
                        }`}
                      >
                        No
                      </button>
                    </div>
                    {wantsAlias === true && (
                      <input
                        type="text"
                        placeholder="Nombre o alias del cliente"
                        value={alias}
                        onChange={(e) => setAlias(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-blue-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        autoFocus
                      />
                    )}
                  </div>
                )}

                {/* Cliente No Encontrado → Formulario de Registro rápido */}
                {notFound && !foundCustomer && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 flex flex-col gap-3 animate-fade-in">
                    <div className="flex items-center gap-2 text-blue-700">
                      <UserPlus className="w-4 h-4" />
                      <span className="text-sm font-bold">
                        Cliente nuevo — completa los datos
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="relative">
                        <User className="w-4 h-4 text-blue-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Nombre completo *"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-white border border-blue-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          autoFocus
                        />
                      </div>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-blue-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          placeholder="Teléfono (opcional)"
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-white border border-blue-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Opción rápida: seguir sin cliente */}
                {!foundCustomer && !notFound && (
                  <button
                    onClick={() => {
                      setFoundCustomer({
                        id: null,
                        name: "Consumidor Final",
                        cedula: "V-00000000",
                      });
                      setNotFound(false);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-600 underline text-center transition-colors mt-2"
                  >
                    Asociar como Consumidor Final
                  </button>
                )}
              </div>
            )}
          </div>

          {showAdvancePaymentEntry && advancePaymentMethod && (
            <PaymentEntryModal
              method={advancePaymentMethod}
              currency={advanceCurrency}
              exchangeRate={exchangeRate}
              remainingUSD={maxAbonoUSD}
              onAdd={(amountUSD) => {
                const amountInSelectedCurrency =
                  advanceCurrency === "Bs"
                    ? amountUSD * (exchangeRate || 0)
                    : amountUSD;
                setAdvanceAmount(String(amountInSelectedCurrency));
                setShowAdvancePaymentEntry(false);
              }}
              onClose={() => setShowAdvancePaymentEntry(false)}
            />
          )}

          {/* Footer de Navegación */}
          <div className="px-4 pb-4 sm:px-6 sm:pb-6 pt-2 flex gap-2 sm:gap-3">
            {step === 2 && needsCustomerStep && (
              <button
                onClick={goBack}
                className="px-5 py-3.5 rounded-2xl font-bold text-sm flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                Atrás
              </button>
            )}

            {step === 1 && (
              <button
                onClick={onClose}
                className="px-5 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              >
                Cancelar
              </button>
            )}

            <button
              onClick={
                step === 1
                  ? skipsCustomerStep
                    ? handleConfirm
                    : goNext
                  : handleConfirm
              }
              disabled={
                step === 1 ? !step1Valid : !step2Valid || isRegisteringPending
              }
              className={`flex-1 py-3.5 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200 ${
                (step === 1 ? step1Valid : step2Valid)
                  ? "bg-slate-800 hover:bg-slate-900 text-white shadow-md hover:shadow-lg active:scale-[0.98]"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              {isRegisteringPending
                ? "Registrando..."
                : step === 1 && !skipsCustomerStep
                  ? "Siguiente"
                  : "Confirmar y Continuar"}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
