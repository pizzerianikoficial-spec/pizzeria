import { useMemo, useState, useRef } from "react";
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
  EllipsisVertical,
  Undo2,
  Bike,
  MapPin,
  Phone,
  User,
  CheckCircle2,
} from "lucide-react";
import OrderEditModal from "../components/cajero/OrderEditModal";
import ReembolsoModal from "../components/cajero/ReembolsoModal";
import { useVentasHoy } from "../hooks/useVentasHoy";
import { usePedidosActivos } from "../hooks/usePedidosActivos";
import { useApp } from "../context/AppContext";

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
  pDespacho: {
    label: "Listo Despacho",
    bg: "bg-indigo-100",
    text: "text-indigo-800",
    dot: "bg-indigo-500",
  },
  Despacho: {
    label: "En Camino",
    bg: "bg-purple-100",
    text: "text-purple-800",
    dot: "bg-purple-500",
  },
  Completado: {
    label: "Entregado ✓",
    bg: "bg-emerald-100",
    text: "text-emerald-800",
    dot: "bg-emerald-500",
  },
};

const ITEMS_PER_PAGE = 15;

function getElapsed(iso) {
  const mins = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (mins < 1) return "< 1 min";
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

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
        <p className="text-slate-400 font-medium text-xs sm:text-sm mb-1.5">
          {label}
        </p>
        <div className="flex items-end gap-2">
          {loading ? (
            <div className="h-8 w-20 bg-slate-100 rounded-md animate-pulse" />
          ) : (
            <h3 className="text-3xl font-black text-slate-800 leading-none whitespace-nowrap shrink-0">
              {value}
            </h3>
          )}
          {sub && (
            <span className="text-slate-400 font-semibold text-xs sm:text-sm mb-0.5 truncate">
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
        className={`w-12 h-12 sm:w-14 sm:h-14 ${iconBg} rounded-2xl flex items-center justify-center shrink-0 transition-colors`}
      >
        <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${iconColor}`} />
      </div>
    </div>
  );
}

export default function DeliveryColaTrabajoScreen() {
  const { currentUser } = useApp();

  // Consulta exclusiva para Delivery
  const {
    data: metricsData,
    isLoading: ventasLoading,
    refetch: refetchVentasHoy,
  } = useVentasHoy({ despacho: "Delivery" });

  const {
    data: pedidosActivos = [],
    isLoading: pedidosLoading,
    refetch: refetchPedidosActivos,
  } = usePedidosActivos({ despacho: "Delivery" });

  const metricsHoy = metricsData ?? null;
  const [editState, setEditState] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [reembolsoState, setReembolsoState] = useState(null);
  const menuRef = useRef(null);

  // Filtro de pestaña: "mis" (mis pedidos de esta caja delivery) vs "todos" (todos los deliveries de la sucursal)
  const [viewFilter, setViewFilter] = useState("mis");

  const loading = ventasLoading || pedidosLoading || metricsHoy === null;

  // Filtrar estrictamente solo pedidos con despacho === 'Delivery'
  const allDeliveryOrders = useMemo(() => {
    const rawList = Array.isArray(pedidosActivos) ? pedidosActivos : [];
    return rawList.filter(
      (p) => String(p.despacho || "").toLowerCase() === "delivery",
    );
  }, [pedidosActivos]);

  // Filtrar según pestaña activa ("Mis Pedidos" vs "Todos")
  const pedidos = useMemo(() => {
    if (viewFilter === "mis" && currentUser?.id) {
      return allDeliveryOrders.filter(
        (p) => Number(p.id_usuario) === Number(currentUser.id),
      );
    }
    return allDeliveryOrders;
  }, [allDeliveryOrders, viewFilter, currentUser?.id]);

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

  // Numeración cronológica
  const numMap = useMemo(() => {
    const sorted = [...pedidos].sort(
      (a, b) => new Date(a?.fecha_hora ?? 0) - new Date(b?.fecha_hora ?? 0),
    );
    return Object.fromEntries(sorted.map((p, i) => [p?.id_venta ?? i, i + 1]));
  }, [pedidos]);

  // Paginación
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
          <div className="w-11 h-11 bg-red-100 text-pizza-red rounded-xl flex items-center justify-center shrink-0">
            <Bike className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
                Cola de Trabajo Delivery
              </h1>
              <span className="bg-red-50 text-red-700 border border-red-200 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Solo Delivery
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-1 capitalize flex items-center gap-1">
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
            <span className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-800 text-xs font-bold px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              {activos} delivery{activos !== 1 ? "s" : ""} activo
              {activos !== 1 ? "s" : ""}
            </span>
          )}
          <button
            type="button"
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

      {/* KPI Cards de Delivery */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          icon={DollarSign}
          label="Ventas Delivery Hoy"
          value={`$${totalRevenue.toFixed(2)}`}
          sub={`${totalTx} despachos`}
          iconBg="bg-red-40"
          iconColor="text-pizza-red"
          loading={loading}
        />
        <KpiCard
          icon={Pizza}
          label="Pizzas Delivery"
          value={totalPizzas}
          sub="Unidades"
          iconBg="bg-orange-40"
          iconColor="text-orange-500"
          loading={loading}
        />
        <KpiCard
          icon={ShoppingBag}
          label="Deliveries Activos"
          value={activos}
          sub={`${allDeliveryOrders.length} en sucursal`}
          iconBg="bg-blue-40"
          iconColor="text-blue-500"
          loading={loading}
        />
        <KpiCard
          icon={TrendingUp}
          label="Ticket Prom. Delivery"
          value={`$${avgTicket.toFixed(2)}`}
          iconBg="bg-emerald-40"
          iconColor="text-emerald-500"
          loading={loading}
        />
      </div>

      {/* Tabla de Pedidos Delivery con Pestañas */}
      <div className="flex-1 flex flex-col min-h-[520px] bg-white border border-slate-200/60 rounded-xl sm:rounded-2xl md:rounded-[2rem] overflow-hidden shadow-sm">
        {/* Encabezado de la tabla y selector de vista */}
        <div className="bg-white px-4 py-3 sm:px-5 sm:py-4 md:px-6 md:py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <h2 className="text-lg md:text-xl font-black text-slate-800 flex items-center gap-2.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-50 flex items-center justify-center text-pizza-red">
                <Bike className="w-5 h-5" />
              </div>
              Cola de Pedidos Delivery
            </h2>
            <span className="bg-red-100 text-red-700 text-xs sm:text-sm font-black px-3 py-1 rounded-full border border-red-200/50 shadow-sm shrink-0">
              {pedidos.length} Pedidos
            </span>
          </div>

          {/* Selector de pestañas para trabajar por separado */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setViewFilter("mis");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewFilter === "mis"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Mis Pedidos
            </button>
            <button
              type="button"
              onClick={() => {
                setViewFilter("todos");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewFilter === "todos"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Todos los Deliveries ({allDeliveryOrders.length})
            </button>
          </div>
        </div>

        {/* Contenedor de la tabla */}
        <div className="flex-1 overflow-auto bg-slate-50/30 p-3 sm:p-4 md:p-5 w-full">
          <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
            <div className="overflow-x-auto pb-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-xs sm:text-sm font-bold text-slate-500">
                    <th className="py-2.5 px-3 sm:px-4 sm:py-3 md:px-6 md:py-3.5">
                      Pedido
                    </th>
                    <th className="py-2.5 px-3 sm:px-4 sm:py-3 md:px-6 md:py-3.5">
                      Cliente y Dirección
                    </th>
                    {/* <th className="py-2.5 px-3 sm:px-4 sm:py-3 md:px-6 md:py-3.5">
                      Despacho
                    </th> */}
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
                        <Bike className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                        <p className="font-bold text-slate-600 text-base">
                          No hay pedidos delivery activos
                        </p>
                        <p className="text-xs mt-0.5">
                          {viewFilter === "mis"
                            ? "Los pedidos registrados por esta caja aparecerán aquí."
                            : "No hay entregas pendientes registradas en esta sucursal."}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedPedidos.map((pedido) => {
                      const num = numMap[pedido.id_venta] ?? 1;

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
                      else if (estados.includes("pDespacho"))
                        estadoObj = ESTADO_BADGES.pDespacho;
                      else if (estados.includes("Despacho"))
                        estadoObj = ESTADO_BADGES.Despacho;

                      // Extraer posible dirección de notas
                      const primerDetalleConNota = pedido.detalles?.find(
                        (d) => d.nota,
                      );
                      const notaTexto = primerDetalleConNota?.nota || "";

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

                          {/* Col 2: Cliente y Dirección */}
                          <td className="py-3 px-3 sm:px-4 md:px-6 align-top min-w-[160px]">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-slate-800 text-xs sm:text-sm truncate">
                                {pedido.nombre_cliente || "Cliente Delivery"}
                              </span>
                              {pedido.telefono_cliente && (
                                <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                  {pedido.telefono_cliente}
                                </span>
                              )}
                              {notaTexto && (
                                <span
                                  className="text-[11px] text-slate-600 line-clamp-2 flex items-start gap-1 mt-0.5"
                                  title={notaTexto}
                                >
                                  <MapPin className="w-3 h-3 text-pizza-red shrink-0 mt-0.5" />
                                  {notaTexto}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Col 3: Tipo Despacho */}
                          {/* <td className="py-3 px-3 sm:px-4 md:px-6 align-top">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-red-100 text-red-700 border border-red-200">
                              Delivery
                            </span>
                          </td> */}

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
                                    {det.nombre_producto || "Producto"}
                                  </span>
                                  {det.extras && det.extras.length > 0 && (
                                    <span className="text-[10px] text-pizza-red font-bold">
                                      (+{det.extras.length} ext)
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>

                          {/* Col 5: Total */}
                          <td className="py-3 px-3 sm:px-4 md:px-6 align-top text-right whitespace-nowrap">
                            <div className="font-black text-slate-800 text-sm">
                              ${Number(pedido.monto_total_usd || 0).toFixed(2)}
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium">
                              Bs.{" "}
                              {Number(pedido.monto_total_bs || 0).toFixed(2)}
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
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isEditDisabled
                                    ? "text-slate-300 opacity-40 cursor-not-allowed bg-slate-50"
                                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                                }`}
                                title={
                                  isEditDisabled
                                    ? isEnHorno
                                      ? "No se puede editar: el pedido ya está en el horno"
                                      : "No se puede editar: el pedido ya está listo o despachado"
                                    : "Editar pedido"
                                }
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setReembolsoState(pedido)}
                                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="p-3 border-t border-slate-100 bg-white flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>
                  Página {currentPage} de {totalPages}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
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
          pedido={editState.pedido}
          displayNum={editState.displayNum}
          onClose={() => setEditState(null)}
          onSuccess={handleRefresh}
        />
      )}

      {reembolsoState && (
        <ReembolsoModal
          pedido={reembolsoState}
          onClose={() => setReembolsoState(null)}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
}
