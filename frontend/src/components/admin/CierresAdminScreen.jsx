import { API_BASE } from "../../config/api";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  DollarSign,
  TrendingUp,
  Clock,
  ArrowUpDown,
  Eye,
  Calendar,
  X,
  FileText,
  User,
  ShoppingBag,
  Key,
  Lock,
  Unlock,
  Download,
  Bike,
  Store,
  Layers,
} from "lucide-react";
import { exportCierrePDF } from "../../utils/pdfCierre";
import Pagination from "../ui/Pagination";



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

const formatTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("es-VE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// Mostrar el rol del usuario en español dentro de la gestión de PINs
const ROL_LABELS = {
  admin: "Administrador",
  cashier: "Cajero",
  cashierdelivery: "Cajero Delivery",
  "caja delivery": "Caja Delivery",
  "cajero delivery": "Cajero Delivery",
  chef: "Cocinero",
  cocinero: "Cocinero",
  mesero: "Mesero",
  waiter: "Mesero",
  despachador: "Despachador",
  delivery: "Delivery",
  repartidor: "Repartidor",
};

const rolLabel = (rol) => ROL_LABELS[String(rol).toLowerCase()] || rol;

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

// Paleta de colores por sucursal (se rota por id_sucursal % paleta.length)
export const SUCURSAL_PALETTES = [
  { bg: [239, 68, 68], light: [254, 226, 226], label: "red" }, // rojo
  { bg: [59, 130, 246], light: [219, 234, 254], label: "blue" }, // azul
  { bg: [16, 185, 129], light: [209, 250, 229], label: "green" }, // verde
  { bg: [168, 85, 247], light: [243, 232, 255], label: "purple" }, // violeta
  { bg: [245, 158, 11], light: [254, 243, 199], label: "amber" }, // ámbar
  { bg: [20, 184, 166], light: [204, 251, 241], label: "teal" }, // teal
];

export const getSucursalPalette = (id_sucursal) => {
  const idx = (Number(id_sucursal) - 1 || 0) % SUCURSAL_PALETTES.length;
  return SUCURSAL_PALETTES[Math.max(0, idx)];
};

// Badge de sucursal con color
function SucursalBadge({ id, nombre }) {
  if (!nombre) return <span className="text-slate-400 text-xs">—</span>;
  const palette = getSucursalPalette(id);
  const tailwindColors = {
    red: "bg-red-100 text-red-700 border-red-200",
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    green: "bg-emerald-100 text-emerald-700 border-emerald-200",
    purple: "bg-purple-100 text-purple-700 border-purple-200",
    amber: "bg-amber-100 text-amber-700 border-amber-200",
    teal: "bg-teal-100 text-teal-700 border-teal-200",
  };
  const cls =
    tailwindColors[palette.label] ||
    "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${cls} whitespace-nowrap`}
    >
      {nombre}
    </span>
  );
}

export default function CierresAdminScreen() {
  const [cierres, setCierres] = useState([]);
  const [metrics, setMetrics] = useState({
    mes: "",
    cantidad_cierres: 0,
    total_usd: 0,
    promedio_usd: 0,
    ultima_hora_ayer: "Ninguno",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchDate, setSearchDate] = useState("");
  const [sortOrder, setSortOrder] = useState("desc"); // 'asc' o 'desc'
  const [selectedCierre, setSelectedCierre] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sucursalFilter, setSucursalFilter] = useState(""); // "" = todas
  const [tipoCierreFilter, setTipoCierreFilter] = useState("todos"); // "todos", "delivery", "general"

  // Pin Modal states
  const [openPinModal, setOpenPinModal] = useState(false);
  const [cajeros, setCajeros] = useState([]);
  const [loadingCajeros, setLoadingCajeros] = useState(false);
  const [editingCajero, setEditingCajero] = useState(null);
  const [newPin, setNewPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [selectedCajeroId, setSelectedCajeroId] = useState("");

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const fetchCierres = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${API_BASE}/cierre/historial`, {
          signal: controller.signal,
        });
        if (isMounted && response.data.success) {
          setCierres(response.data.cierres);
          setMetrics(response.data.metrics);
        }
      } catch (error) {
        if (!axios.isCancel(error)) {
          console.error("Error al cargar historial de cierres:", error);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    fetchCierres();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  // Cargar cajeros para gestionar PINs
  useEffect(() => {
    if (!openPinModal) return;

    let isMounted = true;
    const controller = new AbortController();

    const fetchCajeros = async () => {
      setLoadingCajeros(true);
      setErrorMsg("");
      setSuccessMsg("");
      try {
        const response = await axios.get(`${API_BASE}/cierre/cajeros`, {
          signal: controller.signal,
        });
        if (isMounted && response.data.success) {
          setCajeros(response.data.cajeros);
          if (response.data.cajeros.length > 0) {
            setSelectedCajeroId(String(response.data.cajeros[0].id_usuario));
          }
        }
      } catch (error) {
        if (isMounted && !axios.isCancel(error)) {
          console.error("Error al obtener cajeros:", error);
          setErrorMsg("Error al cargar la lista de cajeros");
        }
      } finally {
        if (isMounted) {
          setLoadingCajeros(false);
        }
      }
    };
    fetchCajeros();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [openPinModal]);

  // Obtener lista única de sucursales de los cierres cargados
  const sucursalesUnicas = useMemo(() => {
    const map = new Map();
    cierres.forEach((c) => {
      if (c.id_sucursal && c.sucursal) {
        map.set(c.id_sucursal, c.sucursal);
      }
    });
    return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [cierres]);

  // Contadores dinámicos según filtros aplicados de fecha y sucursal
  const countsByType = useMemo(() => {
    let base = cierres;
    if (sucursalFilter) {
      base = base.filter(
        (c) => String(c.id_sucursal) === String(sucursalFilter),
      );
    }
    if (searchDate) {
      base = base.filter((c) => {
        const cDate = new Date(c.fecha_hora).toISOString().split("T")[0];
        return cDate === searchDate;
      });
    }
    const delivery = base.filter(
      (c) => String(c.tipo_cierre).toLowerCase() === "delivery",
    ).length;
    const general = base.filter(
      (c) => String(c.tipo_cierre || "").toLowerCase() !== "delivery",
    ).length;

    return {
      todos: base.length,
      delivery,
      general,
    };
  }, [cierres, sucursalFilter, searchDate]);

  // Resetear página al cambiar búsquedas o filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchDate, sortOrder, sucursalFilter, tipoCierreFilter]);

  // Filtrar y ordenar cierres
  const filteredAndSortedCierres = useMemo(() => {
    let result = [...cierres];

    // Filtrar por tipo de caja (Caja Delivery vs Caja General)
    if (tipoCierreFilter === "delivery") {
      result = result.filter(
        (c) => String(c.tipo_cierre).toLowerCase() === "delivery",
      );
    } else if (tipoCierreFilter === "general") {
      result = result.filter(
        (c) => String(c.tipo_cierre || "").toLowerCase() !== "delivery",
      );
    }

    // Filtrar por sucursal
    if (sucursalFilter) {
      result = result.filter(
        (c) => String(c.id_sucursal) === String(sucursalFilter),
      );
    }

    // Filtrar por día (YYYY-MM-DD o formato similar)
    if (searchDate) {
      result = result.filter((c) => {
        const cDate = new Date(c.fecha_hora).toISOString().split("T")[0];
        return cDate === searchDate;
      });
    }

    // Ordenar por fecha
    result.sort((a, b) => {
      const dateA = new Date(a.fecha_hora).getTime();
      const dateB = new Date(b.fecha_hora).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    return result;
  }, [cierres, searchDate, sortOrder, sucursalFilter, tipoCierreFilter]);

  // Reiniciar a la primera página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchDate, sortOrder, sucursalFilter, tipoCierreFilter]);

  const paginatedCierres = useMemo(() => {
    const startIndex = (currentPage - 1) * 10;
    return filteredAndSortedCierres.slice(startIndex, startIndex + 10);
  }, [filteredAndSortedCierres, currentPage]);

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const handleSavePin = async (id_usuario) => {
    if (!/^\d{4}$/.test(newPin)) {
      setErrorMsg("El PIN debe tener exactamente 4 números.");
      return;
    }

    // Validación local: el PIN no puede estar ya asignado a otro cajero
    const pinEnUso = cajeros.some(
      (c) => String(c.id_usuario) !== String(id_usuario) && c.pin === newPin,
    );
    if (pinEnUso) {
      setErrorMsg(
        "Ese PIN ya está en uso por otro cajero. Elige uno diferente.",
      );
      return;
    }

    setErrorMsg("");
    setSuccessMsg("");
    try {
      const response = await axios.put(
        `${API_BASE}/cierre/cajero-pin`,
        {
          id_usuario,
          pin: newPin,
        },
        {
          withCredentials: true,
        },
      );
      if (response.data.success) {
        setSuccessMsg("PIN actualizado correctamente.");
        setCajeros((prev) =>
          prev.map((c) =>
            c.id_usuario === id_usuario ? { ...c, pin: newPin } : c,
          ),
        );
        setEditingCajero(null);
        setNewPin("");
      }
    } catch (error) {
      console.error("Error al guardar PIN:", error);
      setErrorMsg(
        error.response?.data?.mensaje || "Error al actualizar el PIN.",
      );
    }
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-slate-50 p-4 sm:p-6 pb-16 flex flex-col gap-4 sm:gap-6 animate-in fade-in duration-300">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-pizza-red/10 rounded-2xl flex items-center justify-center shrink-0">
            <Lock className="w-6 h-6 text-pizza-red" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-black text-slate-800 tracking-tight leading-tight sm:leading-none truncate">
              Control de Cierres de Caja
            </h1>
            <p className="text-[11px] sm:text-xs font-semibold text-slate-400 mt-1 sm:mt-1.5 truncate">
              {getHeaderDate()}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:fles-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => setOpenPinModal(true)}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-black text-white px-4 sm:px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-[background-color,transform] sm:shrink-0 active:scale-[0.98] cursor-pointer w-full sm:w-auto"
            title="Administrar PINs de cierres para cajeros"
          >
            <Key className="w-4 h-4" />
            <span>Claves Cajeros</span>
          </button>
          <span className="text-xs sm:text-sm font-bold text-slate-500 bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-xl flex items-center gap-1 sm:w-auto sm:shrink-0 whitespace-nowrap">
            Total: {filteredAndSortedCierres.length} registros
          </span>
        </div>
      </header>

      {/* Cards de Métricas */}
      <div className="grid grip-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 shrink-0">
        {/* Cantidad Cierres del Mes */}
        <div className="bg-purple-50/70 border border-purple-100/80 rounded-2xl p-3 sm:p-4 flex w-full min-w-0 items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-500 flex items-center justify-center text-white shrink-0 shadow-[0_4px_12px_rgba(139,92,246,0.2)]">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[8px] sm:text-[9px] font-extrabold text-purple-500 uppercase tracking-wider whitespace-nowrap">
                Cierres en el Mes
              </p>
              <p className="text-slate-800 text-2xl font-black leading-none mt-1">
                {isLoading ? "—" : metrics.cantidad_cierres}
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block text-[9px] sm:text-[10px] font-bold text-purple-600 bg-purple-100 px-1.5 sm:px-2 py-0.5 rounded-full">
            {metrics.mes || "Mes"}
          </span>
        </div>

        {/* Monto Total en $ del Mes */}
        <div className="bg-emerald-50/70 border border-emerald-100/80 rounded-2xl p-3 sm:p-4 w-full min-w-0  flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-[0_4px_12px_rgba(16,185,129,0.2)]">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[8px] sm:text-[9px] font-extrabold text-emerald-500 uppercase tracking-wider whitespace-nowrap">
                Total en $ del Mes
              </p>
              <p className="text-slate-800 text-2xl font-black leading-none mt-1">
                {isLoading ? "—" : formatMoney(metrics.total_usd)}
              </p>
            </div>
          </div>
        </div>

        {/* Última Hora de Cierre del Día Anterior */}
        <div className="bg-blue-50/70 border border-blue-100/80 rounded-2xl p-3 sm:p-4 w-full min-w-0  flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shrink-0 shadow-[0_4px_12px_rgba(59,130,246,0.2)]">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[8px] sm:text-[9px] font-extrabold text-blue-500 uppercase tracking-wider whitespace-nowrap">
                Cierre de ayer
              </p>
              <p className="text-slate-800 text-xl font-black leading-none mt-1.5 truncate">
                {isLoading ? "—" : metrics.ultima_hora_ayer}
              </p>
            </div>
          </div>
        </div>

        {/* Promedio de $ por Cierre */}
        <div className="bg-amber-50/70 border border-amber-100/80 rounded-2xl p-3 sm:p-4 w-full min-w-0  flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shrink-0 shadow-[0_4px_12px_rgba(245,158,11,0.2)]">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[8px] sm:text-[9px] font-extrabold text-amber-500 uppercase tracking-wider whitespace-nowrap">
                Monto Promedio
              </p>
              <p className="text-slate-800 text-2xl font-black leading-none mt-1">
                {isLoading ? "—" : formatMoney(metrics.promedio_usd)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Cierres */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col w-full shrink-0">
        <div className="px-4 sm:px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            <h3 className="font-extrabold text-slate-800 text-base">
              Historial de Cierres
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Lista completa de cajas cerradas en la pizzería
            </p>
          </div>
          {/* Filtros de fecha, tipo de caja, sucursal y orden */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {/* Filtro rápido por tipo de caja (Select para móviles/compacto) */}
            <div className="sm:hidden w-full">
              <select
                value={tipoCierreFilter}
                onChange={(e) => setTipoCierreFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-pizza-red focus:ring-1 focus:ring-pizza-red transition-colors shadow-sm"
              >
                <option value="todos">
                  Todas las Cajas ({countsByType.todos})
                </option>
                <option value="delivery">
                  🛵 Cajas Delivery ({countsByType.delivery})
                </option>
                <option value="general">
                  🏪 Caja General ({countsByType.general})
                </option>
              </select>
            </div>

            {/* Filtro sucursal */}
            <select
              value={sucursalFilter}
              onChange={(e) => setSucursalFilter(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-pizza-red focus:ring-1 focus:ring-pizza-red transition-colors shadow-sm"
            >
              <option value="">Todas las Sucursales</option>
              {sucursalesUnicas.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>

            {/* Filtro fecha */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold uppercase">
                Día:
              </span>
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="bg-white border border-slate-200 text-slate-800 rounded-xl pl-12 pr-8 py-2 text-sm focus:outline-none focus:border-pizza-red focus:ring-1 focus:ring-pizza-red transition-colors shadow-sm"
              />
              {searchDate && (
                <button
                  onClick={() => setSearchDate("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Botón orden */}
            <button
              onClick={toggleSortOrder}
              className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 px-3 py-2 text-sm font-semibold rounded-xl hover:bg-slate-50 shadow-sm transition-colors shrink-0"
              title="Cambiar orden por fecha"
            >
              <ArrowUpDown className="w-4 h-4 text-slate-500" />
              <span>Fecha: {sortOrder === "asc" ? "ASC" : "DESC"}</span>
            </button>
          </div>
        </div>

        {/* Barra de Filtros Segmentados por Tipo de Caja (Escritorio / Tablet) */}
        <div className="hidden sm:flex items-center justify-between px-4 sm:px-5 py-2.5 bg-slate-50/70 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl shadow-xs">
            <button
              onClick={() => setTipoCierreFilter("todos")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                tipoCierreFilter === "todos"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Todas las Cajas</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  tipoCierreFilter === "todos"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                {countsByType.todos}
              </span>
            </button>

            <button
              onClick={() => setTipoCierreFilter("delivery")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                tipoCierreFilter === "delivery"
                  ? "bg-amber-400 text-amber-950 border-amber-500 shadow-xs scale-[1.02]"
                  : "text-amber-800 bg-amber-50/70 hover:bg-amber-100/80 border-amber-200/70"
              }`}
            >
              <Bike className="w-4 h-4 text-amber-900" />
              <span>Cajas Delivery</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  tipoCierreFilter === "delivery"
                    ? "bg-amber-950 text-amber-300"
                    : "bg-amber-200/90 text-amber-900"
                }`}
              >
                {countsByType.delivery}
              </span>
            </button>

            <button
              onClick={() => setTipoCierreFilter("general")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                tipoCierreFilter === "general"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Caja General / Salón</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  tipoCierreFilter === "general"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                {countsByType.general}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {tipoCierreFilter === "delivery" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-black animate-in fade-in">
                <Bike className="w-3.5 h-3.5 text-amber-700" />
                Filtrando: Cierres de Delivery
              </span>
            )}
            {tipoCierreFilter === "general" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold animate-in fade-in">
                <Store className="w-3.5 h-3.5 text-slate-600" />
                Filtrando: Cierres de Caja General
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm min-w-[960px] hidden lg:table">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-slate-200 bg-white text-slate-400 font-bold text-xs uppercase tracking-wider text-left shadow-sm">
                <th className="px-5 py-3.5">N°</th>
                <th className="px-5 py-3.5">Fecha</th>
                <th className="px-5 py-3.5">Hora</th>
                <th className="px-5 py-3.5">Tipo de Caja</th>
                <th className="px-5 py-3.5">Cajero / Usuario</th>
                <th className="px-5 py-3.5 text-center">Órdenes</th>
                <th className="px-5 py-3.5 text-right">Efectivo USD</th>
                <th className="px-5 py-3.5 text-right">Total Cierre (USD)</th>
                <th className="px-5 py-3.5 text-center">Sucursal</th>
                <th className="px-5 py-3.5 text-center">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-400">
                    <p className="font-medium">
                      Cargando historial de cierres...
                    </p>
                  </td>
                </tr>
              ) : paginatedCierres.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-400">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium">
                      No se encontraron cierres para el filtro seleccionado
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedCierres.map((cierre, index) => {
                  const esDelivery =
                    String(cierre.tipo_cierre).toLowerCase() === "delivery";
                  return (
                    <tr
                      key={cierre.id_cierre}
                      className={`transition-colors group ${
                        esDelivery
                          ? "bg-amber-50/40 hover:bg-amber-100/50 border-l-4 border-l-amber-400"
                          : "hover:bg-slate-50/70 border-l-4 border-l-transparent"
                      }`}
                    >
                      <td className="px-5 py-3.5 text-slate-400 text-xs font-bold">
                        {(currentPage - 1) * 10 + index + 1}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-800">
                        {formatDate(cierre.fecha_hora)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 font-mono text-xs">
                        {formatTime(cierre.fecha_hora)}
                      </td>
                      <td className="px-5 py-3.5">
                        {esDelivery ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-300/90 text-amber-950 border border-amber-400 text-xs font-black shadow-xs tracking-tight">
                            <Bike className="w-3.5 h-3.5 text-amber-900 shrink-0" />
                            <span>Delivery</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold shadow-xs">
                            <Store className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>Caja General</span>
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-800">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              esDelivery
                                ? "bg-amber-200 text-amber-900 border border-amber-300"
                                : "bg-slate-100 border border-slate-200 text-slate-600"
                            }`}
                          >
                            {cierre.usuario_nombre?.charAt(0) || "U"}
                          </div>
                          <span>
                            {cierre.usuario_nombre || "Cajero Desconocido"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center font-bold text-slate-800">
                        {cierre.num_ordenes}
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-slate-600">
                        {formatMoney(cierre.monto_efectivo_usd)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-extrabold text-emerald-600">
                        {formatMoney(cierre.total_usdt)}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <SucursalBadge
                          id={cierre.id_sucursal}
                          nombre={cierre.sucursal}
                        />
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedCierre(cierre)}
                            className="p-1 text-slate-400 hover:text-pizza-red hover:bg-red-50 rounded-lg transition-[background-color,color,opacity] opacity-0 group-hover:opacity-100 duration-150 cursor-pointer"
                            title="Ver desglose detallado"
                          >
                            <Eye className="w-4.5 h-4.5" />
                          </button>
                          <button
                            onClick={() => exportCierrePDF(cierre)}
                            className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-[background-color,color,opacity] opacity-0 group-hover:opacity-100 duration-150 cursor-pointer"
                            title="Descargar PDF"
                          >
                            <Download className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          {/* Vista Móvil: Cards */}
          <div className="lg:hidden flex flex-col gap-3 p-4">
            {isLoading ? (
              <div className="text-center py-12 text-slate-400">
                <div className="w-8 h-8 rounded-full border-4 border-pizza-red/20 border-t-pizza-red animate-spin mx-auto mb-2"></div>
                <p className="font-medium">Cargando historial de cierres...</p>
              </div>
            ) : paginatedCierres.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="font-medium">
                  No se encontraron cierres para el filtro seleccionado
                </p>
              </div>
            ) : (
              paginatedCierres.map((cierre, index) => {
                const esDelivery =
                  String(cierre.tipo_cierre).toLowerCase() === "delivery";
                return (
                  <div
                    key={cierre.id_cierre}
                    className={`bg-white rounded-2xl p-4 shadow-sm transition-all ${
                      esDelivery
                        ? "border-2 border-amber-300 bg-amber-50/20 border-l-4 border-l-amber-400"
                        : "border border-slate-200"
                    }`}
                  >
                    {/* Header: Cajero, Tipo de Caja, Fecha/Hora y Sucursal */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                            esDelivery
                              ? "bg-gradient-to-br from-amber-400 to-amber-500 text-amber-950 font-black shadow-xs"
                              : "bg-gradient-to-br from-slate-700 to-slate-900 text-white"
                          }`}
                        >
                          {cierre.usuario_nombre?.charAt(0) || "U"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-bold text-slate-800 truncate">
                              {cierre.usuario_nombre || "Cajero Desconocido"}
                            </p>
                            {esDelivery ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-300 text-amber-950 border border-amber-400 text-[10px] font-black shrink-0 shadow-2xs">
                                <Bike className="w-3 h-3 text-amber-900" />{" "}
                                Delivery
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold shrink-0">
                                <Store className="w-3 h-3 text-slate-500" />{" "}
                                Caja General
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <Calendar className="w-3 h-3 shrink-0" />
                            <span className="truncate">
                              {formatDate(cierre.fecha_hora)} •{" "}
                              {formatTime(cierre.fecha_hora)}
                            </span>
                          </p>
                        </div>
                      </div>
                      <SucursalBadge
                        id={cierre.id_sucursal}
                        nombre={cierre.sucursal}
                      />
                    </div>

                    {/* Métricas Clave en Grid */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 text-center">
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                          Total
                        </p>
                        <p className="text-sm font-black text-emerald-700 truncate mt-0.5">
                          {formatMoney(cierre.total_usdt)}
                        </p>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Efectivo
                        </p>
                        <p className="text-sm font-bold text-slate-700 truncate mt-0.5">
                          {formatMoney(cierre.monto_efectivo_usd)}
                        </p>
                      </div>
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-2.5 text-center">
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                          Órdenes
                        </p>
                        <p className="text-sm font-black text-blue-700 mt-0.5">
                          {cierre.num_ordenes}
                        </p>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => setSelectedCierre(cierre)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
                      >
                        <Eye className="w-4 h-4" />
                        Ver Detalle
                      </button>
                      <button
                        onClick={() => exportCierrePDF(cierre)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors border border-emerald-200"
                      >
                        <Download className="w-4 h-4" />
                        Descargar PDF
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Controles de paginación */}
        {!isLoading && filteredAndSortedCierres.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={filteredAndSortedCierres.length}
            pageSize={10}
            onPageChange={setCurrentPage}
            itemName="cierre(s)"
          />
        )}
      </div>

      {/* Modal de Detalle */}
      {selectedCierre && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-fade-in max-h-[90vh]">
            {/* Header Modal */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white relative">
              <button
                onClick={() => setSelectedCierre(null)}
                className="absolute right-4 top-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-slate-300 hover:text-white transition-[background-color,color,transform] duration-300 hover:rotate-90"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="w-12 h-12 rounded-2xl bg-pizza-red/20 border border-pizza-red/30 flex items-center justify-center mb-3">
                <FileText className="w-6 h-6 text-red-300" />
              </div>
              <h2 className="text-xl font-bold">
                Detalle del Cierre #{selectedCierre.id_cierre}
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Realizado el {formatDate(selectedCierre.fecha_hora)} a las{" "}
                {formatTime(selectedCierre.fecha_hora)}
              </p>
            </div>

            {/* Contenido Modal */}
            <div className="p-6 flex flex-col gap-4 overflow-y-auto">
              {/* Banner Tipo de Caja */}
              {String(selectedCierre.tipo_cierre).toLowerCase() ===
              "delivery" ? (
                <div className="flex items-center gap-3 p-3.5 bg-amber-100/80 border border-amber-300 rounded-xl shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold shadow-xs shrink-0">
                    <Bike className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                      Tipo de Cierre
                    </p>
                    <p className="text-sm font-black text-amber-950 truncate">
                      Cierre Caja Delivery (Repartos)
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-300 text-amber-950 border border-amber-400 shrink-0">
                    Delivery
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3.5 bg-slate-100/80 border border-slate-200 rounded-xl shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold shadow-xs shrink-0">
                    <Store className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Tipo de Cierre
                    </p>
                    <p className="text-sm font-black text-slate-800 truncate">
                      Cierre Caja General
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white text-slate-700 border border-slate-200 shrink-0">
                    Caja General
                  </span>
                </div>
              )}

              {/* Info General */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-10 h-10 rounded-lg bg-pizza-red/10 flex items-center justify-center text-pizza-red shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Cajero Responsable
                  </p>
                  <p className="text-sm font-bold text-slate-800">
                    {selectedCierre.usuario_nombre}
                  </p>
                </div>
              </div>

              {/* Órdenes */}
              <div className="flex items-center justify-between px-3 py-2 bg-slate-50/50 rounded-lg text-sm border border-slate-100/50">
                <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-slate-400" />
                  Órdenes Procesadas
                </span>
                <span className="font-extrabold text-slate-800">
                  {selectedCierre.num_ordenes}
                </span>
              </div>

              {/* Desglose de Montos */}
              <div className="flex flex-col gap-2 mt-2">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider px-1">
                  Desglose de Caja
                </h4>

                <div className="flex flex-col gap-1 border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {/* Efectivo USD */}
                  <div className="flex items-center justify-between p-3 text-sm bg-emerald-50/10">
                    <span className="text-slate-600 font-medium">
                      Efectivo (USD)
                    </span>
                    <span className="font-bold text-slate-800">
                      {formatMoney(selectedCierre.monto_efectivo_usd)}
                    </span>
                  </div>

                  {/* Efectivo Bs */}
                  <div className="flex items-center justify-between p-3 text-sm">
                    <span className="text-slate-600 font-medium">
                      Efectivo (Bs)
                    </span>
                    <span className="font-bold text-slate-800">
                      Bs.{" "}
                      {Number(
                        selectedCierre.monto_efectivo_bs || 0,
                      ).toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Punto Bs */}
                  <div className="flex items-center justify-between p-3 text-sm">
                    <span className="text-slate-600 font-medium">
                      Punto de Venta (Bs)
                    </span>
                    <span className="font-bold text-slate-800">
                      Bs.{" "}
                      {Number(
                        selectedCierre.monto_punto_bs || 0,
                      ).toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Pago Móvil Bs */}
                  <div className="flex items-center justify-between p-3 text-sm">
                    <span className="text-slate-600 font-medium">
                      Pago Móvil (Bs)
                    </span>
                    <span className="font-bold text-slate-800">
                      Bs.{" "}
                      {Number(
                        selectedCierre.monto_pago_movil_bs || 0,
                      ).toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Binance/Zelle USD */}
                  <div className="flex items-center justify-between p-3 text-sm">
                    <span className="text-slate-600 font-medium">
                      Binance / Zelle
                    </span>
                    <span className="font-bold text-amber-600">
                      USD{" "}
                      {Number(
                        selectedCierre.monto_binance_usd || 0,
                      ).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Total Final */}
              <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">
                    Total Registrado
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    En divisas equivalentes (USDT)
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-emerald-600">
                    {formatMoney(selectedCierre.total_usdt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center gap-3">
              <button
                onClick={() => exportCierrePDF(selectedCierre)}
                className="flex-1 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-slate-950 hover:shadow-lg text-white py-2.5 px-4 rounded-xl text-sm font-bold shadow-md transition-[background-color,box-shadow,transform] flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                Descargar PDF
              </button>
              <button
                onClick={() => setSelectedCierre(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-[background-color,border-color,transform] flex items-center justify-center gap-2"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Claves Cajeros */}
      {openPinModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl animate-fade-in max-h-[90vh]">
            {/* Header */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white relative">
              <button
                onClick={() => {
                  setOpenPinModal(false);
                  setEditingCajero(null);
                  setNewPin("");
                }}
                className="absolute right-4 top-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-slate-300 hover:text-white transition-[background-color,color,transform] duration-300 hover:rotate-90"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="w-12 h-12 rounded-2xl bg-pizza-red/20 border border-pizza-red/30 flex items-center justify-center mb-3">
                <Key className="w-6 h-6 text-red-300" />
              </div>
              <h2 className="text-xl font-bold">PINs de Cierre</h2>
              <p className="text-slate-400 text-sm mt-1">
                Asigna claves de 4 números a los usuarios que lo requieran
              </p>
            </div>

            {/* Contenido */}
            <div className="p-6 flex flex-col gap-4 overflow-y-auto bg-slate-50/30">
              {errorMsg && (
                <div className="bg-red-50 text-red-600 border border-red-100 px-4 py-2.5 rounded-2xl text-xs font-bold shadow-sm animate-shake">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-4 py-2.5 rounded-2xl text-xs font-bold shadow-sm">
                  {successMsg}
                </div>
              )}

              {loadingCajeros ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-8 h-8 rounded-full border-4 border-pizza-red/20 border-t-pizza-red animate-spin"></div>
                  <p className="text-slate-400 text-sm font-semibold">
                    Cargando cajeros...
                  </p>
                </div>
              ) : cajeros.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <User className="w-10 h-10 mb-2 opacity-35" />
                  <p className="text-sm font-bold">
                    No hay usuarios registrados activos
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Selector de Usuario */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      className="text-xs font-black text-slate-500 uppercase tracking-wider"
                      htmlFor="select-cajero"
                    >
                      Seleccionar Usuario
                    </label>
                    <select
                      id="select-cajero"
                      value={selectedCajeroId}
                      onChange={(e) => {
                        setSelectedCajeroId(e.target.value);
                        setEditingCajero(null);
                        setNewPin("");
                        setErrorMsg("");
                        setSuccessMsg("");
                      }}
                      className="bg-white border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-pizza-red focus:ring-1 focus:ring-pizza-red transition-colors w-full shadow-sm font-semibold"
                    >
                      {cajeros.map((c) => (
                        <option key={c.id_usuario} value={c.id_usuario}>
                          {c.nombre_completo} ({rolLabel(c.rol)})
                          {c.email ? ` · ${c.email}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Detalle y Gestión del Cajero Seleccionado */}
                  {(() => {
                    const activeCajero = cajeros.find(
                      (c) => String(c.id_usuario) === String(selectedCajeroId),
                    );
                    if (!activeCajero) return null;
                    const isEditing =
                      editingCajero?.id_usuario === activeCajero.id_usuario;

                    return (
                      <div className="border border-slate-100 rounded-2xl p-5 bg-white shadow-sm flex flex-col gap-4 transition-all duration-300">
                        {/* Info del Cajero */}
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-base shrink-0 shadow-sm">
                            {activeCajero.nombre_completo?.charAt(0) || "U"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-black text-slate-800 truncate">
                              {activeCajero.nombre_completo}
                            </p>
                            <p className="text-xs text-slate-400 font-medium truncate">
                              {rolLabel(activeCajero.rol)}
                              {activeCajero.email
                                ? ` · ${activeCajero.email}`
                                : ""}
                            </p>
                          </div>
                          <div className="shrink-0">
                            {activeCajero.pin ? (
                              <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full flex items-center gap-1.5">
                                <Lock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span>PIN Activo</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-extrabold text-red-500 bg-red-50 border border-red-100 px-3 py-1 rounded-full flex items-center gap-1.5">
                                <Unlock className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                <span>Sin Clave</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Configuración de PIN */}
                        <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
                          {isEditing ? (
                            <div className="flex flex-col gap-3">
                              <p className="text-xs font-semibold text-slate-500">
                                Introduce el nuevo PIN de seguridad de 4
                                dígitos:
                              </p>
                              <div className="flex items-center gap-3">
                                <input
                                  type="text"
                                  maxLength={4}
                                  placeholder="0000"
                                  value={newPin}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(
                                      /\D/g,
                                      "",
                                    ); // solo números
                                    setNewPin(val);
                                  }}
                                  className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pizza-red focus:ring-1 focus:ring-pizza-red transition-colors w-28 text-center font-mono font-black tracking-[0.3em] shadow-inner"
                                  autoFocus
                                />
                                <div className="flex items-center gap-2 flex-1 justify-end">
                                  <button
                                    onClick={() =>
                                      handleSavePin(activeCajero.id_usuario)
                                    }
                                    className="bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-slate-950 hover:shadow-lg text-white py-2.5 px-4 rounded-xl text-xs font-bold shadow-md transition-[background-color,box-shadow,transform] flex-1 max-w-[100px] text-center active:scale-[0.98]"
                                  >
                                    Guardar
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingCajero(null);
                                      setNewPin("");
                                      setErrorMsg("");
                                    }}
                                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-[background-color,border-color,transform] flex-1 max-w-[100px] text-center"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                              <span className="text-xs text-slate-500 font-medium">
                                {activeCajero.pin
                                  ? "El usuario ya posee una clave activa para cierres."
                                  : "Este usuario no tiene clave asignada."}
                              </span>
                              <button
                                onClick={() => {
                                  setEditingCajero(activeCajero);
                                  setNewPin(activeCajero.pin || "");
                                  setErrorMsg("");
                                  setSuccessMsg("");
                                }}
                                className="text-xs font-bold text-pizza-red bg-red-50 hover:bg-pizza-red hover:text-white border border-pizza-red/10 px-4 py-2 rounded-xl transition-colors shadow-sm shrink-0"
                              >
                                {activeCajero.pin
                                  ? "Cambiar PIN"
                                  : "Asignar PIN"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => {
                  setOpenPinModal(false);
                  setEditingCajero(null);
                  setNewPin("");
                }}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-[background-color,border-color,transform]"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
