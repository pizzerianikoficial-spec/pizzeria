import { useState, useEffect } from "react";
import { Clock, Package, User, Phone } from "lucide-react";

const BOX_CATEGORY = "cajas";
const isBoxItem = (item) =>
  String(item?.category || "").toLowerCase() === BOX_CATEGORY;

const INFORMATIVE_CATEGORIES = ["drinks"];

const DONE_STATES = ["Completado", "Cerrado"];

const isInformative = (item) =>
  INFORMATIVE_CATEGORIES.includes(String(item?.category || "").toLowerCase());

const isItemDone = (item) => DONE_STATES.includes(item?.status);

const ITEM_BASE_CLASS =
  "flex items-start gap-2 bg-pizza-gray-2 border border-pizza-gray-3 rounded-lg px-3 py-2 3xl:px-4 3xl:py-3";

const itemClass = (item) =>
  isInformative(item)
    ? `${ITEM_BASE_CLASS} border-dashed opacity-80`
    : ITEM_BASE_CLASS;

function useTimer(createdAt) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = Math.floor(
        (Date.now() - new Date(createdAt).getTime()) / 1000,
      );
      const m = Math.floor(diff / 60);
      const s = diff % 60;
      setElapsed(`${m}:${s.toString().padStart(2, "0")}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [createdAt]);

  return elapsed;
}

// Estilos base por status (cuando no se pasa variant)
const STATUS_CONFIG = {
  pending: {
    border: "border-l-status-pending",
    badge:
      "bg-status-pending/20 text-status-pending border border-status-pending/30",
    dot: "bg-status-pending animate-pulse",
    primaryBtn: "bg-status-pending hover:bg-red-600 text-white",
  },
  preparing: {
    border: "border-l-status-preparing",
    badge:
      "bg-status-preparing/20 text-status-preparing border border-status-preparing/30",
    dot: "bg-status-preparing animate-pulse",
    primaryBtn: "bg-status-preparing hover:bg-amber-500 text-white",
  },
  ready: {
    border: "border-l-status-ready",
    badge: "bg-status-ready/20 text-status-ready border border-status-ready/30",
    dot: "bg-status-ready",
    primaryBtn: "bg-status-ready hover:bg-emerald-500 text-white",
  },
  delivered: {
    border: "border-l-emerald-600",
    badge: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    dot: "bg-emerald-600",
    primaryBtn: "bg-emerald-600 hover:bg-emerald-700 text-white",
  },
};

// Estilos temáticos por variante de columna
const VARIANT_CONFIG = {
  yellow: {
    border: "border-l-amber-400",
    badge: "bg-amber-100 text-amber-700 border border-amber-200",
    dot: "bg-amber-400 animate-pulse",
    primaryBtn: "bg-amber-400 hover:bg-amber-500 text-white",
    secondaryBtn:
      "bg-red-500 hover:bg-red-600 text-white border border-red-600 ",
  },
  orange: {
    border: "border-l-orange-400",
    badge: "bg-orange-100 text-orange-700 border border-orange-200",
    dot: "bg-orange-400 animate-pulse",
    primaryBtn: "bg-orange-500 hover:bg-orange-600 text-white",
    secondaryBtn: "",
  },
  green: {
    border: "border-l-emerald-500",
    badge: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    dot: "bg-emerald-500",
    primaryBtn: "bg-emerald-500 hover:bg-emerald-600 text-white",
    secondaryBtn:
      "bg-white border border-orange-400 text-orange-600 hover:bg-orange-50",
  },
};

// Mapeo principal: orderType técnico → etiqueta
const ORDER_TYPE_CONFIG = {
  dine_in: { label: "Local" },
  local: { label: "Local" }, // alias
  takeaway: { label: "Para llevar" },
  delivery_call: { label: "Delivery" },
  delivery_ws: { label: "Delivery" },
  delivery: { label: "Delivery" }, // alias
  pickup: { label: "Pick Up" },
};

// Mapeo de respaldo: order.table → etiqueta (para datos legacy)
const TABLE_TO_LABEL = {
  Mesa: "Local",
  Llevar: "Para llevar",
  Delivery: "Delivery",
  Pickup: "Pick Up",
};

// Helper que busca primero en orderType, luego en table
const getOrderTypeConfig = (order) => {
  // 1. orderType técnico (caso ideal: pedidos nuevos)
  if (order.orderType && ORDER_TYPE_CONFIG[order.orderType]) {
    return ORDER_TYPE_CONFIG[order.orderType];
  }
  // 2. Fallback desde order.table (mock data / datos legacy)
  if (order.table) {
    if (order.table.startsWith("Local")) return ORDER_TYPE_CONFIG.dine_in;
    if (order.table === "Llevar") return ORDER_TYPE_CONFIG.takeaway;
    if (order.table === "Delivery") return ORDER_TYPE_CONFIG.delivery_call;
    if (order.table === "POS" || order.table === "Pick Up") {
      return ORDER_TYPE_CONFIG.pickup;
    }
  }
  return null;
};

const getCustomerInfo = (order) => {
  if (order.customerName) {
    return {
      icon: <User className="w-3 h-3" />,
      label: "",
      value: order.customerName,
      color: "text-slate-700 bg-slate-100 border-slate-200",
    };
  }

  return null;
};

/**
 * OrderCard — componente reutilizable para el flujo de cocina/despacho.
 *
 * Props:
 *  - order          : objeto de pedido
 *  - isFirst        : bool — si false, el botón primario queda deshabilitado (lógica secuencial)
 *  - variant        : 'yellow' | 'orange' | 'green' | null  — tema de color de la columna
 *  - primaryBtnLabel: texto del botón principal
 *  - onPrimary      : handler del botón principal
 *  - secondaryBtnLabel: texto del botón secundario (opcional)
 *  - onSecondary    : handler del botón secundario (opcional)
 */
export function OrderCard({
  order,
  isFirst = true,
  variant = null,
  primaryBtnLabel,
  onPrimary,
  secondaryBtnLabel,
  onSecondary,
  itemsFilter = null,
  compactText = false,
  showBoxes = false,
}) {
  const elapsed = useTimer(order.createdAt);

  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const variantCfg = variant ? VARIANT_CONFIG[variant] : null;

  const borderClass = variantCfg ? variantCfg.border : statusCfg.border;
  const badgeClass = variantCfg ? variantCfg.badge : statusCfg.badge;
  const dotClass = variantCfg ? variantCfg.dot : statusCfg.dot;
  const primaryBtnClass = variantCfg
    ? variantCfg.primaryBtn
    : statusCfg.primaryBtn;
  const secondaryBtnClass = variantCfg ? variantCfg.secondaryBtn : "";

  const visibleItems =
    itemsFilter && Array.isArray(itemsFilter)
      ? order.items.filter(
          (it) =>
            (it.category && itemsFilter.includes(it.category)) ||
            (showBoxes && isBoxItem(it)) ||
            isInformative(it),
        )
      : order.items;

  //  Obtener información del cliente
  const customerInfo = getCustomerInfo(order);

  const isReturnedFromOven = !!order.returnedFromOven;

  return (
    <div
      style={isReturnedFromOven ? { borderLeftColor: "#ED4E09" } : undefined}
      className={`bg-white rounded-xl border border-pizza-gray-3 border-l-4 ${borderClass} p-4 3xl:p-6 flex flex-col gap-3 3xl:gap-5 animate-card-move shadow-card`}
    >
      {/* Header: ID + timer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 3xl:w-3.5 3xl:h-3.5 rounded-full ${dotClass}`}
          />
          <span className="text-pizza-dark font-bold text-sm 3xl:text-base">
            {order.id}
          </span>
          {isReturnedFromOven && (
            <span
              className="text-xs font-bold px-1.5 py-0.5 rounded-md border"
              style={{
                color: "#ED4E09",
                backgroundColor: "#ED4E091A",
                borderColor: "#ED4E0940",
              }}
            >
              ⚠️Pedido Devuelto
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-pizza-muted">
          <Clock className="w-3.5 h-3.5 3xl:w-5 3xl:h-5" />
          <span className="text-xs 3xl:text-sm font-mono font-bold">
            {elapsed}
          </span>
        </div>
      </div>

      {/* Etiqueta de Reasignación */}
      {order.reassigned && (
        <div className="bg-red-50 text-red-700 text-xs font-bold px-2.5 py-1 rounded-md border border-red-200 w-max shadow-sm animate-pulse">
          ⚠️ Pedido Reasignado
        </div>
      )}

      {/* Mesa / tipo de orden */}
      {getOrderTypeConfig(order) && (
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-bold w-max`}
          >
            <span aria-hidden>{getOrderTypeConfig(order).icon}</span>
            <span>{getOrderTypeConfig(order).label}</span>
          </div>
          {/*  NUEVA LÓGICA: Información del cliente según tipo de pedido */}
          {customerInfo && (
            <div
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-semibold w-max ${customerInfo.color}`}
            >
              {customerInfo.icon}
              {customerInfo.label && <span>{customerInfo.label}</span>}
              <span>{customerInfo.value}</span>
            </div>
          )}
          {getOrderTypeConfig(order).label === "Delivery" &&
            order.phoneLastDigits && (
              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-semibold w-max text-blue-700 bg-blue-50 border-blue-200">
                <Phone className="w-3 h-3" />
                <span>
                  Tel:{" "}
                  <span className="font-bold">{order.phoneLastDigits}</span>
                </span>
              </div>
            )}
          {Number(order.boxCount || 0) > 0 && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-bold w-max bg-amber-50 border-amber-200 text-amber-700">
              <Package className="w-3.5 h-3.5" />
              {order.boxCount} {order.boxCount === 1 ? "caja" : "cajas"}
            </div>
          )}
        </div>
      )}

      {/* Items */}
      <div className="flex flex-col gap-1.5 3xl:gap-2.5">
        {visibleItems.length === 0 ? (
          <div className="text-pizza-muted text-xs italic px-2 py-3 text-center border border-dashed border-pizza-gray-3 rounded-lg">
            {itemsFilter
              ? "Sin items de cocina en este pedido"
              : "Pedido sin items"}
          </div>
        ) : (
          visibleItems.map((item, i) => (
            <div
              key={`${item.category || "x"}-${i}`}
              className={itemClass(item)}
            >
              <span
                className={`text-pizza-red flex-shrink-0 w-5 3xl:w-7 ${
                  compactText
                    ? "text-sm 3xl:text-base font-bold"
                    : "text-base 3xl:text-lg font-bold"
                }`}
              >
                {item.qty}x
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-pizza-dark leading-tight flex items-center gap-1.5 ${
                    compactText
                      ? "text-sm 3xl:text-base font-medium"
                      : "text-xl 3xl:text-2xl font-bold"
                  }`}
                >
                  <span>{item.name}</span>
                </p>
                {(item.size || item.description) && (
                  <p
                    className={`text-pizza-muted ${
                      compactText
                        ? "text-xs 3xl:text-sm"
                        : "text-sm 3xl:text-base font-medium"
                    }`}
                  >
                    {item.description || item.size}
                  </p>
                )}
                {item.extras && item.extras.length > 0 && (
                  <p
                    className={`text-sm mt-0.5 font-medium ${
                      compactText
                        ? "text-xs 3xl:text-sm"
                        : "text-sm 3xl:text-base"
                    }`}
                  >
                    +{" "}
                    {item.extras.map((e) => (
                      <span
                        key={e.id}
                        className={`${
                          e.isNew
                            ? "text-yellow-700 bg-yellow-50 px-1 rounded-sm"
                            : "text-pizza-red"
                        } mr-1`}
                      >
                        {e.name}
                      </span>
                    ))}
                  </p>
                )}
                {item.note && (
                  <p
                    className={`text-sm text-slate-600 mt-1 ${
                      compactText
                        ? "text-xs 3xl:text-sm"
                        : "text-sm 3xl:text-base"
                    }`}
                  >
                    Nota: {item.note}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex flex-col gap-2 3xl:gap-3">
        {/* Botón secundario (opcional, ej: "Pendiente" en columna Despacho) */}
        {secondaryBtnLabel && onSecondary && (
          <button
            onClick={onSecondary}
            className={`w-full py-2 3xl:py-3.5 rounded-lg font-bold text-sm 3xl:text-base transition-all duration-200 active:scale-95 ${secondaryBtnClass}`}
          >
            {secondaryBtnLabel}
          </button>
        )}

        {/* Botón primario — deshabilitado si no es el primero en la cola */}
        {primaryBtnLabel && onPrimary && (
          <button
            onClick={onPrimary}
            disabled={!isFirst}
            style={
              isReturnedFromOven ? { backgroundColor: "#ED4E09" } : undefined
            }
            className={`w-full py-2.5 rounded-lg font-bold text-sm transition-all duration-200 active:scale-95 ${
              isReturnedFromOven ? "text-white" : primaryBtnClass
            } ${!isFirst ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            {primaryBtnLabel}
          </button>
        )}
      </div>
    </div>
  );
}
