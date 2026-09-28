import React, { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  X,
  User,
  Sparkles,
  MessageSquareText,
  ShoppingBag,
  Home,
  Truck,
  MapPin,
  ChevronRight,
  ArrowLeftRight,
  Package,
  Trash2,
} from "lucide-react";
import { useExchangeRate } from "../../hooks/useExchangeRate";
import { useProducts, useExtras } from "../../hooks/useProducts";
import { useApp } from "../../context/AppContext";

import ProcesarPagoModal from "./ProcesarPagoModal";

// ─── Constantes ───────────────────────────────────────────────────────────────
const TIPO_EMOJI = { Pizza: "🍕", Bebida: "🥤", Helado: "🍦" };

const ESTADO_COLOR = {
  Pendiente: "text-amber-700 bg-amber-50 border-amber-200",
  Preparado: "text-blue-700 bg-blue-50 border-blue-200",
  Horno: "text-orange-700 bg-orange-50 border-orange-200",
  Completado: "text-emerald-700 bg-emerald-50 border-emerald-200",
};

const DESPACHO_NEXT = {
  Local: "Llevar",
  Llevar: "Local",
  Delivery: "Pick Up",
  "Pick Up": "Delivery",
};

const DESPACHO_ICON = {
  Local: Home,
  Llevar: ShoppingBag,
  Delivery: Truck,
  "Pick Up": MapPin,
};

const SIZE_TO_CATEGORY = {
  Normal: 1,
  Familiar: 2,
  Gigante: 3,
};

const DESPACHOS_CON_CAJA = ["Llevar", "Delivery", "Pick Up"];

const resolveDisplayName = (item) => {
  const it = item ?? {};
  return it.nombre_producto || it.name || it.nombre || "Producto";
};

export default function OrderEditModal({ pedido = {}, displayNum, onClose }) {
  const safePedido = pedido ?? {};
  const { exchangeRate } = useExchangeRate();
  const { boxPrice } = useApp();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

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

  // ── Pizzas disponibles (cargadas diferidamente con TanStack Query) ─────────
  const { data: catalog } = useProducts();
  const safeCatalogPizzas = Array.isArray(catalog?.pizzas)
    ? catalog.pizzas
    : [];
  const availablePizzas = safeCatalogPizzas.map((p) => ({
    id: p.id,
    name: p.name,
    price: typeof p.price === "number" ? p.price : parseFloat(p.price) || 0,
  }));

  // ── Combos disponibles (cargados diferidamente con TanStack Query) ─────────
  const safeCatalogCombos = Array.isArray(catalog?.combos)
    ? catalog.combos
    : [];
  const availableCombos = safeCatalogCombos.map((c) => ({
    id: c.id,
    name: c.name,
    price: typeof c.price === "number" ? c.price : parseFloat(c.price) || 0,
  }));

  // ── Extras disponibles ─────────
  const { data: availableExtras } = useExtras();
  const safeAvailableExtras = Array.isArray(availableExtras)
    ? availableExtras
    : [];

  // ── Detalles locales ──────────────────────────────────────────────────────
  const safePedidoDetalles = Array.isArray(safePedido.detalles)
    ? safePedido.detalles
    : [];

  const [localDetalles, setLocalDetalles] = useState(() =>
    safePedidoDetalles.map((d) => {
      const cantidad = parseInt(d.cantidad) || 1;
      const monto_total = parseFloat(d.monto_total) || 0;
      const extras = Array.isArray(d.extras) ? d.extras : [];
      const extrasCost = extras.reduce(
        (s, e) => s + (parseFloat(e.price ?? e.precio) || 0),
        0,
      );
      const precio_unitario =
        parseFloat(d.precio_unitario) || monto_total / cantidad - extrasCost;

      return {
        ...d,
        cantidad,
        monto_total,
        precio_unitario,
        extras: extras.map((e) => ({
          ...e,
          price: parseFloat(e.price ?? e.precio) || 0,
        })),
      };
    }),
  );

  const [observacion, setObservacion] = useState(
    () => safePedidoDetalles.find((d) => d.nota?.trim())?.nota ?? "",
  );

  // ── Estado de Cajas ──────────────────────────────────────────────────────
  const [cantidadCajasAñadir, setCantidadCajasAñadir] = useState(1);

  // Detección inteligente: si el pedido original era para Llevar o Delivery,
  // calcular cajas preexistentes comparando monto_total_usd con la suma de detalles
  const [cajasAgregadas, setCajasAgregadas] = useState(() => {
    const despachoOriginal = safePedido.despacho ?? "Local";
    if (DESPACHOS_CON_CAJA.includes(despachoOriginal)) {
      const baseDetallesTotal = safePedidoDetalles.reduce(
        (s, d) => s + (parseFloat(d.monto_total) || 0),
        0,
      );
      const origTotal = parseFloat(safePedido.monto_total_usd) || 0;
      const safeBoxPrice = boxPrice || 1;
      return Math.max(
        0,
        Math.round((origTotal - baseDetallesTotal) / safeBoxPrice),
      );
    }
    return 0;
  });

  const recalcTotal = (item, unitPrice, extras) => {
    const safeExtras = extras || [];
    const eSum = safeExtras.reduce((s, e) => s + (e.price ?? e.precio ?? 0), 0);
    return (unitPrice + eSum) * item.cantidad;
  };

  const [pizzaSelections, setPizzaSelections] = useState({});

  const handleChangePizzaType = (idDetalle, pizzaId) => {
    const p = availablePizzas.find((x) => String(x.id) === String(pizzaId));
    if (!p) return;

    setPizzaSelections((prev) => ({ ...prev, [idDetalle]: String(p.id) }));
    setLocalDetalles((prev) =>
      prev.map((d) =>
        d.id_detalle !== idDetalle
          ? d
          : {
              ...d,
              id_producto_origen: p.id,
              nombre_producto: p.name,
              precio_unitario: p.price,
              monto_total: recalcTotal(d, p.price, d.extras || []),
            },
      ),
    );
  };

  const [comboSelections, setComboSelections] = useState({});

  const handleChangeComboType = (idDetalle, comboId) => {
    const c = availableCombos.find((x) => String(x.id) === String(comboId));
    if (!c) return;

    setComboSelections((prev) => ({ ...prev, [idDetalle]: String(c.id) }));
    setLocalDetalles((prev) =>
      prev.map((d) =>
        d.id_detalle !== idDetalle
          ? d
          : {
              ...d,
              id_producto_origen: c.id,
              nombre_producto: c.name,
              precio_unitario: c.price,
              monto_total: recalcTotal(d, c.price, d.extras || []),
            },
      ),
    );
  };

  const handleToggleExtra = (idDetalle, extra) => {
    setLocalDetalles((prev) =>
      prev.map((d) => {
        if (d.id_detalle !== idDetalle) return d;
        const key = extra.id_extras ?? extra.id;
        const safeExtras = d.extras || [];
        const has = safeExtras.some((e) => (e.id_extras ?? e.id) === key);
        const upd = has
          ? safeExtras.filter((e) => (e.id_extras ?? e.id) !== key)
          : [...safeExtras, extra];
        return {
          ...d,
          extras: upd,
          monto_total: recalcTotal(d, d.precio_unitario, upd),
        };
      }),
    );
  };

  // ── Despacho ─────────────────────────────────────────────────────────────
  const [localDespacho, setLocalDespacho] = useState(
    safePedido.despacho ?? "Local",
  );

  const DespachoIcon = DESPACHO_ICON[localDespacho] ?? Truck;
  const nextDespacho = DESPACHO_NEXT[localDespacho];

  // ── Totales ───────────────────────────────────────────────────────────────
  const originalTotal = safePedido.monto_total_usd ?? 0;
  const totalDetalles = useMemo(
    () => localDetalles.reduce((s, d) => s + (d.monto_total || 0), 0),
    [localDetalles],
  );

  const totalCajas = DESPACHOS_CON_CAJA.includes(localDespacho)
    ? cajasAgregadas * boxPrice
    : 0;

  const cajaBloqueHabilitado =
    localDespacho === "Llevar" ||
    (DESPACHOS_CON_CAJA.includes(localDespacho) && cajasAgregadas === 0);
  const newTotal = totalDetalles + totalCajas;
  const diff = newTotal - originalTotal;

  const paymentItems = (localDetalles || []).map((item) => ({
    id_detalle: item.id_detalle,
    nombre_producto: item.nombre_producto,
    tipo_producto: item.tipo_producto,
    cantidad: item.cantidad,
    precio_unitario: item.precio_unitario,
    monto_total: item.monto_total,
    extras: (item.extras || []).map((extra) => ({
      id: extra.id_extras ?? extra.id,
      nombre: extra.name || extra.nombre,
      precio: extra.price ?? extra.precio,
    })),
  }));

  // ── NUEVO: Lógica de Guardado e Intercepción de Pago ──────────────────────
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  if (!safePedido || !safePedido.id_venta) {
    return null;
  }

  const handleIntentarGuardar = () => {
    if (diff > 0) {
      // Abre la modal de cobro si hay un excedente
      setShowPaymentModal(true);
    } else {
      // Guarda directamente si es 0 o negativo
      ejecutarGuardadoBD(null);
    }
  };

  const ejecutarGuardadoBD = async (datosPago = null) => {
    setIsSaving(true);
    try {
      // Solo enviar productos válidos (Pizza, Bebida, Helado) para evitar errores 400
      const tiposValidos = new Set(["Pizza", "Bebida", "Helado", "Combo"]);

      const detallesParaBackend = (localDetalles || [])
        .filter((item) => tiposValidos.has(item.tipo_producto))
        .map((item, index) => ({
          id_detalle: item.id_detalle,
          tipo_producto: item.tipo_producto,
          id_producto_origen: item.id_producto_origen,
          cantidad: item.cantidad,
          monto_total: Number((item.monto_total || 0).toFixed(2)),
          nota: index === 0 ? observacion : item.nota || "",
          extras: (item.extras || []).map((extra) =>
            Number(extra.id_extras ?? extra.id ?? 0),
          ),
        }));

      const payload = {
        id_venta: safePedido.id_venta,
        nuevo_despacho: localDespacho,
        tasa_cambio: Number((exchangeRate || 0).toFixed(2)),
        monto_total_usd: Number(newTotal.toFixed(2)),
        monto_total_bs: Number((newTotal * (exchangeRate || 0)).toFixed(2)),
        cantidad_cajas: Number(cajasAgregadas) || 0,
        detalles_actualizados: detallesParaBackend,
        info_pago: datosPago
          ? {
              metodo: mapPaymentMethodToApi(datosPago.metodo),
              monto_usd: datosPago.monto_usd,
              monto_bs:
                datosPago.moneda === "Bs"
                  ? datosPago.monto_local
                  : Number(
                      (datosPago.monto_usd * (exchangeRate || 0)).toFixed(2),
                    ),
              referencia: datosPago.referencia || null,
            }
          : null,
      };

      const response = await fetch("http://localhost:3001/api/editar-venta", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Error actualizando el pedido.");
      }

      queryClient.invalidateQueries({ queryKey: ["pedidosActivos"] });
      onClose();
      window.Toast.fire({
        icon: "success",
        title: "¡Pedido editado exitosamente!",
      });
    } catch (error) {
      console.error("Error al actualizar el pedido:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 bg-slate-900/65 backdrop-blur-sm">
        <div
          className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-5xl max-h-[96vh] flex flex-col overflow-hidden border border-slate-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── HEADER ──────────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 md:px-8 md:py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-pizza-red to-pizza-red-dark flex items-center justify-center shadow-lg shadow-pizza-red/20 text-white shrink-0">
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
              </div>
              <div>
                <h2 className="font-black text-slate-800 text-lg sm:text-xl md:text-2xl leading-tight">
                  Editar Pedido{" "}
                  <span className="text-pizza-red">
                    #
                    {displayNum
                      ? String(displayNum).padStart(3, "0")
                      : safePedido.id_venta}
                  </span>
                </h2>
                <p className="text-sm text-slate-400 font-semibold mt-0.5">
                  {new Date(safePedido.fecha_hora ?? Date.now()).toLocaleString(
                    "es-VE",
                    {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* ── BODY ────────────────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-5 min-h-full">
              {/* ── Columna Izquierda (2/5) ─────────────────────────────────── */}
              <div className="lg:col-span-2 p-4 sm:p-5 md:p-7 flex flex-col gap-3 sm:gap-4 md:gap-5 bg-slate-50/60 lg:border-r border-slate-100">
                {/* Cliente */}
                <section className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <User className="w-4 h-4" /> Datos del Cliente
                  </p>
                  <div className="flex flex-col gap-3">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">
                        Nombre
                      </span>
                      <span className="text-lg font-bold text-slate-800 leading-tight">
                        {safePedido.nombre_cliente || "Anónimo / General"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-50">
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-0.5">
                          Cédula
                        </span>
                        <span className="text-base font-semibold text-slate-700">
                          {safePedido.cedula_cliente
                            ? `V-${safePedido.cedula_cliente}`
                            : "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-0.5">
                          Teléfono
                        </span>
                        <span className="text-base font-semibold text-slate-700">
                          {safePedido.telefono_cliente || "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Despacho */}
                <section className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Truck className="w-4 h-4" /> Método de Despacho
                  </p>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          localDespacho === "Local" ||
                          localDespacho === "Llevar"
                            ? "bg-blue-50 text-blue-600"
                            : "bg-purple-50 text-purple-600"
                        }`}
                      >
                        <DespachoIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase block">
                          Actual
                        </span>
                        <span className="text-xl font-black text-slate-800">
                          {localDespacho}
                        </span>
                      </div>
                    </div>
                    {nextDespacho && (
                      <button
                        onClick={() => setLocalDespacho(nextDespacho)}
                        className="flex items-center gap-1.5 text-sm font-bold bg-pizza-red/10 text-pizza-red hover:bg-pizza-red hover:text-white px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap"
                      >
                        <ArrowLeftRight className="w-4 h-4" />
                        {nextDespacho}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-3 font-medium leading-relaxed">
                    {localDespacho === "Local" || localDespacho === "Llevar"
                      ? "Alterna entre consumo en local y para llevar."
                      : "Alterna entre delivery a domicilio y pick up."}
                  </p>
                </section>

                {/* Observaciones */}
                <section className="bg-amber-50 rounded-2xl p-5 border border-amber-100 shadow-sm flex-1">
                  <label className="text-xs font-black text-amber-800 uppercase tracking-widest flex items-center gap-2 mb-3">
                    <MessageSquareText className="w-4 h-4 text-amber-600" />{" "}
                    Observaciones
                  </label>
                  <textarea
                    value={observacion}
                    onChange={(e) => setObservacion(e.target.value)}
                    rows={4}
                    placeholder="Ej. Sin cebolla, borde crujiente, alergia al gluten..."
                    className="w-full resize-none rounded-xl border border-amber-200 text-sm px-4 py-3 text-slate-700 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all"
                  />
                </section>
              </div>

              {/* ── Columna Derecha (3/5) ────────────────────────────────────── */}
              <div className="lg:col-span-3 p-4 sm:p-5 md:p-7 flex flex-col gap-3 sm:gap-4">
                <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest pb-1 border-b border-slate-100">
                  Productos del Pedido
                </h4>

                <div className="flex flex-col gap-3 sm:gap-4 overflow-y-auto max-h-[calc(96vh-280px)] pr-1">
                  {(localDetalles || []).map((item) => {
                    const safeItem = item ?? {};
                    const isPizza = safeItem.tipo_producto === "Pizza";
                    const isCombo = safeItem.tipo_producto === "Combo";
                    const isEditable =
                      (isPizza || isCombo) &&
                      safeItem.estado_detalle == "Pendiente";

                    // 3. AÑADIDO: Filtramos los extras justo aquí para este item en específico
                    // NOTA: Asegúrate de que el campo "size" viene en tu detalle de la BD.
                    const categoriaId = safeItem.id_categoria_pizza || 1;
                    const extrasFiltrados = safeAvailableExtras.filter(
                      (extra) =>
                        Number(extra?.id_categoria_pizza ?? 0) ===
                          Number(categoriaId) && extra?.estado === "Activo",
                    );

                    return (
                      <div
                        key={item.id_detalle}
                        className={`rounded-2xl border bg-white shadow-sm transition-all ${
                          isEditable
                            ? "border-slate-200 hover:border-pizza-red/30 hover:shadow-md"
                            : "border-slate-100 opacity-75"
                        }`}
                      >
                        {/* Cabecera del item */}
                        <div className="flex items-start gap-4 p-5">
                          <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-3xl shrink-0">
                            {TIPO_EMOJI[safeItem.tipo_producto] ?? "📦"}
                          </div>

                          <div className="flex-1 min-w-0">
                            {isEditable && isPizza ? (
                              <>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                                  Cambiar Especialidad
                                </span>
                                <select
                                  value={
                                    pizzaSelections[item.id_detalle] ??
                                    (availablePizzas.find(
                                      (p) => p.name === item.nombre_producto,
                                    )?.id
                                      ? String(
                                          availablePizzas.find(
                                            (p) =>
                                              p.name === item.nombre_producto,
                                          ).id,
                                        )
                                      : "")
                                  }
                                  onChange={(e) =>
                                    handleChangePizzaType(
                                      item.id_detalle,
                                      e.target.value,
                                    )
                                  }
                                  className="w-full text-base font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pizza-red/20 focus:border-pizza-red cursor-pointer transition-all"
                                >
                                  {!(
                                    pizzaSelections[item.id_detalle] ??
                                    availablePizzas.find(
                                      (p) => p.name === item.nombre_producto,
                                    )
                                  ) && (
                                    <option value="">
                                      {item.nombre_producto ||
                                        "Especialidad actual"}
                                    </option>
                                  )}
                                  {availablePizzas.map((p) => (
                                    <option key={p.id} value={String(p.id)}>
                                      {p.name} — $
                                      {Number(p.price || 0).toFixed(2)}
                                    </option>
                                  ))}
                                </select>
                              </>
                            ) : isEditable && isCombo ? (
                              <>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                                  Cambiar Combo
                                </span>
                                <select
                                  value={
                                    comboSelections[item.id_detalle] ??
                                    (availableCombos.find(
                                      (c) =>
                                        String(c.id) ===
                                        String(item.id_producto_origen),
                                    )?.id
                                      ? String(
                                          availableCombos.find(
                                            (c) =>
                                              String(c.id) ===
                                              String(item.id_producto_origen),
                                          ).id,
                                        )
                                      : "")
                                  }
                                  onChange={(e) =>
                                    handleChangeComboType(
                                      item.id_detalle,
                                      e.target.value,
                                    )
                                  }
                                  className="w-full text-base font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pizza-red/20 focus:border-pizza-red cursor-pointer transition-all"
                                >
                                  {!(
                                    comboSelections[item.id_detalle] ??
                                    availableCombos.find(
                                      (c) =>
                                        String(c.id) ===
                                        String(item.id_producto_origen),
                                    )
                                  ) && (
                                    <option value="">
                                      {resolveDisplayName(item)}
                                    </option>
                                  )}
                                  {availableCombos.map((c) => (
                                    <option key={c.id} value={String(c.id)}>
                                      {c.name} — $
                                      {Number(c.price || 0).toFixed(2)}
                                    </option>
                                  ))}
                                </select>
                              </>
                            ) : (
                              <h5 className="font-bold text-slate-800 text-lg leading-tight truncate">
                                {resolveDisplayName(safeItem)}
                              </h5>
                            )}

                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                              <span
                                className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                                  ESTADO_COLOR[item.estado_detalle] ||
                                  ESTADO_COLOR.Pendiente
                                }`}
                              >
                                {safeItem.estado_detalle}
                              </span>
                              <span className="text-sm text-slate-400 font-semibold">
                                Cant:{" "}
                                <span className="text-slate-700">
                                  {safeItem.cantidad}
                                </span>
                              </span>
                              <span className="text-sm text-slate-400 font-semibold">
                                Unit:{" "}
                                <span className="text-slate-700">
                                  $
                                  {Number(item.precio_unitario || 0).toFixed(2)}
                                </span>
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-2xl font-black text-slate-800 block">
                              $
                              <span translate="no">
                                {Number(safeItem.monto_total || 0).toFixed(2)}
                              </span>
                            </span>
                            {!isEditable && (
                              <span className="text-[10px] text-slate-400 font-bold uppercase mt-1 block">
                                No editable
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Panel de Extras */}
                        {isPizza && (
                          <div
                            className={`px-5 pb-5 flex flex-col gap-3 ${
                              isEditable ? "" : "pointer-events-none"
                            }`}
                          >
                            <div className="border-t border-slate-100 pt-4">
                              <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                                <Sparkles className="w-3.5 h-3.5 text-pizza-red" />{" "}
                                Ingredientes Extras{" "}
                                {item.size ? `(${item.size})` : ""}
                              </p>

                              {isEditable ? (
                                <>
                                  <select
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (!val) return;
                                      const ex = safeAvailableExtras.find(
                                        (x) =>
                                          String(x.id_extras ?? x.id) ===
                                          String(val),
                                      );
                                      if (ex) {
                                        const has = item.extras?.some(
                                          (e) =>
                                            String(e.id_extras ?? e.id) ===
                                            String(val),
                                        );
                                        if (!has)
                                          handleToggleExtra(
                                            item.id_detalle,
                                            ex,
                                          );
                                      }
                                      e.target.value = "";
                                    }}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pizza-red/15 focus:border-pizza-red cursor-pointer transition-all"
                                  >
                                    <option value="">
                                      + Seleccionar ingrediente extra...
                                    </option>

                                    {/* MODIFICACIÓN: Aquí iteramos sobre extrasFiltrados en lugar de availableExtras */}
                                    {extrasFiltrados.length === 0 ? (
                                      <option value="" disabled>
                                        No hay extras para este tamaño.
                                      </option>
                                    ) : (
                                      extrasFiltrados.map((ex) => {
                                        const has = item.extras?.some(
                                          (e) =>
                                            String(e.id_extras ?? e.id) ===
                                            String(ex.id_extras ?? ex.id),
                                        );
                                        return (
                                          <option
                                            key={ex.id_extras ?? ex.id}
                                            value={ex.id_extras ?? ex.id}
                                            disabled={has}
                                          >
                                            {ex.name || ex.nombre} (+$
                                            {Number(
                                              ex.price ?? ex.precio ?? 0,
                                            ).toFixed(2)}
                                            ){has ? " ✓" : ""}
                                          </option>
                                        );
                                      })
                                    )}
                                  </select>

                                  {item.extras?.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                      {item.extras.map((ex) => (
                                        <span
                                          key={ex.id_extras ?? ex.id}
                                          className="inline-flex items-center gap-1.5 text-sm font-bold bg-pizza-red/10 text-pizza-red border border-pizza-red/25 px-3 py-1.5 rounded-full"
                                        >
                                          {ex.name || ex.nombre}
                                          <span className="font-normal text-pizza-red/70 text-xs">
                                            +$
                                            {Number(
                                              ex.price ?? ex.precio ?? 0,
                                            ).toFixed(2)}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleToggleExtra(
                                                item.id_detalle,
                                                ex,
                                              )
                                            }
                                            className="hover:text-red-700 font-black focus:outline-none leading-none ml-0.5 cursor-pointer"
                                          >
                                            ×
                                          </button>
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  {(!item.extras ||
                                    item.extras.length === 0) && (
                                    <p className="text-sm text-slate-400 mt-2 italic">
                                      Sin extras agregados.
                                    </p>
                                  )}
                                </>
                              ) : (
                                <div className="flex flex-wrap gap-2">
                                  {item.extras?.length > 0 ? (
                                    item.extras.map((ex) => (
                                      <span
                                        key={ex.id_extras ?? ex.id}
                                        className="text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-full"
                                      >
                                        {ex.name || ex.nombre}
                                      </span>
                                    ))
                                  ) : (
                                    <p className="text-sm text-slate-400 italic">
                                      Sin extras.
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* ── BLOQUE DE COBRO DE CAJAS ─────────────────────────────── */}
                  <div
                    className={`rounded-2xl border-2 border-dashed p-4 transition-all ${
                      cajaBloqueHabilitado
                        ? "border-slate-300 bg-white"
                        : "border-slate-200 bg-slate-50 opacity-50 pointer-events-none select-none"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      {/* Icono + Texto */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-pizza-red/10 flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5 text-pizza-red" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 text-sm">
                            Agregar caja
                          </span>
                          <span className="text-slate-400 text-xs font-semibold ml-2">
                            ${Number(boxPrice || 0).toFixed(2)}
                          </span>
                          {cajasAgregadas > 0 && (
                            <span className="ml-2 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              {cajasAgregadas} cajas
                              {/* {cajasAgregadas > 1 ? "s" : ""} */}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Control + Botón */}
                      <div className="flex items-center gap-3 ml-auto">
                        {/* Incrementador */}
                        <div className="flex items-center bg-slate-100 rounded-xl overflow-hidden">
                          <button
                            type="button"
                            onClick={() =>
                              setCantidadCajasAñadir((v) => Math.max(1, v - 1))
                            }
                            className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-200 font-black transition-colors cursor-pointer text-lg leading-none"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-sm font-black text-slate-800">
                            {cantidadCajasAñadir}
                          </span>
                          <button
                            type="button"
                            onClick={() => setCantidadCajasAñadir((v) => v + 1)}
                            className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-200 font-black transition-colors cursor-pointer text-lg leading-none"
                          >
                            +
                          </button>
                        </div>

                        {/* Botón Eliminar cajas (solo si hay cajas añadidas) */}
                        {cajasAgregadas > 0 && (
                          <button
                            type="button"
                            onClick={() => setCajasAgregadas(0)}
                            title="Eliminar cajas añadidas"
                            className="w-8 h-8 flex items-center justify-center rounded-xl text-red-400 hover:text-white hover:bg-red-500 border-2 border-red-200 hover:border-red-500 transition-all cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Botón Añadir */}
                        <button
                          type="button"
                          onClick={() => {
                            setCajasAgregadas(
                              (prev) => prev + cantidadCajasAñadir,
                            );
                            setCantidadCajasAñadir(1);
                          }}
                          className="text-sm font-extrabold text-pizza-red hover:text-white hover:bg-pizza-red border-2 border-pizza-red/30 hover:border-pizza-red px-4 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap"
                        >
                          Añadir
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── BALANCE + FOOTER ─────────────────────────────────────────────── */}
          <div className="shrink-0 border-t border-slate-100">
            {/* Balance */}
            <div className="px-4 pt-3 pb-2 sm:px-7 sm:pt-4 sm:pb-3 bg-slate-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
              <div className="flex items-center gap-4 sm:gap-6 md:gap-8">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Monto Original
                  </span>
                  <span className="text-xl font-black text-white">
                    $
                    <span translate="no">
                      {Number(originalTotal || 0).toFixed(2)}
                    </span>
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-600 hidden sm:block" />
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Nuevo Total
                  </span>
                  <span className="text-xl font-black text-white">
                    $
                    <span translate="no">
                      {Number(newTotal || 0).toFixed(2)}
                    </span>
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Resultado
                </span>
                {diff > 0 ? (
                  <span className="inline-block font-black text-red-400 text-lg bg-red-500/15 border border-red-500/30 px-5 py-1.5 rounded-xl">
                    +${Number(diff || 0).toFixed(2)} a cobrar
                  </span>
                ) : diff < 0 ? (
                  <span className="inline-block font-black text-emerald-400 text-lg bg-emerald-500/15 border border-emerald-500/30 px-5 py-1.5 rounded-xl">
                    −${Number(Math.abs(diff) || 0).toFixed(2)} a devolver
                  </span>
                ) : (
                  <span className="inline-block font-black text-slate-400 text-base bg-slate-800 border border-slate-700 px-5 py-1.5 rounded-xl">
                    Sin diferencia
                  </span>
                )}
              </div>
            </div>

            {/* Botones */}
            <div className="px-4 py-3 sm:px-7 sm:py-4 bg-white flex flex-col sm:flex-row gap-2 sm:gap-4">
              <button
                onClick={onClose}
                className="flex-1 py-3.5 rounded-2xl border-2 border-slate-200 text-slate-700 font-extrabold text-base hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              {/* Botón dinámico */}
              <button
                onClick={handleIntentarGuardar}
                disabled={isSaving}
                className={`flex-1 py-3.5 rounded-2xl text-white font-extrabold text-base shadow-lg shadow-pizza-red/20 transition-colors ${isSaving ? "bg-slate-400 cursor-not-allowed" : "bg-pizza-red hover:bg-pizza-red-dark cursor-pointer"}`}
              >
                {isSaving
                  ? "Guardando..."
                  : diff > 0
                    ? `Cobrar Diferencia ($${diff.toFixed(2)})`
                    : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL DE PAGO CONDICIONAL ────────────────────────────────────── */}
      {showPaymentModal && (
        <ProcesarPagoModal
          montoSobreescrito={diff}
          cliente={{
            nombre: safePedido.nombre_cliente,
            cedula: safePedido.cedula_cliente,
            telefono: safePedido.telefono_cliente,
          }}
          pizzaItems={paymentItems}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={(paymentData) => {
            setShowPaymentModal(false);
            ejecutarGuardadoBD(paymentData);
          }}
        />
      )}
    </>
  );
}
