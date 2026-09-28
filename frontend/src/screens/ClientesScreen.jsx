import { API_BASE } from "../config/api";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Users,
  Search,
  Plus,
  Pencil,
  X,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  UserPlus,
  Phone,
  Clock,
} from "lucide-react";
import ClienteForm from "../components/admin/clientes/ClienteForm";
import Pagination from "../components/ui/Pagination";



const PAGE_SIZE = 10;

// Caché a nivel de módulo: muestra los datos al instante al volver a abrir la pantalla
let cachedCustomers = null;

const formatTotal = (value) => `$${Number(value || 0).toFixed(2)}`;

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-VE", {
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

export default function ClientesScreen() {
  const [customers, setCustomers] = useState(cachedCustomers || []);
  const [isLoading, setIsLoading] = useState(!cachedCustomers);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name"); // 'name' | 'gasto-desc' | 'gasto-asc'

  // Paginación
  const [page, setPage] = useState(1);

  // Modal crear / editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // ─── Carga de Datos desde la BD ───
  const fetchCustomers = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/obtener-clientes`);
      if (res.data.success) {
        cachedCustomers = res.data.data;
        setCustomers(res.data.data);
      }
    } catch (error) {
      console.error("Error al cargar los clientes:", error);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (cachedCustomers) {
      fetchCustomers(true);
    } else {
      fetchCustomers();
    }
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();

    let list = customers.filter(
      (c) =>
        String(c.name || "")
          .toLowerCase()
          .includes(q) ||
        String(c.cedula || "")
          .toLowerCase()
          .includes(q) ||
        String(c.phone ?? "").includes(q),
    );

    if (sortBy === "gasto-desc") {
      list = [...list].sort(
        (a, b) => Number(b.total || 0) - Number(a.total || 0),
      );
    } else if (sortBy === "gasto-asc") {
      list = [...list].sort(
        (a, b) => Number(a.total || 0) - Number(b.total || 0),
      );
    }

    return list;
  }, [customers, search, sortBy]);

  // Volver a la primera página al cambiar búsqueda o filtros
  useEffect(() => {
    setPage(1);
  }, [search, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  // ─── Cards de estadísticas ───
  const stats = useMemo(() => {
    const total = customers.length;
    const conCompras = customers.filter((c) => Number(c.orders) > 0).length;
    const ventasTotales = customers.reduce(
      (s, c) => s + (Number(c.total) || 0),
      0,
    );
    const ticketPromedio = conCompras > 0 ? ventasTotales / conCompras : 0;
    return { total, conCompras, ventasTotales, ticketPromedio };
  }, [customers]);

  // ─── Apertura / Cierre de modales ───
  const openCreate = () => {
    setEditingClient(null);
    setFormError("");
    setIsModalOpen(true);
  };

  const openEdit = (client) => {
    setEditingClient(client);
    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormError("");
    setTimeout(() => setEditingClient(null), 300);
  };

  // ─── Guardar (Crear o Actualizar) ───
  const handleSave = async (data) => {
    setFormError("");
    setIsSaving(true);
    try {
      if (editingClient) {
        const res = await axios.put(
          `${API_BASE}/editar-cliente/${editingClient.id}`,
          {
            cedula: data.cedula,
            name: data.name,
            phone: data.phone,
            descripcion: data.descripcion || "",
          },
        );
        if (res.data.success) {
          setCustomers((prev) => {
            const updated = prev.map((c) =>
              c.id === editingClient.id ? { ...c, ...res.data.cliente } : c,
            );
            cachedCustomers = updated;
            return updated;
          });
          window.Toast.fire({
            icon: "success",
            title: "¡Cliente editado exitosamente!",
          });
        }
      } else {
        const res = await axios.post(`${API_BASE}/registrar-clientes`, {
          cedula: data.cedula,
          name: data.name,
          phone: data.phone,
          descripcion: data.descripcion || "",
        });
        if (res.data.success) {
          setCustomers((prev) => {
            const updated = [
              { ...res.data.cliente, total: 0, lastVisit: null },
              ...prev,
            ];
            cachedCustomers = updated;
            return updated;
          });
          window.Toast.fire({
            icon: "success",
            title: "¡Cliente registrado exitosamente!",
          });
        }
      }
      closeModal();
    } catch (error) {
      console.error("Error al guardar el cliente:", error);
      setFormError(
        error.response?.data?.message || "Error de conexión con el servidor",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col p-4 sm:p-6 pb-16 gap-4 sm:gap-6 overflow-y-auto w-full h-full bg-slate-50">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-pizza-red/10 rounded-2xl flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-pizza-red" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
              Clientes
            </h1>
            <p className="text-xs font-semibold text-slate-400 mt-1.5">
              {getHeaderDate()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={openCreate}
            className="bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all flex flex-1 sm:flex-none items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Nuevo Cliente
          </button>
        </div>
      </header>

      {/* Cards de estadísticas */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 shrink-0">
        {/* Total Clientes */}
        <div className="bg-red-50/70 border border-red-100/80 rounded-2xl p-3 sm:p-4 w-full min-w-0  flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-pizza-red flex items-center justify-center text-white shrink-0 shadow-[0_4px_12px_rgba(234,42,51,0.25)]">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[8px] sm:text-[9px] font-extrabold text-pizza-red uppercase tracking-wider truncate">
                Total Clientes
              </p>
              <p className="text-slate-800 text-lg sm:text-xl font-black leading-none mt-1">
                {stats.total}
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block text-[9px] sm:text-[10px] font-bold text-red-600 bg-red-100 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
            En total
          </span>
        </div>

        {/* Clientes con Compras */}
        <div className="bg-emerald-50/70 border border-emerald-100/80 rounded-xl p-3 sm:p-4 w-full min-w-0  flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-[0_4px_12px_rgba(16,185,129,0.25)]">
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] sm:text-[10px] font-extrabold text-emerald-500 uppercase tracking-wider truncate">
                Con Compras
              </p>
              <p className="text-slate-800 text-lg sm:text-xl font-black leading-none mt-1.5">
                {stats.conCompras}
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block text-[9px] sm:text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
            Con ventas
          </span>
        </div>

        {/* Ventas Totales */}
        <div className="bg-blue-50/70 border border-blue-100/80 rounded-2xl p-3 sm:p-4 w-full min-w-0  flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shrink-0 shadow-[0_4px_12px_rgba(59,130,246,0.25)]">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[8px] sm:text-[9px] font-extrabold text-blue-500 uppercase tracking-wider whitespace-nowrap">
                Ventas Totales
              </p>
              <p className="text-slate-800 text-lg sm:text-xl font-black leading-none mt-1.5 truncate">
                {formatTotal(stats.ventasTotales)}
              </p>
            </div>
          </div>
        </div>

        {/* Ticket Promedio */}
        <div className="bg-purple-50/70 border border-purple-100/80 rounded-2xl p-3 sm:p-4 w-full min-w-0 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-500 flex items-center justify-center text-white shrink-0 shadow-[0_4px_12px_rgba(139,92,246,0.25)]">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] sm:text-[10px] font-extrabold text-purple-500 uppercase tracking-wider whitespace-nowrap">
                Ticket Promedio
              </p>
              <p className="text-slate-800 text-lg sm:text-xl font-black leading-none mt-1.5 truncate">
                {formatTotal(stats.ticketPromedio)}
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block text-[9px] sm:text-[10px] font-bold text-purple-600 bg-purple-100 px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
            Por cliente
          </span>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col w-full shrink-0">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
          <div>
            <h2 className="font-bold text-slate-800 text-base">
              Directorio de Clientes
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isLoading
                ? "Cargando..."
                : `${customers.length} clientes registrados (${filtered.length} filtrados)`}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, cédula o teléfono..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-pizza-red focus:ring-1 focus:ring-pizza-red transition-all shadow-sm"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-pizza-red focus:ring-1 focus:ring-pizza-red transition-all cursor-pointer w-full sm:w-auto shadow-sm font-semibold"
            >
              <option value="name">Orden: Nombre</option>
              <option value="gasto-desc">Más gasto (desc)</option>
              <option value="gasto-asc">Menos gasto (asc)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm min-w-[860px] hidden lg:table">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  N°
                </th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Cédula
                </th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="text-right px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Órdenes
                </th>
                <th className="text-right px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Total Gastado
                </th>
                <th className="text-right px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Última Visita
                </th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
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
                paginated.map((customer, index) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="px-5 py-3 text-slate-400 text-xs font-bold">
                      {(safePage - 1) * PAGE_SIZE + index + 1}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {String(customer.name || "?")[0]?.toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-800">
                          {customer.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600 font-mono text-xs">
                      {customer.cedula || "—"}
                    </td>
                    <td className="px-5 py-3 text-slate-600 font-mono text-xs">
                      {customer.phone || "—"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="font-bold text-slate-700">
                        {customer.orders}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="font-bold text-emerald-600">
                        {formatTotal(customer.total)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-slate-500 text-xs">
                      {formatDate(customer.lastVisit)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(customer)}
                          className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 text-slate-400 hover:text-slate-800 transition-all p-1.5 rounded-lg hover:bg-slate-100"
                          title="Editar cliente"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {/* Vista Móvil: Cards */}
          <div className="lg:hidden flex flex-col gap-3 p-4">
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
              paginated.map((customer, index) => (
                <div
                  key={customer.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {String(customer.name || "?")[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-800 truncate">
                          {customer.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {customer.cedula || "Sin cédula"}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 whitespace-nowrap">
                      {formatTotal(customer.total)}
                    </span>
                  </div>

                  {/* Info */}
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

                  {/* Acción */}
                  <button
                    onClick={() => openEdit(customer)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all border border-slate-200"
                  >
                    <Pencil className="w-4 h-4" />
                    Editar Cliente
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pie de tabla: paginación */}
        {!isLoading && filtered.length > 0 && (
          <Pagination
            currentPage={safePage}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            itemName="cliente(s)"
          />
        )}
      </div>

      {/* Modal Crear / Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl animate-fade-in max-h-[90vh]">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white relative">
              <button
                onClick={closeModal}
                className="absolute right-4 top-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-slate-300 hover:text-white transition-all duration-300 hover:rotate-90"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="w-12 h-12 rounded-2xl bg-pizza-red/20 border border-pizza-red/30 flex items-center justify-center mb-3">
                {editingClient ? (
                  <Pencil className="w-6 h-6 text-red-300" />
                ) : (
                  <UserPlus className="w-6 h-6 text-red-300" />
                )}
              </div>
              <h2 className="text-xl font-bold">
                {editingClient ? "Editar Cliente" : "Registrar Cliente"}
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                {editingClient
                  ? "Modifica la información del cliente"
                  : "Completa la información del nuevo cliente"}
              </p>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto">
              <ClienteForm
                initial={editingClient}
                customers={customers}
                isSaving={isSaving}
                serverError={formError}
                onSave={handleSave}
                onCancel={closeModal}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
