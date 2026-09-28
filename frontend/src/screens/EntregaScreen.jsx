import { useState, useEffect } from "react";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { useEntregas } from "../hooks/useEntregas";
import { useApp } from "../context/AppContext";
import {
  Bike,
  Store,
  Clock,
  Phone,
  MapPin,
  CheckCircle2,
  ChevronRight,
  Package,
  AlertCircle,
  X,
  FileText,
  Utensils,
  ShoppingBag,
  RefreshCw,
} from "lucide-react";

function getElapsed(iso) {
  if (!iso) return "< 1 min";
  const parsed = new Date(iso).getTime();
  if (isNaN(parsed)) return "< 1 min";
  const mins = Math.floor((Date.now() - parsed) / 60000);
  if (mins < 1) return "< 1 min";
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

const themes = {
  delivery: {
    border: "border-red-200",
    bg: "bg-red-50",
    iconColor: "text-red-600",
    badge: "bg-red-100 text-red-700",
    dot: "bg-red-500",
    Icon: Bike,
    label: "Delivery",
  },
  pickup: {
    border: "border-green-200",
    bg: "bg-green-50",
    iconColor: "text-green-600",
    badge: "bg-green-100 text-green-700",
    dot: "bg-green-500",
    Icon: Store,
    label: "Pick Up",
  },
  local: {
    border: "border-blue-200",
    bg: "bg-blue-50",
    iconColor: "text-blue-600",
    badge: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
    Icon: Utensils,
    label: "Local",
  },
  llevar: {
    border: "border-purple-200",
    bg: "bg-purple-50",
    iconColor: "text-purple-600",
    badge: "bg-purple-100 text-purple-700",
    dot: "bg-purple-500",
    Icon: ShoppingBag,
    label: "Llevar",
  },
};

function OrderCard({ order, onConfirm, onViewDetails }) {
  const theme = themes[order.type] || themes.delivery;
  const isDelivery = order.type === "delivery";

  return (
    <div
      className={`rounded-3xl border border-slate-200/60 overflow-hidden transition-all duration-300 ${theme.bg} shadow-sm hover:shadow-xl hover:shadow-${theme.iconColor.split("-")[1]}-500/10 group relative flex flex-col h-full bg-white`}
    >
      <div
        className={`absolute top-0 left-0 w-full h-1.5 ${theme.dot} opacity-80`}
      />

      <div className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-black text-slate-800 text-lg whitespace-nowrap">
                  #{order.id}
                </span>
              </div>
              <p
                className="text-sm font-bold text-slate-600 truncate max-w-[120px]"
                title={order.customerName}
              >
                {order.customerName}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0 ml-2">
            <p className="text-base font-black text-slate-800 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 whitespace-nowrap">
              ${Number(order.total || 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Info Area */}
        <div className="space-y-2 mb-4 bg-slate-50/80 rounded-2xl p-2.5 border border-slate-100/80 flex-1">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <div className="w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0">
              <Clock className="w-3 h-3 text-slate-400" />
            </div>
            <span className="font-semibold text-slate-700 whitespace-nowrap">
              Hace {getElapsed(order.orderedAt)}
            </span>
          </div>

          {/* Combined Phone & Verification */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-slate-600 truncate min-w-0 flex-1">
              <div className="w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0">
                <Phone className="w-3 h-3 text-slate-400" />
              </div>
              <span className="font-medium truncate">
                {order.phone || "Sin teléfono"}
              </span>
            </div>
          </div>

          {isDelivery && order.address && (
            <div className="flex items-start gap-2 text-xs text-slate-600">
              <div className="w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0">
                <MapPin className="w-3 h-3 text-slate-400" />
              </div>
              <span
                className="leading-snug font-medium line-clamp-2"
                title={order.address}
              >
                {order.address}
              </span>
            </div>
          )}

          {Number(order.boxes || 0) > 0 && (
            <div className="flex items-center gap-2 text-xs font-bold text-amber-700">
              <div className="w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0">
                <Package className="w-3 h-3 text-amber-600" />
              </div>
              <span>
                {order.boxes} {order.boxes === 1 ? "caja" : "cajas"}
              </span>
            </div>
          )}
        </div>

        {/* Items toggle */}
        <div className="mb-4">
          <button
            onClick={() => onViewDetails(order)}
            className="flex items-center justify-center gap-1.5 text-sm font-extrabold text-slate-700 hover:text-white transition-colors w-full bg-slate-100 hover:bg-slate-800 px-3 py-2.5 rounded-xl border border-slate-200"
          >
            <FileText className="w-4 h-4" />
            Detalle ({(order.items || []).length})
          </button>
        </div>

        {/* Actions */}
        <div className="mt-auto">
          {order.status === "ready" ? (
            <button
              onClick={() => onConfirm(order.id)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-slate-900 hover:bg-black text-white text-sm font-extrabold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Marcar Entregado
            </button>
          ) : order.status === "delivered" ? (
            <div className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-50 text-emerald-600 text-sm font-extrabold border border-emerald-200/50">
              <CheckCircle2 className="w-5 h-5" />
              Orden Entregada
            </div>
          ) : (
            <div className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-amber-50 text-amber-600 text-sm font-extrabold border border-amber-200 cursor-not-allowed">
              <Clock className="w-5 h-5 animate-pulse" />
              En Preparación...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DeliveredRow({ order, onViewDetails, deliveryTime }) {
  const theme = themes[order.type] || themes.delivery;
  const isDelivery = order.type === "delivery";

  const formattedTime = (() => {
    try {
      const time = deliveryTime || order.orderedAt;
      if (!time) return "--:--";
      const d = new Date(time);
      if (isNaN(d.getTime())) return "--:--";
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "--:--";
    }
  })();

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-white border border-slate-200/60 rounded-3xl shadow-sm hover:shadow-md transition-shadow gap-4">
      <div className="flex items-start gap-4">
        <div
          className={`w-12 h-12 rounded-2xl ${theme.bg} flex items-center justify-center shrink-0 shadow-inner mt-1`}
        >
          <theme.Icon className={`w-6 h-6 ${theme.iconColor}`} />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-black text-slate-800 text-lg">
              #{order.id}
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${theme.badge} border border-current/10`}
            >
              {theme.label}
            </span>
          </div>
          <p className="text-sm font-black text-slate-700">
            {order.customerName}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium mt-1">
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              {order.phone || "Sin teléfono"}
            </span>
            {isDelivery && order.address && (
              <span
                className="flex items-center gap-1 max-w-md truncate"
                title={order.address}
              >
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {order.address}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between md:justify-end gap-6 sm:gap-10 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
        <div className="text-left md:text-right">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Clock className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-bold text-slate-700">
              Entregado a las {formattedTime}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
            <Package className="w-3.5 h-3.5" />
            {(order.items || []).length} artículo
            {(order.items || []).length !== 1 ? "s" : ""}
          </div>
        </div>

        <div className="text-right flex items-center gap-4">
          <div>
            <p className="text-xl font-black text-slate-800">
              ${Number(order.total || 0).toFixed(2)}
            </p>
            <div className="flex items-center justify-end gap-1 text-emerald-600 text-xs font-bold mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Entregado</span>
            </div>
          </div>

          <button
            onClick={() => onViewDetails(order)}
            className="flex items-center justify-center p-2 text-slate-600 hover:text-white transition-colors bg-slate-100 hover:bg-slate-800 rounded-xl border border-slate-200"
            title="Ver Detalle"
          >
            <FileText className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EntregaScreen() {
  const queryClient = useQueryClient();
  const { currentUser } = useApp();
  // El rol "cashierdelivery" (cajero-delivery) solo ve pedidos de Delivery
  const soloDelivery = currentUser?.role === "cashierdelivery";
  const {
    data: orders = [],
    isLoading: loading,
    isFetching,
    error: queryError,
    refetch: fetchOrders,
  } = useEntregas();
  const [error, setError] = useState(null);
  const [manualRefreshing, setManualRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState("delivery_pickup");
  const [historyFilter, setHistoryFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const [deliveryTimes, setDeliveryTimes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("delivery_times") || "{}");
    } catch {
      return {};
    }
  });
  const itemsPerPage = 10;

  // Whenever selectedGroup changes, reset history filter to "all" to avoid incompatible active state
  useEffect(() => {
    setHistoryFilter("all");
    setCurrentPage(1);
  }, [selectedGroup]);

  const handleConfirm = async (id) => {
    try {
      await axios.put(
        `http://localhost:3001/api/entregas/${id}/completar`,
        {},
        {
          withCredentials: true,
        },
      );

      const now = new Date().toISOString();
      const updatedTimes = { ...deliveryTimes, [id]: now };
      setDeliveryTimes(updatedTimes);
      localStorage.setItem("delivery_times", JSON.stringify(updatedTimes));

      queryClient.setQueryData(["entregas"], (prev = []) =>
        prev.map((o) => (o.id === id ? { ...o, status: "delivered" } : o)),
      );
      queryClient.invalidateQueries({ queryKey: ["entregas"] });
    } catch (err) {
      console.error("Error al confirmar la orden:", err);
      setError(
        "No se pudo marcar el pedido como completado. Intenta nuevamente.",
      );

      setTimeout(() => setError(null), 3000);
    }
  };

  // Grouped active orders (incluye "preparing" y "ready", excluye "delivered")
  const pendingDelivery = orders.filter(
    (o) => o.type === "delivery" && o.status !== "delivered",
  );
  const pendingPickup = orders.filter(
    (o) => o.type === "pickup" && o.status !== "delivered",
  );
  const pendingLocal = orders.filter(
    (o) => o.type === "local" && o.status !== "delivered",
  );
  const pendingLlevar = orders.filter(
    (o) => o.type === "llevar" && o.status !== "delivered",
  );

  const deliveredOrders = orders.filter((o) => o.status === "delivered");

  const filteredDeliveredOrders = deliveredOrders.filter((o) => {
    if (historyFilter !== "all") {
      return o.type === historyFilter;
    }
    // "all" filters by current selected group
    if (selectedGroup === "delivery_pickup") {
      return o.type === "delivery" || o.type === "pickup";
    } else {
      return o.type === "local" || o.type === "llevar";
    }
  });

  const sortedDeliveredOrders = [...filteredDeliveredOrders].sort((a, b) => {
    const timeA =
      new Date(deliveryTimes[a?.id] || a?.orderedAt || 0).getTime() || 0;
    const timeB =
      new Date(deliveryTimes[b?.id] || b?.orderedAt || 0).getTime() || 0;
    return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
  });

  const totalPages = Math.ceil(sortedDeliveredOrders.length / itemsPerPage);
  const paginatedDeliveredOrders = sortedDeliveredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border border-slate-200/60 rounded-2xl px-6 py-5 mx-6 mt-6 shrink-0 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm z-10 relative">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-pizza-red/10 rounded-xl flex items-center justify-center shrink-0">
            <Package className="w-5 h-5 text-pizza-red" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
              Centro de Entregas
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5 capitalize flex items-center gap-1">
              {new Date().toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between lg:justify-end gap-3 w-full lg:w-auto">
          {/* Group toggle buttons */}
          {!soloDelivery && (
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
              <button
                onClick={() => setSelectedGroup("delivery_pickup")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  selectedGroup === "delivery_pickup"
                    ? "bg-slate-950 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Delivery & Pick Up
              </button>
              <button
                onClick={() => setSelectedGroup("local_llevar")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  selectedGroup === "local_llevar"
                    ? "bg-slate-950 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Local & Llevar
              </button>
            </div>
          )}

          <button
            onClick={async () => {
              setManualRefreshing(true);
              await fetchOrders();
              setManualRefreshing(false);
            }}
            className="flex items-center gap-1.5 text-xs font-extrabold text-white bg-slate-900 hover:bg-black border border-slate-800 px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${manualRefreshing ? "animate-spin" : ""}`}
            />
            Actualizar
          </button>
        </div>
      </div>

      {(error || queryError) && (
        <div className="bg-red-50 text-red-600 p-4 mx-8 mt-6 rounded-2xl flex items-center gap-3 text-sm font-bold border border-red-200 shrink-0">
          <AlertCircle className="w-5 h-5" />
          {error || "Error al cargar órdenes de entrega"}
        </div>
      )}

      {/* Main scrolling content area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 flex flex-col gap-4 sm:gap-6 md:gap-8 hide-scrollbar">
        {/* Metrics Overview based on Selected Group */}
        {soloDelivery || selectedGroup === "delivery_pickup" ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
            <div className="bg-white p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl md:rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
              <div>
                <p className="text-slate-400 font-medium text-sm mb-2">
                  Delivery Hoy
                </p>
                <div className="flex items-end gap-2">
                  <h3 className="text-4xl font-black text-slate-800 leading-none">
                    {orders.filter((o) => o.type === "delivery").length}
                  </h3>
                </div>
              </div>
              <div className="w-12 h-12 bg-red-50 group-hover:bg-red-500 group-hover:text-white text-red-500 rounded-2xl flex items-center justify-center transition-colors">
                <Bike className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
              <div>
                <p className="text-slate-400 font-medium text-sm mb-2">
                  Delivery Activos
                </p>
                <div className="flex items-end gap-2">
                  <h3 className="text-4xl font-black text-red-600 leading-none">
                    {pendingDelivery.length}
                  </h3>
                  <span className="text-red-400 font-semibold text-base mb-1">
                    pendientes
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center border border-red-200/50 shadow-inner group-hover:scale-105 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            {!soloDelivery && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
                <div>
                  <p className="text-slate-400 font-medium text-sm mb-2">
                    Pick Up Hoy
                  </p>
                  <div className="flex items-end gap-2">
                    <h3 className="text-4xl font-black text-slate-800 leading-none">
                      {orders.filter((o) => o.type === "pickup").length}
                    </h3>
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-50 group-hover:bg-green-500 group-hover:text-white text-green-500 rounded-2xl flex items-center justify-center transition-colors">
                  <Store className="w-6 h-6" />
                </div>
              </div>
            )}

            {!soloDelivery && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
                <div>
                  <p className="text-slate-400 font-medium text-sm mb-2">
                    Pick Up Activos
                  </p>
                  <div className="flex items-end gap-2">
                    <h3 className="text-4xl font-black text-green-600 leading-none">
                      {pendingPickup.length}
                    </h3>
                    <span className="text-green-400 font-semibold text-base mb-1">
                      pendientes
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center border border-green-200/50 shadow-inner group-hover:scale-105 transition-transform">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
              <div>
                <p className="text-slate-400 font-medium text-sm mb-2">
                  Local Hoy
                </p>
                <div className="flex items-end gap-2">
                  <h3 className="text-4xl font-black text-slate-800 leading-none">
                    {orders.filter((o) => o.type === "local").length}
                  </h3>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-50 group-hover:bg-blue-500 group-hover:text-white text-blue-500 rounded-2xl flex items-center justify-center transition-colors">
                <Utensils className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
              <div>
                <p className="text-slate-400 font-medium text-sm mb-2">
                  Local Activos
                </p>
                <div className="flex items-end gap-2">
                  <h3 className="text-4xl font-black text-blue-600 leading-none">
                    {pendingLocal.length}
                  </h3>
                  <span className="text-blue-400 font-semibold text-base mb-1">
                    pendientes
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-200/50 shadow-inner group-hover:scale-105 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
              <div>
                <p className="text-slate-400 font-medium text-sm mb-2">
                  Llevar Hoy
                </p>
                <div className="flex items-end gap-2">
                  <h3 className="text-4xl font-black text-slate-800 leading-none">
                    {orders.filter((o) => o.type === "llevar").length}
                  </h3>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-50 group-hover:bg-purple-500 group-hover:text-white text-purple-500 rounded-2xl flex items-center justify-center transition-colors">
                <ShoppingBag className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
              <div>
                <p className="text-slate-400 font-medium text-sm mb-2">
                  Llevar Activos
                </p>
                <div className="flex items-end gap-2">
                  <h3 className="text-4xl font-black text-purple-600 leading-none">
                    {pendingLlevar.length}
                  </h3>
                  <span className="text-purple-400 font-semibold text-base mb-1">
                    pendientes
                  </span>
                </div>
              </div>
              <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center border border-purple-200/50 shadow-inner group-hover:scale-105 transition-transform">
                <Clock className="w-7 h-7" />
              </div>
            </div>
          </div>
        )}

        {/* Columns layout for pending orders */}
        {soloDelivery || selectedGroup === "delivery_pickup" ? (
          <div className="flex flex-col xl:flex-row gap-8 shrink-0">
            {/* Delivery Column */}
            <div className="flex-1 flex flex-col bg-white border border-slate-200/60 rounded-xl sm:rounded-2xl md:rounded-[2rem] overflow-hidden shadow-sm h-[450px] sm:h-[550px] md:h-[650px]">
              <div className="bg-white px-6 py-5 border-b border-slate-100 flex justify-between items-center shrink-0">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                    <Bike className="w-5 h-5 text-red-500" />
                  </div>
                  Delivery
                </h2>
                <span className="bg-red-100 text-red-700 text-sm font-semibold px-3.5 py-1.5 rounded-full border border-red-200/50 shadow-sm">
                  {pendingDelivery.length} Pendientes
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-5 bg-slate-50/30 hide-scrollbar">
                {pendingDelivery.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                    <Bike className="w-12 h-12 opacity-20" />
                    <p className="font-bold">
                      No hay órdenes de delivery activas
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-5">
                    {pendingDelivery.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onConfirm={handleConfirm}
                        onViewDetails={setSelectedOrder}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pickup Column */}
            {!soloDelivery && (
              <div className="flex-1 flex flex-col bg-white border border-slate-200/60 rounded-xl sm:rounded-2xl md:rounded-[2rem] overflow-hidden shadow-sm h-[450px] sm:h-[550px] md:h-[650px]">
                <div className="bg-white px-6 py-5 border-b border-slate-100 flex justify-between items-center shrink-0">
                  <h2 className="text-xl font-black text-slate-800 flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                      <Store className="w-5 h-5 text-green-500" />
                    </div>
                    Pick Up
                  </h2>
                  <span className="bg-green-100 text-green-700 text-sm font-semibold px-3.5 py-1.5 rounded-full border border-green-200/50 shadow-sm">
                    {pendingPickup.length} Pendientes
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-5 bg-slate-50/30 hide-scrollbar">
                  {pendingPickup.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                      <Store className="w-12 h-12 opacity-20" />
                      <p className="font-bold">
                        No hay órdenes de pick up activas
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-5">
                      {pendingPickup.map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          onConfirm={handleConfirm}
                          onViewDetails={setSelectedOrder}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col xl:flex-row gap-8 shrink-0">
            {/* Local Column */}
            <div className="flex-1 flex flex-col bg-white border border-slate-200/60 rounded-xl sm:rounded-2xl md:rounded-[2rem] overflow-hidden shadow-sm h-[450px] sm:h-[550px] md:h-[650px]">
              <div className="bg-white px-6 py-5 border-b border-slate-100 flex justify-between items-center shrink-0">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Utensils className="w-5 h-5 text-blue-500" />
                  </div>
                  Local
                </h2>
                <span className="bg-blue-100 text-blue-700 text-sm font-semibold px-3.5 py-1.5 rounded-full border border-blue-200/50 shadow-sm">
                  {pendingLocal.length} Pendientes
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-5 bg-slate-50/30 hide-scrollbar">
                {pendingLocal.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                    <Utensils className="w-12 h-12 opacity-20" />
                    <p className="font-bold">
                      No hay órdenes para Local activas
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-5">
                    {pendingLocal.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onConfirm={handleConfirm}
                        onViewDetails={setSelectedOrder}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Llevar Column */}
            <div className="flex-1 flex flex-col bg-white border border-slate-200/60 rounded-xl sm:rounded-2xl md:rounded-[2rem] overflow-hidden shadow-sm h-[450px] sm:h-[550px] md:h-[650px]">
              <div className="bg-white px-6 py-5 border-b border-slate-100 flex justify-between items-center shrink-0">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-purple-500" />
                  </div>
                  Llevar
                </h2>
                <span className="bg-purple-100 text-purple-700 text-sm font-semibold px-3.5 py-1.5 rounded-full border border-purple-200/50 shadow-sm">
                  {pendingLlevar.length} Pendientes
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-5 bg-slate-50/30 hide-scrollbar">
                {pendingLlevar.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                    <ShoppingBag className="w-12 h-12 opacity-20" />
                    <p className="font-bold">
                      No hay órdenes para Llevar activas
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-5">
                    {pendingLlevar.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onConfirm={handleConfirm}
                        onViewDetails={setSelectedOrder}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* History of delivered orders */}
        <div className="bg-white border border-slate-200/60 rounded-[2rem] overflow-hidden shadow-sm shrink-0">
          <div className="bg-white px-4 py-3 sm:px-5 sm:py-4 md:px-6 md:py-5 border-b border-slate-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                Historial de Entregados (Hoy)
              </h2>
              <span className="bg-emerald-100 text-emerald-700 text-sm font-semibold px-3.5 py-1.5 rounded-full border border-emerald-200/50 shadow-sm shrink-0">
                {filteredDeliveredOrders.length} Entregados
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {/* Filter buttons */}
              <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50">
                <button
                  onClick={() => {
                    setHistoryFilter("all");
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${historyFilter === "all" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                >
                  Todos
                </button>
                {selectedGroup === "delivery_pickup" ? (
                  <>
                    <button
                      onClick={() => {
                        setHistoryFilter("delivery");
                        setCurrentPage(1);
                      }}
                      className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${historyFilter === "delivery" ? "bg-red-600 text-white shadow-sm" : "text-slate-600 hover:text-red-600"}`}
                    >
                      <Bike className="w-3.5 h-3.5" />
                      Delivery
                    </button>
                    {!soloDelivery && (
                      <button
                        onClick={() => {
                          setHistoryFilter("pickup");
                          setCurrentPage(1);
                        }}
                        className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${historyFilter === "pickup" ? "bg-green-600 text-white shadow-sm" : "text-slate-600 hover:text-green-600"}`}
                      >
                        <Store className="w-3.5 h-3.5" />
                        Pick Up
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setHistoryFilter("local");
                        setCurrentPage(1);
                      }}
                      className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${historyFilter === "local" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:text-blue-600"}`}
                    >
                      <Utensils className="w-3.5 h-3.5" />
                      Local
                    </button>
                    <button
                      onClick={() => {
                        setHistoryFilter("llevar");
                        setCurrentPage(1);
                      }}
                      className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${historyFilter === "llevar" ? "bg-purple-600 text-white shadow-sm" : "text-slate-600 hover:text-purple-600"}`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      Llevar
                    </button>
                  </>
                )}
              </div>

              {/* Sort buttons */}
              <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50">
                <button
                  onClick={() => {
                    setSortOrder("desc");
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${sortOrder === "desc" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                >
                  Recientes (Desc)
                </button>
                <button
                  onClick={() => {
                    setSortOrder("asc");
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${sortOrder === "asc" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                >
                  Antiguos (Asc)
                </button>
              </div>
            </div>
          </div>

          <div className="p-5 bg-slate-50/30">
            {filteredDeliveredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-slate-400 space-y-3 py-10">
                <CheckCircle2 className="w-12 h-12 opacity-20" />
                <p className="font-bold">
                  Aún no hay ningún pedido entregado en esta categoría
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3">
                  {paginatedDeliveredOrders.map((order) => (
                    <DeliveredRow
                      key={order.id}
                      order={order}
                      onViewDetails={setSelectedOrder}
                      deliveryTime={deliveryTimes[order.id]}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200/60 mt-2">
                    <span className="text-sm font-semibold text-slate-500">
                      Mostrando {(currentPage - 1) * itemsPerPage + 1} al{" "}
                      {Math.min(
                        currentPage * itemsPerPage,
                        sortedDeliveredOrders.length,
                      )}{" "}
                      de {sortedDeliveredOrders.length}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                      >
                        Anterior
                      </button>
                      <span className="text-sm font-bold text-slate-700 px-2">
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder &&
        (() => {
          const modalTheme = themes[selectedOrder.type] || themes.delivery;
          return (
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
              onClick={() => setSelectedOrder(null)}
            >
              <div
                className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${modalTheme.badge}`}
                    >
                      <modalTheme.Icon
                        className={`w-5 h-5 ${modalTheme.iconColor}`}
                      />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 text-lg leading-tight">
                        Pedido #{selectedOrder.id}
                      </h3>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        {modalTheme.label}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-2 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-xl transition-colors shadow-sm border border-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  <div className="mb-6 space-y-3">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Datos del Cliente
                    </h4>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="font-bold text-slate-800 mb-1">
                        {selectedOrder.customerName}
                      </p>
                      {selectedOrder.phone && (
                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                          <Phone className="w-4 h-4 text-slate-400" />
                          <span>{selectedOrder.phone}</span>
                        </div>
                      )}
                      {selectedOrder.address && (
                        <div className="flex items-start gap-2 text-sm text-slate-600">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <span className="leading-snug">
                            {selectedOrder.address}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                      <Package className="w-4 h-4" /> Productos (
                      {(selectedOrder.items || []).length})
                    </h4>
                    <div className="space-y-2">
                      {(selectedOrder.items || []).map((item, idx) => {
                        const isPizza = item.type === "Pizza";
                        const isDrink = item.type === "Bebida";
                        const isIceCream = item.type === "Helado";

                        let badgeColor =
                          "bg-slate-100 text-slate-600 border-slate-200";
                        let qtyColor = "bg-slate-100 text-slate-600";

                        if (isPizza) {
                          badgeColor =
                            "bg-orange-100 text-orange-600 border-orange-200";
                          qtyColor = "bg-orange-100 text-orange-600";
                        } else if (isDrink) {
                          badgeColor =
                            "bg-blue-100 text-blue-600 border-blue-200";
                          qtyColor = "bg-blue-100 text-blue-600";
                        } else if (isIceCream) {
                          badgeColor =
                            "bg-pink-100 text-pink-600 border-pink-200";
                          qtyColor = "bg-pink-100 text-pink-600";
                        }

                        return (
                          <div
                            key={idx}
                            className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl shadow-sm"
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`w-8 h-8 rounded-lg ${qtyColor} flex items-center justify-center font-black`}
                              >
                                {item.quantity}
                              </span>
                              <span className="text-slate-700 font-bold">
                                {item.name}
                              </span>
                            </div>
                            {item.type && (
                              <span
                                className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-md border ${badgeColor}`}
                              >
                                {item.type}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-sm">
                      Total a pagar
                    </span>
                    <span className="text-2xl font-black text-slate-800">
                      ${Number(selectedOrder.total || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}
