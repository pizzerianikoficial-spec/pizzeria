import { API_BASE } from "../../config/api";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Users,
  Search,
  Sparkles,
  ShieldCheck,
  ShoppingBag,
  Star,
  Banknote,
  Smartphone,
  CreditCard,
  Coins,
  Phone,
  Clock,
  Trophy,
  Wallet,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";



const VIP_LIMIT = 10;

// Configuración visual de los métodos de pago que existen en la BD
const PAYMENT_METHODS = [
  {
    metodo: "Punto",
    label: "Punto de Venta",
    icon: CreditCard,
    color: "#8B5CF6",
    colorText: "text-purple-600",
    colorBg: "bg-purple-100",
    colorBar: "bg-purple-500",
    colorLight: "bg-purple-50/70",
    colorBorder: "border-purple-100/80",
  },
  {
    metodo: "Pago_Movil",
    label: "Pago Móvil",
    icon: Smartphone,
    color: "#3B82F6",
    colorText: "text-blue-600",
    colorBg: "bg-blue-100",
    colorBar: "bg-blue-500",
    colorLight: "bg-blue-50/70",
    colorBorder: "border-blue-100/80",
  },
  {
    metodo: "Efectivo",
    label: "Efectivo",
    icon: Banknote,
    color: "#10B981",
    colorText: "text-emerald-600",
    colorBg: "bg-emerald-100",
    colorBar: "bg-emerald-500",
    colorLight: "bg-emerald-50/70",
    colorBorder: "border-emerald-100/80",
  },
  {
    metodo: "Binance/Zelle",
    label: "Binance/Zelle",
    icon: Coins,
    color: "#F59E0B",
    colorText: "text-amber-600",
    colorBg: "bg-amber-100",
    colorBar: "bg-amber-500",
    colorLight: "bg-amber-50/70",
    colorBorder: "border-amber-100/80",
  },
];

const FALLBACK_METHOD = {
  label: "Otro",
  icon: Banknote,
  color: "#94A3B8",
  colorText: "text-slate-600",
  colorBg: "bg-slate-100",
  colorBar: "bg-slate-400",
  colorLight: "bg-slate-50/70",
  colorBorder: "border-slate-100/80",
};

const getPaymentConfig = (metodoStr) => {
  const norm = String(metodoStr || "")
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
  if (norm.includes("punto") || norm.includes("tarjeta")) return PAYMENT_METHODS[0];
  if (norm.includes("pago") || norm.includes("movil")) return PAYMENT_METHODS[1];
  if (norm.includes("efectivo") || norm.includes("cash") || norm.includes("dolar")) return PAYMENT_METHODS[2];
  if (norm.includes("binance") || norm.includes("zelle") || norm.includes("cripto")) return PAYMENT_METHODS[3];
  return (
    PAYMENT_METHODS.find(
      (p) => p.metodo.toLowerCase() === String(metodoStr).toLowerCase(),
    ) || FALLBACK_METHOD
  );
};

const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`;

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getHeaderDate = () => {
  const date = new Date();
  const options = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  };
  const dateString = date.toLocaleDateString("es-ES", options);
  return dateString
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Tooltip estilizado para la gráfica Donut de métodos de pago
const CustomDonutTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-xl px-3.5 py-2 shadow-xl border border-slate-800 text-xs">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: data.color }}
          />
          <span className="font-bold text-slate-100">{data.name}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-slate-300">
          <span className="text-slate-400">Total cobrado:</span>
          <span className="font-extrabold text-emerald-400 font-mono">
            {formatMoney(data.total_usd)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-slate-400 text-[11px] mt-0.5">
          <span>Participación:</span>
          <span className="font-bold text-slate-200">
            {data.cantidad} pagos ({data.percent}%)
          </span>
        </div>
      </div>
    );
  }
  return null;
};

// Tooltip estilizado para la gráfica de barras del Top 6
const CustomTopClientTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-xl px-3.5 py-2.5 shadow-xl border border-slate-800 text-xs">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-5 h-5 rounded-full bg-pizza-red/20 text-pizza-red border border-pizza-red/30 flex items-center justify-center font-black text-[10px]">
            #{data.rank}
          </span>
          <span className="font-bold text-slate-100">{data.fullName}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-slate-300">
          <span className="text-slate-400">Total gastado:</span>
          <span className="font-extrabold text-emerald-400 font-mono">
            {formatMoney(data.Gasto)}
          </span>
        </div>
        {data.orders > 0 && (
          <div className="flex items-center justify-between gap-4 text-slate-400 text-[11px] mt-0.5">
            <span>Órdenes realizadas:</span>
            <span className="font-bold text-slate-200">{data.orders}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default function ClientesPrincipalesScreen() {
  const [customers, setCustomers] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentsLoading, setIsPaymentsLoading] = useState(false);
  const [search, setSearch] = useState("");

  // ─── Carga de datos reales (solo lectura) ───
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const cRes = await axios.get(`${API_BASE}/obtener-clientes`);
        if (cRes.data.success) setCustomers(cRes.data.data);
      } catch (error) {
        console.error("Error al cargar clientes principales:", error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Clientes ordenados por gasto total (desc) → ranking VIP
  const sorted = useMemo(
    () =>
      [...customers].sort(
        (a, b) => Number(b.total || 0) - Number(a.total || 0),
      ),
    [customers],
  );

  const topClients = useMemo(() => sorted.slice(0, VIP_LIMIT), [sorted]);
  const vipIds = useMemo(() => topClients.map((c) => c.id), [topClients]);

  // ─── Métodos de pago SOLO de los clientes del Top 10 ───
  useEffect(() => {
    if (!vipIds.length) {
      setPaymentMethods([]);
      return;
    }
    const load = async () => {
      setIsPaymentsLoading(true);
      try {
        const pRes = await axios.get(`${API_BASE}/metodos-pagos`, {
          params: { clientes: vipIds.join(",") },
        });
        if (pRes.data.success) setPaymentMethods(pRes.data.data);
      } catch (error) {
        console.error("Error al cargar métodos de pago:", error);
      } finally {
        setIsPaymentsLoading(false);
      }
    };
    load();
  }, [vipIds]);

  // ─── Cards ───
  const totalClientes = customers.length;
  const clientesVip = Math.min(VIP_LIMIT, topClients.length);

  const ltvPromedio = useMemo(() => {
    if (!customers.length) return 0;
    const total = customers.reduce((s, c) => s + Number(c.total || 0), 0);
    return total / customers.length;
  }, [customers]);

  const compraMedia = useMemo(() => {
    const total = customers.reduce((s, c) => s + Number(c.total || 0), 0);
    const orders = customers.reduce((s, c) => s + Number(c.orders || 0), 0);
    return orders > 0 ? total / orders : 0;
  }, [customers]);

  const topSpendersData = useMemo(
    () =>
      topClients.slice(0, 6).map((c, index) => ({
        rank: index + 1,
        fullName: c.name,
        name: c.name.split(" ")[0],
        displayName: `${index + 1}º ${c.name.split(" ")[0]}`,
        Gasto: Number(c.total || 0),
        orders: Number(c.orders || 0),
        cedula: c.cedula || "",
      })),
    [topClients],
  );

  const isVip = (client) => vipIds.includes(client.id);

  // ─── Métodos de pago ───
  const paymentStats = useMemo(() => {
    const realMethods = paymentMethods.filter((m) => m.metodo);
    const totalPayments = realMethods.reduce(
      (s, m) => s + Number(m.cantidad || 0),
      0,
    );
    const items = realMethods
      .map((m) => {
        const cfg = getPaymentConfig(m.metodo);
        return {
          ...m,
          cfg,
          percent:
            totalPayments > 0
              ? Math.round((Number(m.cantidad || 0) / totalPayments) * 100)
              : 0,
        };
      })
      .sort((a, b) => b.cantidad - a.cantidad);
    return { totalPayments, items };
  }, [paymentMethods]);

  const paymentChartData = useMemo(() => {
    return paymentStats.items.map((m) => ({
      name: m.cfg.label,
      value: Number(m.cantidad || 0),
      total_usd: Number(m.total_usd || 0),
      cantidad: Number(m.cantidad || 0),
      percent: m.percent,
      color: m.cfg.color,
    }));
  }, [paymentStats]);

  // ─── Búsqueda dentro del Top 10 ───
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return topClients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.cedula.toLowerCase().includes(q) ||
        String(c.phone).includes(q),
    );
  }, [topClients, search]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 hide-scrollbar flex flex-col gap-4 sm:gap-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-pizza-red/10 rounded-2xl flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-pizza-red" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
              Clientes VIP
            </h1>
            <p className="text-xs font-semibold text-slate-400 mt-1.5">
              {getHeaderDate()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-500 bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-xl flex items-center gap-1 shrink-0">
            Total: {customers.length} registrados
          </span>
        </div>
      </header>

      {/* Cards de estadísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 shrink-0">
        {/* Clientes VIP */}
        <div className="bg-purple-50/70 border border-purple-100/80 rounded-2xl p-3 sm:p-4 w-full min-w-0  flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-500 flex items-center justify-center text-white shrink-0 shadow-[0_4px_12px_rgba(139,92,246,0.2)]">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[8px] sm:text-[9px] font-extrabold text-purple-500 uppercase tracking-wider whitespace-nowrap">
                Clientes VIP
              </p>
              <p className="text-slate-800 text-2xl font-black leading-none mt-1">
                {isLoading ? "—" : clientesVip}
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block text-[9px] sm:text-[10px] font-bold text-purple-600 bg-purple-100 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
            Top gasto
          </span>
        </div>

        {/* LTV Promedio */}
        <div className="bg-emerald-50/70 border border-emerald-100/80 rounded-2xl p-3 sm:p-4 w-full min-w-0  flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-[0_4px_12px_rgba(16,185,129,0.2)]">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[8px] sm:text-[9px] font-extrabold text-emerald-500 uppercase tracking-wider whitespace-nowrap">
                LTV Promedio
              </p>
              <p className="text-slate-800 text-2xl font-black leading-none mt-1">
                {isLoading ? "—" : formatMoney(ltvPromedio)}
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block text-[9px] sm:text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
            Por cliente
          </span>
        </div>

        {/* Compra Media */}
        <div className="bg-blue-50/70 border border-blue-100/80 rounded-2xl p-3 sm:p-4 w-full min-w-0  flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shrink-0 shadow-[0_4px_12px_rgba(59,130,246,0.2)]">
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[8px] sm:text-[9px] font-extrabold text-blue-500 uppercase tracking-wider whitespace-nowrap">
                Compra Media
              </p>
              <p className="text-slate-800 text-2xl font-black leading-none mt-1">
                {isLoading ? "—" : formatMoney(compraMedia)}
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block text-[9px] sm:text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
            Por ticket
          </span>
        </div>

        {/* Total Clientes */}
        <div className="bg-red-50/70 border border-red-100/80 rounded-2xl p-3 sm:p-4 w-full min-w-0  flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-pizza-red flex items-center justify-center text-white shrink-0 shadow-[0_4px_12px_rgba(234,42,51,0.2)]">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[8px] sm:text-[9px] font-extrabold text-pizza-red uppercase tracking-wider whitespace-nowrap">
                Total Clientes
              </p>
              <p className="text-slate-800 text-2xl font-black leading-none mt-1">
                {isLoading ? "—" : totalClientes}
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block text-[9px] sm:text-[10px] font-bold text-red-600 bg-red-100 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
            Registrados
          </span>
        </div>
      </div>

      {/* Cuadrícula central: Gráficas Rediseñadas (con mayor altura vertical y presencia estilizada) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 shrink-0">
        {/* Gráfica 1: Métodos de Pago más Usados (Donut Chart + Desglose vertical estilizado) */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 sm:p-5 flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between mb-3 gap-2">
            <div>
              <h3 className="text-slate-800 font-extrabold text-sm sm:text-base">
                Métodos de Pago más Usados
              </h3>
              <p className="text-slate-400 text-[11px] sm:text-xs mt-0.5">
                Preferencia de cobro de los {VIP_LIMIT} clientes principales
              </p>
            </div>
            {paymentStats.totalPayments > 0 && (
              <span className="text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full shrink-0 shadow-xs">
                {paymentStats.totalPayments} pagos
              </span>
            )}
          </div>

          <div className="h-[270px] sm:h-[300px] flex items-center min-w-0">
            {isLoading || isPaymentsLoading ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                <div className="w-8 h-8 rounded-full border-3 border-slate-200 border-t-purple-500 animate-spin" />
                <span className="text-xs font-medium">Cargando métodos...</span>
              </div>
            ) : paymentStats.items.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1.5">
                <CreditCard className="w-10 h-10 opacity-30" />
                <span className="text-xs font-medium">Sin pagos registrados</span>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col sm:flex-row items-center gap-4 sm:gap-6 min-w-0">
                {/* Donut Ring grande y destacado */}
                <div className="relative w-[180px] h-[180px] sm:w-[210px] sm:h-[210px] shrink-0 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={92}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                      >
                        {paymentChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomDonutTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <Wallet className="w-5 h-5 text-slate-400 mb-1" />
                    <span className="text-2xl font-black text-slate-800 leading-none">
                      {paymentStats.totalPayments}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                      cobros
                    </span>
                  </div>
                </div>

                {/* Desglose vertical con micro-barras y detalles completos */}
                <div className="flex-1 w-full flex flex-col justify-center gap-3 sm:gap-3.5 min-w-0 pr-1">
                  {paymentStats.items.map((m) => {
                    const Icon = m.cfg.icon;
                    return (
                      <div key={m.metodo} className="group flex flex-col gap-1.5 min-w-0">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 ${m.cfg.colorBg}`}
                            >
                              <Icon className={`w-4 h-4 ${m.cfg.colorText}`} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 truncate text-xs sm:text-sm">
                                {m.cfg.label}
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium">
                                {m.cantidad} {m.cantidad === 1 ? "pago" : "pagos"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="font-black text-slate-800 text-xs sm:text-sm font-mono">
                                {formatMoney(m.total_usd)}
                              </span>
                              <span
                                className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md"
                                style={{
                                  backgroundColor: `${m.cfg.color}18`,
                                  color: m.cfg.color,
                                }}
                              >
                                {m.percent}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${Math.max(3, m.percent)}%`,
                              backgroundColor: m.cfg.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Gráfica 2: Top 6 Mejores Clientes (Gráfica de Barras estilizada con altura vertical) */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 sm:p-5 flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between mb-3 gap-2">
            <div>
              <h3 className="text-slate-800 font-extrabold text-sm sm:text-base">
                Top 6 Mejores Clientes
              </h3>
              <p className="text-slate-400 text-[11px] sm:text-xs mt-0.5">
                Personas con mayor volumen de compras acumulado
              </p>
            </div>
            {topClients.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-full shadow-xs shrink-0">
                <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span className="hidden sm:inline text-amber-600/90 font-semibold">
                  Líder:
                </span>
                <span className="truncate max-w-[90px]">
                  {topClients[0]?.name.split(" ")[0]}
                </span>
              </div>
            )}
          </div>

          <div className="h-[270px] sm:h-[300px] w-full min-w-0">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                <div className="w-8 h-8 rounded-full border-3 border-slate-200 border-t-pizza-red animate-spin" />
                <span className="text-xs font-medium">Cargando gráfico...</span>
              </div>
            ) : topSpendersData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-1.5">
                <Users className="w-10 h-10 opacity-30" />
                <span className="text-xs font-medium">Sin datos de compras</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topSpendersData}
                  margin={{ top: 25, right: 12, left: -16, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="clientBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EA2A33" stopOpacity={1} />
                      <stop offset="100%" stopColor="#FB7185" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f1f5f9"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="displayName"
                    tick={{ fill: "#64748b", fontSize: 11, fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(241, 245, 249, 0.7)", radius: 8 }}
                    content={<CustomTopClientTooltip />}
                  />
                  <Bar
                    dataKey="Gasto"
                    fill="url(#clientBarGrad)"
                    radius={[8, 8, 2, 2]}
                    maxBarSize={36}
                    label={{
                      position: "top",
                      fill: "#64748b",
                      fontSize: 11,
                      fontWeight: 700,
                      formatter: (v) => formatMoney(v),
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Tabla: Top 10 Clientes */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden shrink-0">
        <div className="px-4 sm:px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
          <div>
            <h3 className="font-extrabold text-slate-800 text-base">
              Clientes Top
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Los {clientesVip} que más han gastado
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o cédula..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-pizza-red focus:ring-1 focus:ring-pizza-red transition-all w-full shadow-sm"
              />
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl flex items-center gap-1 shrink-0 shadow-sm">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
              Top {VIP_LIMIT} VIP
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[860px] hidden lg:table">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold text-xs uppercase tracking-wider text-left">
                <th className="px-5 py-3.5">N°</th>
                <th className="px-5 py-3.5">Cliente</th>
                <th className="px-5 py-3.5">Cédula</th>
                <th className="px-5 py-3.5">Teléfono</th>
                <th className="px-5 py-3.5 text-center">Compras</th>
                <th className="px-5 py-3.5 text-right">Total Gastado</th>
                <th className="px-5 py-3.5 text-right">Última Visita</th>
                <th className="px-5 py-3.5 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <p className="font-medium">Cargando clientes...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium">No se encontraron clientes</p>
                  </td>
                </tr>
              ) : (
                filtered.map((customer, index) => {
                  const vip = isVip(customer);
                  return (
                    <tr
                      key={customer.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-5 py-3 text-slate-400 text-xs font-bold">
                        {index + 1}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border ${
                              vip
                                ? "bg-amber-50 border-amber-200 text-amber-600"
                                : "bg-slate-100 border-slate-200 text-slate-600"
                            }`}
                          >
                            {customer.name.charAt(0)}
                          </div>
                          <span className="font-bold text-slate-800">
                            {customer.name}
                          </span>
                          {vip && (
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-600 font-mono text-xs">
                        {customer.cedula}
                      </td>
                      <td className="px-5 py-3 text-slate-500 font-mono text-xs">
                        {customer.phone || "—"}
                      </td>
                      <td className="px-5 py-3 text-center font-bold text-slate-800">
                        {customer.orders}
                      </td>
                      <td className="px-5 py-3 text-right font-extrabold text-emerald-600">
                        {formatMoney(customer.total)}
                      </td>
                      <td className="px-5 py-3 text-right text-slate-500 text-xs">
                        {formatDate(customer.lastVisit)}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            vip
                              ? "bg-amber-50 border border-amber-100 text-amber-600"
                              : "bg-blue-50 border border-blue-100 text-blue-600"
                          }`}
                        >
                          {vip ? "VIP" : "Regular"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          {/* Vista Móvil: Cards */}
          <div className="lg:hidden flex flex-col gap-3 p-4 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-12 text-slate-400">
                <div className="w-8 h-8 rounded-full border-4 border-pizza-red/20 border-t-pizza-red animate-spin mx-auto mb-2"></div>
                <p className="font-medium">Cargando clientes...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="font-medium">No se encontraron clientes</p>
              </div>
            ) : (
              filtered.map((customer, index) => {
                const vip = isVip(customer);
                return (
                  <div
                    key={customer.id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"
                  >
                    {/* Header: Avatar, Nombre, Cédula y Total */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border ${vip ? "bg-amber-50 border-amber-200 text-amber-600" : "bg-slate-100 border-slate-200 text-slate-600"}`}
                        >
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-slate-800 truncate">
                              {customer.name}
                            </p>
                            {vip && (
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-current shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-slate-500 truncate font-mono">
                            {customer.cedula || "Sin cédula"}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 whitespace-nowrap">
                        {formatMoney(customer.total)}
                      </span>
                    </div>

                    {/* Info: Teléfono, Órdenes, Última Visita */}
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-slate-600 font-mono text-xs">
                          {customer.phone || "Sin teléfono"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <ShoppingBag className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-slate-700 font-bold">
                          {customer.orders} orden
                          {customer.orders !== 1 ? "es" : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-slate-500 text-xs">
                          Última visita: {formatDate(customer.lastVisit)}
                        </span>
                      </div>
                    </div>

                    {/* Estado VIP (Reemplaza al botón de "Editar" de la otra pantalla) */}
                    <div
                      className={`w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl border ${vip ? "text-amber-600 bg-amber-50 border-amber-200" : "text-blue-600 bg-blue-50 border-blue-200"}`}
                    >
                      <Star className="w-4 h-4 fill-current" />
                      {vip ? "Cliente VIP" : "Cliente Regular"}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
