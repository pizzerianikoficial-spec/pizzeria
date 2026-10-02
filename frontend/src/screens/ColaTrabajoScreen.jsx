import { useMemo, useState } from "react";
import {
  Pizza,
  DollarSign,
  ShoppingBag,
  Clock,
  TrendingUp,
  CalendarDays,
  ArrowUpRight,
  Edit3,
  RefreshCw,
  Package,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Undo2,
  Phone,
} from "lucide-react";
import OrderEditModal from "../components/cajero/OrderEditModal";
import ReembolsoModal from "../components/cajero/ReembolsoModal";
import { useVentasHoy } from "../hooks/useVentasHoy";
import { usePedidosActivos } from "../hooks/usePedidosActivos";

// ─── CONFIGURACIONES DE ESTADO Y DESPACHO ────────────────────────────────────
const DESPACHO_BADGES = {
  Local: {
    label: "Local",
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  Llevar: {
    label: "Llevar",
    bg: "bg-purple-100",
    text: "text-purple-700",
    border: "border-purple-200",
  },
  Delivery: {
    label: "Delivery",
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-200",
  },
  "Pick Up": {
    label: "Pick Up",
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-200",
  },
};

const ESTADO_BADGES = {
  Pendiente: {
    label: "Pendiente",
    bg: "bg-amber-100",
    text: "text-amber-800",
    dot: "bg-amber-500",
  },
  Preparado: {
    label: "En Prep.",
    bg: "bg-blue-100",
    text: "text-blue-800",
    dot: "bg-blue-500",
  },
  Horno: {
    label: "En Horno",
    bg: "bg-orange-100",
    text: "text-orange-800",
    dot: "bg-orange-500",
  },
  Completado: {
    label: "Listo ✓",
    bg: "bg-emerald-100",
    text: "text-emerald-800",
    dot: "bg-emerald-500",
  },
};

const ITEMS_PER_PAGE = 10;

function getElapsed(iso) {
  const mins = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (mins < 1) return "< 1 min";
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

// ─── KPI CARD ─────────────────────────────────────────────────────────────────
function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  iconBg,
  iconColor,
  trend,
  loading,
}) {
  return (
    <div className="bg-white p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl md:rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
      <div className="min-w-0">
        <p className="text-slate-400 font-medium text-sm mb-2">{label}</p>
        <div className="flex items-end gap-2">
          {loading ? (
            <div className="h-9 w-24 bg-slate-100 rounded-md animate-pulse" />
          ) : (
            <h3 className="text-3xl font-black text-slate-800 leading-none whitespace-nowrap shrink-0">
              {value}
            </h3>
          )}
          {sub && (
            <span className="text-slate-400 font-semibold text-base mb-1 truncate">
              {sub}
            </span>
          )}
        </div>
        {trend && (
          <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
            <ArrowUpRight className="w-3 h-3" />
            {trend}
          </span>
        )}
      </div>
      <div
        className={`w-14 h-14 ${iconBg} rounded-2xl flex items-center justify-center shrink-0 transition-colors`}
      >
        <Icon className={`w-7 h-7 ${iconColor}`} />
      </div>
    </div>
  );
}

// ─── PANTALLA PRINCIPAL ───────────────────────────────────────────────────────
export default function ColaTrabajoScreen() {
  const {
    data: metricsData,
    isLoading: ventasLoading,
    refetch: refetchVentasHoy,
  } = useVentasHoy();
  const {
    data: pedidosActivos = [],
    isLoading: pedidosLoading,
    refetch: refetchPedidosActivos,
  } = usePedidosActivos();

  const metricsHoy = metricsData ?? null;
  const [editState, setEditState] = useState(null); // { pedido, displayNum }
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [reembolsoState, setReembolsoState] = useState(null);

  const loading = ventasLoading || pedidosLoading || metricsHoy === null;
  const pedidos = Array.isArray(pedidosActivos) ? pedidosActivos : [];

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchVentasHoy(), refetchPedidosActivos()]);
    setTimeout(() => setRefreshing(false), 500);
  };

  const totalRevenue = metricsHoy?.totalRevenue ?? 0;
  const totalPizzas = metricsHoy?.totalPizzas ?? 0;
  const avgTicket = metricsHoy?.avgTicket ?? 0;
  const totalTx = metricsHoy?.totalTransactions ?? 0;
  const activos = pedidos.length;

  // Mapa de número cronológico del día (#1, #2, ...)
  const numMap = useMemo(() => {
    const sorted = [...pedidos].sort(
      (a, b) => new Date(a?.fecha_hora ?? 0) - new Date(b?.fecha_hora ?? 0),
    );
    return Object.fromEntries(sorted.map((p, i) => [p?.id_venta ?? i, i + 1]));
  }, [pedidos]);

  // Paginación (15 elementos por página)
  const totalPages = Math.max(1, Math.ceil(pedidos.length / ITEMS_PER_PAGE));
  const paginatedPedidos = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return pedidos.slice(start, start + ITEMS_PER_PAGE);
  }, [pedidos, currentPage]);

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-50 p-3 sm:p-4 md:p-6 flex flex-col gap-4 md:gap-6">
      {/* Header Superior */}
      <div className="bg-white border border-slate-200/60 rounded-xl sm:rounded-2xl px-4 py-3 sm:px-5 sm:py-4 md:px-6 md:py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-pizza-red/10 rounded-xl flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5 text-pizza-red" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
              Cola de Trabajo
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5 capitalize flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
              {new Date().toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activos > 0 && (
            <span className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              {activos} pedido{activos !== 1 ? "s" : ""} activo
              {activos !== 1 ? "s" : ""}
            </span>
          )}
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 text-xs font-extrabold text-white bg-slate-900 hover:bg-black border border-slate-800 px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            Actualizar
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          icon={DollarSign}
          label="Ingresos del Día"
          value={`$${totalRevenue.toFixed(2)}`}
          iconBg="bg-red-40"
          iconColor="text-pizza-red"
          loading={loading}
        />
        <KpiCard
          icon={Pizza}
          label="Pizzas Vendidas"
          value={totalPizzas}
          sub="Unidades"
          iconBg="bg-orange-40"
          iconColor="text-orange-500"
          loading={loading}
        />
        <KpiCard
          icon={ShoppingBag}
          label="Pedidos Activos"
          value={activos}
          iconBg="bg-blue-40"
          iconColor="text-blue-500"
          loading={loading}
        />
        <KpiCard
          icon={TrendingUp}
          label="Total Ventas"
          value={`${totalTx}`}
          iconBg="bg-emerald-40"
          iconColor="text-emerald-500"
          loading={loading}
        />
      </div>

      {/* Tabla Limpia de Pedidos */}
      <div className="flex-1 flex flex-col min-h-[520px] bg-white border border-slate-200/60 rounded-xl sm:rounded-2xl md:rounded-[2rem] overflow-hidden shadow-sm">
        <div className="bg-white px-4 py-3 sm:px-5 sm:py-4 md:px-6 md:py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <h2 className="text-lg md:text-xl font-black text-slate-800 flex items-center gap-2.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
              </div>
              Historial y Cola de Pedidos
            </h2>
            <span className="bg-emerald-100 text-emerald-700 text-xs sm:text-sm font-black px-3 py-1.5 rounded-full border border-emerald-200/50 shadow-sm shrink-0">
              {pedidos.length} Pedidos
            </span>
          </div>
          <p className="text-xs font-medium text-slate-500 sm:text-right">
            Pedidos registrados hoy
          </p>
        </div>

        {/* Contenedor de la tabla */}
        <div className="flex-1 overflow-auto bg-slate-50/30 p-3 sm:p-4 md:p-5 w-full">
          <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
            {/* Tabla Desktop */}
            <div className="hidden lg:block overflow-x-auto pb-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-xs sm:text-sm font-bold text-slate-500">
                    <th className="py-2.5 px-3 sm:px-4 sm:py-3 md:px-6 md:py-3.5">
                      Pedido
                    </th>
                    <th className="py-2.5 px-3 sm:px-4 sm:py-3 md:px-6 md:py-3.5">
                      Cliente
                    </th>
                    <th className="py-2.5 px-3 sm:px-4 sm:py-3 md:px-6 md:py-3.5">
                      Tipo Despacho
                    </th>
                    <th className="py-2.5 px-3 sm:px-4 sm:py-3 md:px-6 md:py-3.5">
                      Productos / Detalle
                    </th>
                    <th className="py-2.5 px-3 sm:px-4 sm:py-3 md:px-6 md:py-3.5 text-right">
                      Total
                    </th>
                    <th className="py-2.5 px-3 sm:px-4 sm:py-3 md:px-6 md:py-3.5 text-center">
                      Estado
                    </th>
                    <th className="py-2.5 px-3 sm:px-4 sm:py-3 md:px-6 md:py-3.5 text-center">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {pedidos.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-20 text-center text-slate-400"
                      >
                        <Package className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                        <p className="font-bold text-slate-600 text-base">
                          No hay pedidos activos
                        </p>
                        <p className="text-xs mt-0.5">
                          Los nuevos pedidos registrados aparecerán aquí
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedPedidos.map((pedido) => {
                      const num = numMap[pedido.id_venta] ?? 1;
                      const despacho =
                        DESPACHO_BADGES[pedido.despacho] ||
                        DESPACHO_BADGES.Local;

                      // Determinar estado más relevante (excluyendo bebidas/helados que nacen completados)
                      const cocinaDetalles = (pedido.detalles || []).filter(
                        (d) =>
                          d.tipo_producto !== "Bebida" &&
                          d.tipo_producto !== "Helado",
                      );
                      const detallesParaEstado =
                        cocinaDetalles.length > 0
                          ? cocinaDetalles
                          : pedido.detalles || [];
                      const estados =
                        detallesParaEstado.map((d) => d.estado_detalle) || [];

                      let estadoObj = ESTADO_BADGES.Completado;
                      if (estados.includes("Pendiente"))
                        estadoObj = ESTADO_BADGES.Pendiente;
                      else if (estados.includes("Preparado"))
                        estadoObj = ESTADO_BADGES.Preparado;
                      else if (estados.includes("Horno"))
                        estadoObj = ESTADO_BADGES.Horno;

                      const obs = pedido.detalles?.find(
                        (d) => d.nota && d.nota.trim(),
                      )?.nota;

                      const isPendiente =
                        estadoObj === ESTADO_BADGES.Pendiente &&
                        !estados.includes("Horno");

                      const isEnHorno =
                        !isPendiente &&
                        (estadoObj === ESTADO_BADGES.Horno ||
                          estados.includes("Horno"));

                      const isEditDisabled = !isPendiente;

                      return (
                        <tr
                          key={pedido.id_venta}
                          className="hover:bg-slate-50/60 transition-colors group"
                        >
                          {/* Col 1: Pedido */}
                          <td className="py-3 px-3 sm:px-4 sm:py-3.5 md:px-6 md:py-3.5">
                            <div className="flex flex-col">
                              <span className="font-black text-slate-800 text-sm">
                                #{num}
                              </span>
                              <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mt-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {getElapsed(pedido.fecha_hora)}
                              </span>
                            </div>
                          </td>

                          {/* Col 2: Cliente */}
                          <td className="py-3 px-3 sm:px-4 md:px-6 align-top min-w-[140px]">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-slate-800 text-xs sm:text-sm truncate">
                                {pedido.nombre_cliente || "Sin cliente"}
                              </span>
                              {Boolean(pedido.cedula_cliente && String(pedido.cedula_cliente) !== "0") && (
                                <span className="text-[11px] text-slate-500 font-medium">
                                  V-{pedido.cedula_cliente}
                                </span>
                              )}
                              {Boolean(pedido.telefono_cliente && String(pedido.telefono_cliente) !== "0") && (
                                <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                  {pedido.telefono_cliente}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Col 3: Tipo Despacho */}
                          <td className="py-3 px-3 sm:px-4 md:px-6 align-top whitespace-nowrap">
                            <span
                              className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-md border ${despacho.bg} ${despacho.text} ${despacho.border}`}
                            >
                              {despacho.label}
                            </span>
                          </td>

                          {/* Col 4: Productos */}
                          <td className="py-3 px-3 sm:px-4 md:px-6 align-top min-w-[200px]">
                            <div className="flex flex-col gap-1">
                              {(pedido.detalles || []).map((det, idx) => (
                                <div
                                  key={idx}
                                  className="text-xs text-slate-700 flex items-start gap-1"
                                >
                                  <span className="font-black text-slate-900 shrink-0">
                                    {det.cantidad}×
                                  </span>
                                  <span className="font-semibold truncate">
                                    {det.nombre_producto || det.tipo_producto || "Producto"}
                                  </span>
                                  {det.extras && det.extras.length > 0 && (
                                    <span className="text-[10px] text-pizza-red font-bold">
                                      (+{det.extras.length} ext)
                                    </span>
                                  )}
                                </div>
                              ))}
                              {obs && (
                                <p className="text-[11px] text-amber-700 font-medium flex items-center gap-1 mt-0.5">
                                  <MessageSquare className="w-3 h-3 shrink-0" />
                                  <span className="truncate">"{obs}"</span>
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Col 5: Total */}
                          <td className="py-3 px-3 sm:px-4 md:px-6 align-top text-right whitespace-nowrap">
                            <div className="font-black text-slate-800 text-sm">
                              ${Number(pedido.monto_total_usd || 0).toFixed(2)}
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium">
                              Bs. {Number(pedido.monto_total_bs || 0).toFixed(2)}
                            </div>
                          </td>

                          {/* Col 6: Estado */}
                          <td className="py-3 px-3 sm:px-4 md:px-6 align-top text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${estadoObj.bg} ${estadoObj.text}`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${estadoObj.dot}`}
                              />
                              {estadoObj.label}
                            </span>
                          </td>

                          {/* Col 7: Acciones */}
                          <td className="py-3 px-3 sm:px-4 md:px-6 align-top text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                disabled={isEditDisabled}
                                onClick={() => {
                                  if (isEditDisabled) return;
                                  setEditState({ pedido, displayNum: num });
                                }}
                                className={`p-1.5 rounded-lg transition-colors ${isEditDisabled
                                  ? "text-slate-300 opacity-40 cursor-not-allowed bg-slate-50"
                                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                                  }`}
                                title={
                                  isEditDisabled
                                    ? isEnHorno
                                      ? "No se puede editar: el pedido ya está en el horno"
                                      : "No se puede editar: el pedido ya está listo"
                                    : "Editar pedido"
                                }
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setReembolsoState(pedido)}
                                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Reembolso"
                              >
                                <Undo2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Vista Móvil: Cards */}
            <div className="lg:hidden flex flex-col gap-3 p-3 sm:p-4">
              {pedidos.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <Package className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p className="font-bold text-slate-600 text-base">
                    No hay pedidos activos
                  </p>
                  <p className="text-xs mt-0.5">
                    Los nuevos pedidos registrados aparecerán aquí
                  </p>
                </div>
              ) : (
                paginatedPedidos.map((pedido) => {
                  const num = numMap[pedido.id_venta] ?? 1;
                  const despacho =
                    DESPACHO_BADGES[pedido.despacho] ||
                    DESPACHO_BADGES.Local;

                  const cocinaDetalles = (pedido.detalles || []).filter(
                    (d) =>
                      d.tipo_producto !== "Bebida" &&
                      d.tipo_producto !== "Helado",
                  );
                  const detallesParaEstado =
                    cocinaDetalles.length > 0
                      ? cocinaDetalles
                      : pedido.detalles || [];
                  const estados =
                    detallesParaEstado.map((d) => d.estado_detalle) || [];

                  let estadoObj = ESTADO_BADGES.Completado;
                  if (estados.includes("Pendiente"))
                    estadoObj = ESTADO_BADGES.Pendiente;
                  else if (estados.includes("Preparado"))
                    estadoObj = ESTADO_BADGES.Preparado;
                  else if (estados.includes("Horno"))
                    estadoObj = ESTADO_BADGES.Horno;

                  const obs = pedido.detalles?.find(
                    (d) => d.nota && d.nota.trim(),
                  )?.nota;

                  const isPendiente =
                    estadoObj === ESTADO_BADGES.Pendiente &&
                    !estados.includes("Horno");

                  const isEnHorno =
                    !isPendiente &&
                    (estadoObj === ESTADO_BADGES.Horno ||
                      estados.includes("Horno"));

                  const isEditDisabled = !isPendiente;

                  return (
                    <div
                      key={pedido.id_venta}
                      className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col gap-3 hover:border-slate-300 transition-all"
                    >
                      {/* Top Header Card: # Pedido, Tiempo, Despacho y Estado */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-base bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-100">
                            #{num}
                          </span>
                          <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {getElapsed(pedido.fecha_hora)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          <span
                            className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-md border ${despacho.bg} ${despacho.text} ${despacho.border}`}
                          >
                            {despacho.label}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${estadoObj.bg} ${estadoObj.text}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${estadoObj.dot}`}
                            />
                            {estadoObj.label}
                          </span>
                        </div>
                      </div>

                      {/* Info Cliente & Total */}
                      <div className="flex items-start justify-between gap-2 pt-1 border-t border-slate-100/80">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-800 text-sm truncate">
                            {pedido.nombre_cliente || "Sin cliente"}
                          </p>
                          {Boolean(pedido.cedula_cliente && String(pedido.cedula_cliente) !== "0") && (
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              V-{pedido.cedula_cliente}
                            </p>
                          )}
                          {Boolean(pedido.telefono_cliente && String(pedido.telefono_cliente) !== "0") && (
                            <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              {pedido.telefono_cliente}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs text-slate-400 block font-medium">Total</span>
                          <span className="font-black text-slate-900 text-base">
                            ${Number(pedido.monto_total_usd || 0).toFixed(2)}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium block">
                            Bs. {Number(pedido.monto_total_bs || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Detalle Productos */}
                      <div className="space-y-1.5 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                        <div className="flex flex-wrap gap-1.5">
                          {(pedido.detalles || []).map((det, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-white text-slate-800 px-2 py-0.5 rounded-md font-medium border border-slate-200/80 shadow-2xs"
                            >
                              <span className="font-bold text-slate-900">
                                {det.cantidad}×
                              </span>{" "}
                              {det.nombre_producto || det.tipo_producto || "Producto"}
                              {det.extras && det.extras.length > 0 && (
                                <span className="text-[10px] text-pizza-red font-bold ml-1">
                                  (+{det.extras.length} ext)
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                        {obs && (
                          <p className="text-xs text-amber-700 font-medium flex items-center gap-1 pt-1 border-t border-slate-200/60 mt-1">
                            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">"{obs}"</span>
                          </p>
                        )}
                      </div>

                      {/* Botones de Acción */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          disabled={isEditDisabled}
                          onClick={() => {
                            if (isEditDisabled) return;
                            setEditState({ pedido, displayNum: num });
                          }}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl transition-all ${isEditDisabled
                            ? "text-slate-300 bg-slate-50 cursor-not-allowed border border-slate-100"
                            : "text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 active:scale-[0.98]"
                            }`}
                          title={
                            isEditDisabled
                              ? isEnHorno
                                ? "No se puede editar: el pedido ya está en el horno"
                                : "No se puede editar: el pedido ya está listo"
                              : "Editar pedido"
                          }
                        >
                          <Edit3 className={`w-3.5 h-3.5 ${isEditDisabled ? "text-slate-300" : "text-slate-500"}`} />
                          <span>
                            {isEditDisabled
                              ? isEnHorno
                                ? "En Horno"
                                : "Listo"
                              : "Editar"}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setReembolsoState(pedido)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 transition-all active:scale-[0.98]"
                          title="Reembolso"
                        >
                          <Undo2 className="w-3.5 h-3.5 text-red-500" />
                          <span>Reembolso</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Paginación de 10 por página al pie de la tabla */}
            {pedidos.length > 0 && (
              <div className="px-4 py-3 sm:px-6 sm:py-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 text-xs text-slate-600 shrink-0">
                <span>
                  Mostrando{" "}
                  <span className="font-bold text-slate-800">
                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                  </span>{" "}
                  -{" "}
                  <span className="font-bold text-slate-800">
                    {Math.min(currentPage * ITEMS_PER_PAGE, pedidos.length)}
                  </span>{" "}
                  de{" "}
                  <span className="font-bold text-slate-800">{pedidos.length}</span>{" "}
                  pedidos
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shadow-sm"
                  >
                    <ChevronLeft className="w-4 h-4" /> Anterior
                  </button>
                  <span className="font-bold text-slate-800 px-2">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shadow-sm"
                  >
                    Siguiente <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modales Compartidos */}
      {editState && (
        <OrderEditModal
          key={editState.pedido?.id_venta}
          pedido={editState.pedido}
          displayNum={editState.displayNum}
          onClose={() => {
            setEditState(null);
            handleRefresh();
          }}
        />
      )}

      {/* Modal de Reembolso */}
      {reembolsoState && (
        <ReembolsoModal
          pedido={reembolsoState}
          displayNum={numMap[reembolsoState?.id_venta]}
          onClose={() => {
            setReembolsoState(null);
            handleRefresh();
          }}
        />
      )}
    </div>
  );
}
