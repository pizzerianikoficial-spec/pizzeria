import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useBranches, useStaff } from "../../hooks/useBranches";
import axios from "axios";
import Pagination from "../ui/Pagination";
import {
  Users,
  Building2,
  UserPlus,
  Eye,
  EyeOff,
  X,
  Trash2,
  Pencil,
  UserCircle,
  UserCheck,
} from "lucide-react";

const ROLE_CONFIG = {
  cashier: {
    label: "Cajero",
    color: "bg-blue-500/20 text-blue-600 border-blue-500/30",
    bgCard: "bg-blue-50/70 border-blue-100/80",
    iconBg: "bg-blue-500",
    textColor: "text-blue-500",
  },
  chef: {
    label: "Cocinero",
    color: "bg-orange-500/20 text-orange-800 border-orange-500/30",
    bgCard: "bg-orange-50/70 border-orange-100/80",
    iconBg: "bg-orange-500",
    textColor: "text-orange-500",
  },
  mesero: {
    label: "Mesero",
    color: "bg-green-500/20 text-green-600 border-green-500/30",
    bgCard: "bg-emerald-50/70 border-emerald-100/80",
    iconBg: "bg-emerald-500",
    textColor: "text-emerald-500",
  },
  despachador: {
    label: "Despachador",
    color: "bg-yellow-500/20 text-amber-800 border-yellow-500/30",
    bgCard: "bg-amber-50/70 border-amber-100/80",
    iconBg: "bg-amber-500",
    textColor: "text-amber-500",
  },
  cashierdelivery: {
    label: "Caja Delivery",
    color: "bg-blue-500/20 text-blue-600 border-blue-500/30",
    bgCard: "bg-blue-50/70 border-blue-100/80",
    iconBg: "bg-blue-500",
    textColor: "text-blue-500",
  },
};

const ROLES = ["cashier", "chef", "mesero", "despachador", "cashierdelivery"];
const EMPTY_ARRAY = [];

export default function StaffManagement() {
  const { data: branches, isLoading: branchesLoading } = useBranches();
  const { data: staff, isLoading: staffLoading } = useStaff();
  const queryClient = useQueryClient();

  const [searchBranch, setSearchBranch] = useState("");
  const [searchRole, setSearchRole] = useState("");

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "cashier",
    branchId: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState(null);

  // Derived state
  const safeStaff = staff || EMPTY_ARRAY;
  const safeBranches = branches || EMPTY_ARRAY;

  const filteredStaff = useMemo(() => {
    let result = safeStaff;
    if (searchBranch) {
      result = result.filter(
        (s) => String(s.branchId) === String(searchBranch),
      );
    }
    if (searchRole) {
      result = result.filter((s) => s.role === searchRole);
    }
    return result;
  }, [safeStaff, searchBranch, searchRole]);

  // Paginación (10 elementos por página)
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchBranch, searchRole]);

  const totalPages = Math.max(1, Math.ceil(filteredStaff.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedStaff = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredStaff.slice(start, start + PAGE_SIZE);
  }, [filteredStaff, safePage]);

  const metrics = useMemo(() => {
    const counts = {
      cashier: 0,
      chef: 0,
      mesero: 0,
      despachador: 0,
      cashierdelivery: 0,
    };
    // Only count active users in metrics
    safeStaff
      .filter((s) => s.estado === "Activo")
      .forEach((s) => {
        if (counts[s.role] !== undefined) counts[s.role]++;
      });
    return counts;
  }, [safeStaff]);

  const getBranchName = (branchId) => {
    const b = safeBranches.find((b) => String(b.id) === String(branchId));
    return b ? b.name : "Sucursal Desconocida";
  };

  const openAddModal = () => {
    setEditingId(null);
    setForm({
      name: "",
      email: "",
      role: "cashier",
      branchId: safeBranches.length > 0 ? safeBranches[0].id : "",
      password: "",
    });
    setError("");
    setShowPassword(false);
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditingId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
      password: "", // Empty for security, only typed if they want to change it
    });
    setError("");
    setShowPassword(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setError("");
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.branchId) {
      setError("Nombre, email y sucursal son obligatorios.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError("Por favor, ingresa un correo electrónico válido.");
      return;
    }

    if (!editingId && form.password.trim().length < 6) {
      setError(
        "La contraseña es obligatoria para nuevos usuarios y debe tener al menos 6 caracteres.",
      );
      return;
    }

    if (
      editingId &&
      form.password.trim() !== "" &&
      form.password.trim().length < 6
    ) {
      setError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      let response;
      if (editingId) {
        response = await axios.put(
          `http://localhost:3001/api/actualizar-usuario/${editingId}`,
          {
            nombre_completo: form.name,
            email: form.email,
            rol: form.role,
            id_sucursal: form.branchId,
            password: form.password,
          },
          { withCredentials: true },
        );
      } else {
        response = await axios.post(
          "http://localhost:3001/api/registrar-usuario",
          {
            nombre_completo: form.name,
            email: form.email,
            password: form.password,
            id_sucursal: form.branchId,
            rol: form.role,
          },
          { withCredentials: true },
        );
      }

      if (response.data.success) {
        queryClient.invalidateQueries({ queryKey: ["staff"] });
        closeModal();
        if (window.Toast) {
          window.Toast.fire({
            icon: "success",
            title: editingId
              ? "¡Empleado actualizado exitosamente!"
              : "¡Empleado registrado exitosamente!",
          });
        }
      }
    } catch (err) {
      console.error("Error al guardar empleado:", err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Ocurrió un error al intentar guardar el empleado.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    if (window.confirmDelete) {
      window.confirmDelete(async () => {
        setIsDeletingId(id);
        try {
          const response = await axios.put(
            `http://localhost:3001/api/eliminar-usuario/${id}`,
            {},
            { withCredentials: true },
          );

          if (response.data.success) {
            queryClient.invalidateQueries({ queryKey: ["staff"] });
            if (window.Toast) {
              window.Toast.fire({
                icon: "success",
                title: "¡Empleado inactivado exitosamente!",
              });
            }
          }
        } catch (error) {
          console.error("Error al inactivar empleado:", error);
          if (window.Toast) {
            window.Toast.fire({
              icon: "error",
              title: "Error al intentar inactivar el empleado",
            });
          }
        } finally {
          setIsDeletingId(null);
        }
      });
    } else {
      if (window.confirm("¿Seguro que deseas eliminar este empleado?")) {
        setIsDeletingId(id);
        axios
          .put(
            `http://localhost:3001/api/eliminar-usuario/${id}`,
            {},
            { withCredentials: true },
          )
          .then((res) => {
            if (res.data.success) {
              queryClient.invalidateQueries({ queryKey: ["staff"] });
            }
          })
          .finally(() => setIsDeletingId(null));
      }
    }
  };

  const handleActivate = async (id) => {
    try {
      const response = await axios.put(
        `http://localhost:3001/api/activar-usuario/${id}`,
        {},
        { withCredentials: true },
      );
      if (response.data.success) {
        queryClient.invalidateQueries({ queryKey: ["staff"] });
        if (window.Toast) {
          window.Toast.fire({
            icon: "success",
            title: "¡Empleado activado exitosamente!",
          });
        }
      }
    } catch (error) {
      console.error("Error al activar empleado:", error);
      if (window.Toast) {
        window.Toast.fire({
          icon: "error",
          title: "Error al intentar activar el empleado",
        });
      }
    }
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-slate-50 p-4 sm:p-6 pb-16 flex flex-col gap-4 sm:gap-6 animate-in fade-in duration-300">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-pizza-red/10 rounded-2xl flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-pizza-red" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
              Gestión de Personal
            </h1>
            <p className="text-xs font-semibold text-slate-400 mt-1.5">
              Administra los usuarios del sistema
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={openAddModal}
            className="flex flex-1 sm:flex-none items-center justify-center gap-1.5 bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all shrink-0 active:scale-[0.98] cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nuevo Empleado</span>
          </button>
        </div>
      </header>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 shrink-0">
        {ROLES.map((r) => {
          const cfg = ROLE_CONFIG[r];
          return (
            <div
              key={r}
              className={`${cfg.bgCard} border rounded-2xl p-3 sm:p-4 flex w-full min-w-0 items-center justify-between shadow-sm hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${cfg.iconBg} flex items-center justify-center text-white shrink-0 shadow-lg`}
                >
                  <UserCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-[8px] sm:text-[9px] font-extrabold ${cfg.textColor} uppercase tracking-wider whitespace-nowrap`}
                  >
                    {cfg.label}s
                  </p>
                  <p className="text-slate-800 text-2xl font-black leading-none mt-1">
                    {staffLoading ? "—" : metrics[r]}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabla y Filtros */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col w-full shrink-0">
        <div className="px-4 sm:px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            <h3 className="font-extrabold text-slate-800 text-base">
              Directorio de Empleados
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Lista completa del personal asignado a sucursales
            </p>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Filtro por Sucursal */}
            <div className="relative flex-1 lg:flex-none">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Building2 className="w-4 h-4" />
              </span>
              <select
                value={searchBranch}
                onChange={(e) => setSearchBranch(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pl-9 pr-8 py-2 text-sm focus:outline-none focus:border-pizza-red focus:ring-1 focus:ring-pizza-red transition-all shadow-sm w-full lg:w-48 appearance-none"
              >
                <option value="">Todas las Sucursales</option>
                {safeBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Rol */}
            <div className="relative flex-1 lg:flex-none">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Users className="w-4 h-4" />
              </span>
              <select
                value={searchRole}
                onChange={(e) => setSearchRole(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pl-9 pr-8 py-2 text-sm focus:outline-none focus:border-pizza-red focus:ring-1 focus:ring-pizza-red transition-all shadow-sm w-full lg:w-48 appearance-none"
              >
                <option value="">Todos los Roles</option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_CONFIG[r].label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="hidden lg:block overflow-x-auto w-full">
          <table className="w-full text-sm min-w-[860px] hidden lg:table">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 font-bold text-xs uppercase tracking-wider text-left sticky top-0 animate-fade-in z-10">
                <th className="px-5 py-3.5">N°</th>
                <th className="px-5 py-3.5">Empleado</th>
                <th className="px-5 py-3.5">Rol</th>
                <th className="px-5 py-3.5">Sucursal Asignada</th>
                <th className="px-5 py-3.5">Estado</th>
                <th className="px-5 py-3.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {staffLoading || branchesLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <div className="w-8 h-8 rounded-full border-4 border-pizza-red/20 border-t-pizza-red animate-spin mx-auto mb-2"></div>
                    <p className="font-medium">Cargando personal...</p>
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium">
                      No se encontraron empleados para los filtros seleccionados
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedStaff.map((user, index) => {
                  const cfg = ROLE_CONFIG[user.role] || {
                    label: user.role,
                    color: "bg-slate-100 text-slate-600 border-slate-200",
                  };
                  const isActive = user.estado === "Activo";
                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-50/50 transition-colors group ${!isActive ? "opacity-60" : ""}`}
                    >
                      <td className="px-5 py-3.5 text-slate-400 text-xs font-bold">
                        {(safePage - 1) * PAGE_SIZE + index + 1}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${
                              isActive
                                ? "bg-slate-100 border-slate-200 text-slate-600"
                                : "bg-slate-50 border-slate-100 text-slate-400"
                            }`}
                          >
                            {user.name?.charAt(0) || "U"}
                          </div>
                          <div>
                            <p
                              className={`font-bold ${isActive ? "text-slate-800" : "text-slate-400 line-through"}`}
                            >
                              {user.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.color} ${!isActive ? "opacity-50" : ""}`}
                        >
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          {getBranchName(user.branchId)}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                            isActive
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                              : "bg-red-50 text-red-500 border-red-200"
                          }`}
                        >
                          {isActive ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {isActive ? (
                            <>
                              <button
                                onClick={() => openEditModal(user)}
                                className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-all opacity-0 group-hover:opacity-100 duration-150"
                                title="Editar Empleado"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(user.id)}
                                disabled={isDeletingId === user.id}
                                className={`p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 duration-150 ${
                                  isDeletingId === user.id
                                    ? "text-slate-400 cursor-not-allowed"
                                    : "text-slate-400 hover:text-pizza-red hover:bg-red-50"
                                }`}
                                title="Inactivar Empleado"
                              >
                                <Trash2
                                  className={`w-4 h-4 ${isDeletingId === user.id ? "animate-pulse" : ""}`}
                                />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleActivate(user.id)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 duration-150"
                              title="Reactivar Empleado"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          )}
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
        <div className="lg:hidden flex flex-col gap-3 p-4">
          {staffLoading || branchesLoading ? (
            <div className="text-center py-12 text-slate-400">
              <div className="w-8 h-8 rounded-full border-4 border-pizza-red/20 border-t-pizza-red animate-spin mx-auto mb-2"></div>
              <p className="font-medium">Cargando personal...</p>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="font-medium">
                No se encontraron empleados para los filtros seleccionados
              </p>
            </div>
          ) : (
            paginatedStaff.map((user) => {
              const cfg = ROLE_CONFIG[user.role] || {
                label: user.role,
                color: "bg-slate-100 text-slate-600 border-slate-200",
              };
              const isActive = user.estado === "Activo";
              return (
                <div
                  key={user.id}
                  className={`bg-white border border-slate-200 rounded-2xl p-4 shadow-sm ${!isActive ? "opacity-60" : ""}`}
                >
                  {/* Header de la card */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-full border flex items-center justify-center text-sm font-bold shrink-0 ${
                          isActive
                            ? "bg-slate-100 border-slate-200 text-slate-600"
                            : "bg-slate-50 border-slate-100 text-slate-400"
                        }`}
                      >
                        {user.name?.charAt(0) || "U"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`font-bold text-slate-800 truncate ${!isActive ? "line-through text-slate-400" : ""}`}
                        >
                          {user.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${
                        isActive
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                          : "bg-red-50 text-red-500 border-red-200"
                      }`}
                    >
                      {isActive ? "Activo" : "Inactivo"}
                    </span>
                  </div>

                  {/* Info de Rol y Sucursal */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider w-16 shrink-0">
                        Rol:
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.color} ${!isActive ? "opacity-50" : ""}`}
                      >
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 min-w-0">
                        <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {getBranchName(user.branchId)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                    {isActive ? (
                      <>
                        <button
                          onClick={() => openEditModal(user)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
                        >
                          <Pencil className="w-4 h-4" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={isDeletingId === user.id}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all ${
                            isDeletingId === user.id
                              ? "text-slate-400 cursor-not-allowed bg-slate-50"
                              : "text-red-600 hover:text-red-700 hover:bg-red-50"
                          }`}
                        >
                          <Trash2
                            className={`w-4 h-4 ${isDeletingId === user.id ? "animate-pulse" : ""}`}
                          />
                          {isDeletingId === user.id
                            ? "Eliminando..."
                            : "Inactivar"}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleActivate(user.id)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all"
                      >
                        <UserCheck className="w-4 h-4" />
                        Reactivar Empleado
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
        {!staffLoading && !branchesLoading && filteredStaff.length > 0 && (
          <Pagination
            currentPage={safePage}
            totalItems={filteredStaff.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
            itemName="empleado(s)"
          />
        )}
      </div>

      {/* Modal de Creación / Edición */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4">
          <div
            className="w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-fade-in flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Oscuro */}
            <div className="bg-[#1e2330] p-6 relative">
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-12 h-12 bg-pizza-red/20 rounded-xl flex items-center justify-center mb-4 border border-pizza-red/30">
                <Users className="w-6 h-6 text-pizza-red" />
              </div>

              <h3 className="text-2xl font-bold text-white mb-1">
                {editingId ? "Editar Empleado" : "Nuevo Empleado"}
              </h3>
              <p className="text-slate-400 text-sm">
                {editingId
                  ? "Modifica los datos del usuario en el sistema"
                  : "Registra un nuevo usuario en el sistema"}
              </p>
            </div>

            {/* Cuerpo del Modal */}
            <div className="bg-white p-6 flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
              {/* Campo Nombre */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                  Nombre Completo <span className="text-pizza-red">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, name: e.target.value }));
                    setError("");
                  }}
                  className={`w-full bg-white border ${
                    error &&
                    (error.includes("Nombre") || error.includes("nombre"))
                      ? "border-pizza-red"
                      : "border-slate-200 focus:border-pizza-red"
                  } text-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-pizza-red transition-all shadow-sm`}
                  placeholder="Ej. Juan Pérez"
                  autoFocus
                />
              </div>

              {/* Campo Email */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                  Email <span className="text-pizza-red">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, email: e.target.value }));
                    setError("");
                  }}
                  className={`w-full bg-white border ${
                    error &&
                    (error.includes("email") || error.includes("correo"))
                      ? "border-pizza-red"
                      : "border-slate-200 focus:border-pizza-red"
                  } text-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-pizza-red transition-all shadow-sm`}
                  placeholder="correo@pizzeria.com"
                />
              </div>

              {/* Campo Contraseña */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                  Contraseña{" "}
                  {editingId ? (
                    "(Opcional)"
                  ) : (
                    <span className="text-pizza-red">*</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, password: e.target.value }));
                      setError("");
                    }}
                    className={`w-full bg-white border ${
                      error && error.includes("contraseña")
                        ? "border-pizza-red"
                        : "border-slate-200 focus:border-pizza-red"
                    } text-slate-800 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-pizza-red transition-all shadow-sm`}
                    placeholder={
                      editingId
                        ? "Dejar en blanco para mantener actual"
                        : "Mínimo 6 caracteres"
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Selector de Sucursal */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                  Sucursal Asignada <span className="text-pizza-red">*</span>
                </label>
                <select
                  value={form.branchId}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, branchId: e.target.value }));
                    setError("");
                  }}
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pizza-red focus:ring-1 focus:ring-pizza-red transition-all shadow-sm"
                >
                  <option value="" disabled>
                    Selecciona una sucursal
                  </option>
                  {safeBranches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector de Rol */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                  Rol <span className="text-pizza-red">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((r) => {
                    const cfg = ROLE_CONFIG[r];
                    return (
                      <button
                        key={r}
                        onClick={() => setForm((p) => ({ ...p, role: r }))}
                        className={`py-2 rounded-xl border text-xs font-bold transition-all shadow-sm ${
                          form.role === r
                            ? `${cfg.color} border-current`
                            : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold border border-red-100 animate-shake">
                  {error}
                </div>
              )}

              <div className="flex gap-3 mt-2">
                <button
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold transition-all disabled:opacity-50 shadow-sm"
                >
                  Cerrar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-70 flex items-center justify-center gap-2 shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
