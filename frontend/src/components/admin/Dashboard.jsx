import { useState, useEffect, useCallback } from "react";
import { useApp } from "../../context/AppContext";
import { API_BASE } from "../../config/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Users,
  RefreshCw,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  LayoutDashboard,
  Calendar,
} from "lucide-react";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white rounded-2xl px-4 py-3 shadow-2xl border border-slate-800">
        <p className="text-slate-400 text-xs mb-1 font-semibold">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="font-bold text-sm text-pizza-red">
            Ingresos: $
            {typeof p.value === "number"
              ? p.value.toLocaleString("es-VE", { minimumFractionDigits: 2 })
              : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { currentUser } = useApp();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    kpis: {
      totalRevenue: 0,
      growthRevenue: 0,
      totalOrders: 0,
      growthOrders: 0,
      totalClients: 0,
      growthClients: 0,
      netProfit: 0,
      growthProfit: 0,
      ticketPromedio: 0,
      picoMaximo: 0,
    },
    categorias: [],
    tendencia: [],
    statusQuick: {
      pendientes: 0,
      en_cocina: 0,
      completadas: 0,
    },
  });

  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/dashboard/stats?periodo=semana`);
      if (!res.ok) {
        throw new Error(
          `Error ${res.status} al obtener las estadísticas del dashboard`,
        );
      }
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const { kpis, categorias, tendencia, statusQuick } = data;

  const displayTendencia =
    tendencia.length > 0
      ? tendencia
      : [
          { label: "Lun", ingresos_usd: 1200 },
          { label: "Mar", ingresos_usd: 1900 },
          { label: "Mié", ingresos_usd: 1400 },
          { label: "Jue", ingresos_usd: 2100 },
          { label: "Vie", ingresos_usd: 2800 },
          { label: "Sáb", ingresos_usd: 3400 },
          { label: "Dom", ingresos_usd: 2900 },
        ];

  const defaultCategorias = [
    { nombre: "Pizzas", porcentaje: 45, color: "#EA2A33" },
    { nombre: "Bebidas", porcentaje: 25, color: "#3B82F6" },
    { nombre: "Helados", porcentaje: 15, color: "#F59E0B" },
    { nombre: "Extras", porcentaje: 10, color: "#10B981" },
    { nombre: "Combos", porcentaje: 5, color: "#8B5CF6" },
  ];

  const displayCategorias =
    categorias.length > 0 ? categorias : defaultCategorias;

  // Rango de la semana actual: Lunes → Domingo
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Dom, 1=Lun ... 6=Sáb
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmtShort = (d) =>
    d
      .toLocaleDateString("es-ES", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
      .replace(/^\w/, (c) => c.toUpperCase());
  const fmtDay = (d) =>
    d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const weekRangeLabel = `${fmtShort(monday)} – ${fmtShort(sunday)}`;
  const weekRangeDates = `${fmtDay(monday)} al ${fmtDay(sunday)}`;

  // Fecha actual formateada (Lunes, 17 De Agosto De 2026)
  const rawDateStr = now.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const fullDateFormatted = rawDateStr.replace(/(^\w|\s\w)/g, (m) =>
    m.toUpperCase(),
  );

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc] text-slate-800 p-4 sm:p-6 lg:p-8 hide-scrollbar font-sans">
      {/* ── Encabezado Estilo Banner (Fijo en Última Semana) ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        {/* Left Side: Icon + Title + Date */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:w-12 rounded-xl sm:rounded-2xl bg-red-50 text-pizza-red flex items-center justify-center shrink-0 shadow-xs">
            <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-black text-slate-900 leading-tight truncate max-w-[60vw] sm:max-w-none">
                Dashboard Administrador
              </h1>
              <span className="bg-red-50 text-pizza-red border border-red-200/60 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold tracking-wide uppercase whitespace-nowrap shrink-0">
                Última Semana
              </span>
            </div>
            <p className="text-slate-400 text-[11px] sm:text-xs font-medium mt-0.5 truncate">
              {fullDateFormatted}
            </p>
          </div>
        </div>

        {/* Right Side: Week Range + Refresh */}
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full lg:w-auto shrink-0">
          {/* Bloque de rango de fechas */}
          <div className="flex flex-col items-start sm:items-end text-left sm:text-right">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-pizza-red shrink-0" />
              <span>{weekRangeLabel}</span>
            </div>
            <span className="text-[10px] font-medium text-slate-400 mt-0.5">
              {weekRangeDates}
            </span>
          </div>

          <button
            onClick={fetchDashboardStats}
            title="Actualizar datos"
            className="p-2.5 text-slate-400 hover:text-pizza-red bg-slate-50 border border-slate-200/60 rounded-xl sm:rounded-2xl transition-colors shadow-xs shrink-0"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin text-pizza-red" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* ── Top 4 KPI Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Total Revenue (Hero Red Pizzeria Style) */}
        <div className="bg-gradient-to-br from-pizza-red via-pizza-red to-pizza-red-dark text-white rounded-2xl p-4 sm:p-5 shadow-lg shadow-red-500/15 relative overflow-hidden flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-red-100 text-[11px] font-bold tracking-wider uppercase">
              Ingresos (Semana)
            </span>
            <div className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center transition-transform group-hover:scale-105">
              <ArrowUpRight className="w-4 h-4 text-white" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
              $
              {kpis.totalRevenue.toLocaleString("es-VE", {
                minimumFractionDigits: 2,
              })}
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  kpis.growthRevenue >= 0
                    ? "bg-emerald-400/20 text-emerald-100 border border-emerald-400/30"
                    : "bg-red-900/40 text-red-100 border border-red-400/30"
                }`}
              >
                {kpis.growthRevenue >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {kpis.growthRevenue >= 0
                  ? `+${kpis.growthRevenue}%`
                  : `${kpis.growthRevenue}%`}
              </span>
              <span className="text-red-100/80 text-[11px] font-medium">
                vs semana anterior
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Orders (Blue Module Accent) */}
        <div className="bg-white border-l-4 border-l-blue-500 border border-slate-200/70 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-[11px] font-bold tracking-wider uppercase">
              Órdenes (Semana)
            </span>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
              {kpis.totalOrders}
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  kpis.growthOrders >= 0
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                    : "bg-rose-50 text-rose-600 border border-rose-100"
                }`}
              >
                {kpis.growthOrders >= 0
                  ? `+${kpis.growthOrders}%`
                  : `${kpis.growthOrders}%`}
              </span>
              <span className="text-slate-400 text-[11px] font-medium">
                vs semana anterior
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Clients (Amber Module Accent) */}
        <div className="bg-white border-l-4 border-l-amber-500 border border-slate-200/70 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-[11px] font-bold tracking-wider uppercase">
              Clientes Únicos
            </span>
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
              {kpis.totalClients}
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  kpis.growthClients >= 0
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                    : "bg-rose-50 text-rose-600 border border-rose-100"
                }`}
              >
                {kpis.growthClients >= 0
                  ? `+${kpis.growthClients}%`
                  : `${kpis.growthClients}%`}
              </span>
              <span className="text-slate-400 text-[11px] font-medium">
                vs semana anterior
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Net Profit (Emerald Module Accent) */}
        <div className="bg-white border-l-4 border-l-emerald-500 border border-slate-200/70 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-[11px] font-bold tracking-wider uppercase">
              Ganancia Neta Est.
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
              $
              {kpis.netProfit.toLocaleString("es-VE", {
                minimumFractionDigits: 2,
              })}
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  kpis.growthProfit >= 0
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                    : "bg-rose-50 text-rose-600 border border-rose-100"
                }`}
              >
                {kpis.growthProfit >= 0
                  ? `+${kpis.growthProfit}%`
                  : `${kpis.growthProfit}%`}
              </span>
              <span className="text-slate-400 text-[11px] font-medium">
                vs semana anterior
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Charts & Quick Visuals Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left Column: 2 Quick Visual Stat Cards */}
        <div className="flex flex-col gap-6">
          {/* Quick Stat Card 1: Orders Status */}
          <div className="bg-white border border-slate-200/70 rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden flex-1">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-full bg-red-50 text-pizza-red flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
            <div>
              <div className="text-4xl font-black text-slate-900 mb-1">
                {statusQuick.pendientes +
                  statusQuick.en_cocina +
                  statusQuick.completadas}{" "}
                <span className="text-lg font-semibold text-slate-500">
                  órdenes hoy
                </span>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed mt-2">
                <span className="text-pizza-red font-bold bg-red-50 px-2 py-0.5 rounded-md border border-red-200/60 mr-1.5">
                  {statusQuick.pendientes} pendientes
                </span>
                de confirmación en caja / cocina.
              </p>
            </div>
          </div>

          {/* Quick Stat Card 2: Customers Status */}
          <div className="bg-white border border-slate-200/70 rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden flex-1">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div>
              <div className="text-4xl font-black text-slate-900 mb-1">
                {kpis.totalClients}{" "}
                <span className="text-lg font-semibold text-slate-500">
                  clientes
                </span>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed mt-2">
                <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 mr-1.5">
                  {statusQuick.en_cocina} en atención
                </span>
                preparando sus pedidos esta semana.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Revenue Trend Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200/70 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Ventas Diarias (Última Semana)
              </h3>
              <p className="text-xs text-slate-400">
                Evolución de ingresos de los últimos 7 días
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-pizza-red text-white flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          <div className="h-[240px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={displayTendencia}
                margin={{ top: 10, right: 0, left: -25, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "#f8fafc" }}
                />
                <Bar
                  dataKey="ingresos_usd"
                  fill="#EA2A33"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={36}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Bottom Section: Category Sales Donut & Ticket Stats ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales by Category Donut Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200/70 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Ventas por Categoría (Semanal)
              </h3>
              <p className="text-xs text-slate-400">
                Distribución de productos más vendidos en la semana
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Donut Chart */}
            <div className="h-[200px] w-[200px] relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={displayCategorias}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="porcentaje"
                  >
                    {displayCategorias.map((entry) => (
                      <Cell
                        key={`cell-${entry.nombre}`}
                        fill={entry.color || "#EA2A33"}
                        stroke="none"
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-slate-400 font-medium">
                  Categorías
                </span>
                <span className="text-lg font-extrabold text-slate-900">
                  {displayCategorias.length}
                </span>
              </div>
            </div>

            {/* Custom Category Legend List */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              {displayCategorias.map((cat) => (
                <div
                  key={cat.nombre}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.color || "#EA2A33" }}
                    ></div>
                    <span className="text-sm font-semibold text-slate-700">
                      {cat.nombre}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">
                    {cat.porcentaje}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ticket Promedio Card */}
        <div className="bg-white border border-slate-200/70 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Ticket Promedio
              </span>
              <div className="w-8 h-8 rounded-full bg-red-50 text-pizza-red flex items-center justify-center font-bold">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 mb-2">
              ${kpis.ticketPromedio.toFixed(2)}
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Consumo promedio por cliente esta semana.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-500">Pico más alto:</span>
              <span className="text-pizza-red bg-red-50 px-2.5 py-1 rounded-lg border border-red-100">
                ${kpis.picoMaximo > 0 ? kpis.picoMaximo.toFixed(2) : "25.00"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
