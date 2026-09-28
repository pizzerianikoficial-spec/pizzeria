import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useBranches } from "../../hooks/useBranches";
import { Plus, Building2, MapPin, X, Pencil, Trash2 } from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";

export default function Sucursales() {
  const { data: branches, isLoading } = useBranches();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBranch, setNewBranch] = useState({ name: "", address: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const handleSubmit = async () => {
    if (!newBranch.name.trim()) {
      setError("El nombre de la sucursal es obligatorio.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      let response;
      if (editingId) {
        response = await axios.put(
          `http://localhost:3001/api/actualizar-sucursal/${editingId}`,
          {
            name: newBranch.name,
            direccion: newBranch.address,
          },
          { withCredentials: true }
        );
      } else {
        response = await axios.post(
          "http://localhost:3001/api/registrar-sucursal",
          {
            name: newBranch.name,
            direccion: newBranch.address,
          },
          { withCredentials: true }
        );
      }

      if (response.data.success) {
        queryClient.invalidateQueries({ queryKey: ["branches"] });
        closeModal();
        if (window.Toast) {
          window.Toast.fire({
            icon: "success",
            title: editingId ? "¡Sucursal actualizada exitosamente!" : "¡Sucursal registrada exitosamente!",
          });
        }
      }
    } catch (err) {
      console.error("Error al guardar sucursal:", err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Ocurrió un error al intentar guardar la sucursal.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setNewBranch({ name: "", address: "" });
    setError("");
    setShowAddModal(true);
  };

  const openEditModal = (branch) => {
    setEditingId(branch.id);
    setNewBranch({ name: branch.name, address: branch.address || "" });
    setError("");
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingId(null);
    setNewBranch({ name: "", address: "" });
    setError("");
  };

  const handleDelete = async (e, branch) => {
    e.stopPropagation();
    if (deletingId === branch.id) return;

    const result = await Swal.fire({
      title: "¿Eliminar sucursal?",
      text: `¿Estás seguro de que deseas eliminar "${branch.name}"? Esta acción no se puede deshacer.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EA2A33",
      cancelButtonColor: "#94A3B8",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      background: "#ffffff",
      customClass: {
        popup: "rounded-2xl font-sans shadow-xl border border-slate-100",
        title: "text-base font-black text-slate-800",
        confirmButton: "px-5 py-2.5 font-bold rounded-xl text-sm",
        cancelButton: "px-5 py-2.5 font-bold rounded-xl text-sm",
      },
    });

    if (!result.isConfirmed) return;

    setDeletingId(branch.id);
    try {
      const response = await axios.delete(
        `http://localhost:3001/api/eliminar-sucursal/${branch.id}`,
        { withCredentials: true }
      );
      if (response.data.success) {
        queryClient.invalidateQueries({ queryKey: ["branches"] });
        if (window.Toast) {
          window.Toast.fire({
            icon: "success",
            title: "¡Sucursal eliminada exitosamente!",
          });
        }
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Ocurrió un error al intentar eliminar la sucursal.";
      if (window.Toast) {
        window.Toast.fire({ icon: "error", title: msg });
      } else {
        alert(msg);
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 overflow-y-auto h-full bg-slate-50 hide-scrollbar">
      {/* Encabezado */}
      <header className="bg-white border border-slate-200/60 rounded-xl sm:rounded-2xl px-4 py-3 sm:px-5 sm:py-4 md:px-6 md:py-5 flex flex-wrap lg:flex-nowrap gap-3 sm:gap-4 justify-between items-center shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-pizza-red/10 rounded-xl flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-pizza-red" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
              Sucursales
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5 capitalize">
              {new Date().toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 w-full lg:w-auto justify-between lg:justify-end">
          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-semibold transition-all shadow-sm w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" /> Nueva Sucursal
          </button>
        </div>
      </header>

      {/* Grid de Tarjetas */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pizza-red"></div>
        </div>
      ) : branches && branches.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
          {branches.map((branch) => (
            <div
              key={branch.id}
              onClick={() => openEditModal(branch)}
              className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center justify-center relative overflow-visible group cursor-pointer border border-slate-100 min-h-[220px]"
            >
              {/* Fondo decorativo al hacer hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0 rounded-3xl"></div>
              
              {/* Botón de eliminar — pequeño y circular, arriba de la tarjeta */}
              <button
                onClick={(e) => handleDelete(e, branch)}
                disabled={deletingId === branch.id || branch.userCount > 0}
                title={
                  branch.userCount > 0
                    ? `No se puede eliminar: tiene ${branch.userCount} usuario(s) asignado(s)`
                    : "Eliminar sucursal"
                }
                className={`absolute -top-3 -right-3 w-7 h-7 rounded-full flex items-center justify-center shadow-md border-2 border-white transition-all duration-200 z-20
                  ${
                    branch.userCount > 0
                      ? "bg-slate-300 text-slate-400 cursor-not-allowed"
                      : "bg-red-500 hover:bg-red-600 text-white cursor-pointer hover:scale-110"
                  }
                `}
              >
                {deletingId === branch.id ? (
                  <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3" />
                )}
              </button>

              {/* Elementos con z-10 para estar por encima del fondo decorativo */}
              <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-5 group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-300 z-10 group-hover:scale-110">
                <Building2 className="w-8 h-8 text-slate-800 group-hover:text-white transition-colors duration-300" />
              </div>
              
              <h3 className="text-xl font-black text-slate-800 mb-2 w-full px-2 group-hover:text-white transition-colors duration-300">
                {branch.name}
              </h3>
              
              <div className="flex items-center justify-center gap-1.5 text-slate-500 text-sm w-full px-2 group-hover:text-white/80 transition-colors duration-300">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="truncate font-medium">
                  {branch.address || "Sin dirección"}
                </span>
              </div>

              {/* Indicador de usuarios */}
              {branch.userCount > 0 && (
                <div className="mt-3 z-10 flex items-center gap-1 bg-slate-100 group-hover:bg-white/10 px-2.5 py-1 rounded-full transition-colors duration-300">
                  <span className="text-xs font-semibold text-slate-500 group-hover:text-white/70 transition-colors duration-300">
                    {branch.userCount} usuario{branch.userCount !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
              
              {/* Botón flotante decorativo para editar */}
              <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-50 opacity-0 group-hover:opacity-20 flex items-center justify-center transition-all duration-300 z-10 scale-50 group-hover:scale-100">
                <Pencil className="w-4 h-4 text-white" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-2xl shadow-sm text-slate-400 gap-3">
          <Building2 className="w-12 h-12 opacity-20" />
          <p className="font-semibold text-lg">No hay sucursales registradas</p>
          <p className="text-sm">Agrega tu primera sucursal para comenzar.</p>
        </div>
      )}

      {/* Modal de Creación / Edición */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={closeModal}>
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
                <Building2 className="w-6 h-6 text-pizza-red" />
              </div>

              <h3 className="text-2xl font-bold text-white mb-1">
                {editingId ? "Editar Sucursal" : "Nueva Sucursal"}
              </h3>
              <p className="text-slate-400 text-sm">
                {editingId ? "Modifica los datos de la ubicación" : "Registra una nueva ubicación para la pizzería"}
              </p>
            </div>

            {/* Cuerpo del Modal */}
            <div className="bg-white p-6 flex flex-col gap-5">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                  Nombre de la Sucursal <span className="text-pizza-red">*</span>
                </label>
                <input
                  type="text"
                  value={newBranch.name}
                  onChange={(e) => {
                    setNewBranch((p) => ({ ...p, name: e.target.value }));
                    setError("");
                  }}
                  className={`w-full bg-white border ${
                    error && error.includes("nombre")
                      ? "border-pizza-red focus:ring-pizza-red"
                      : "border-slate-200 focus:border-pizza-red focus:ring-pizza-red"
                  } text-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-all shadow-sm`}
                  placeholder="Ej. Sucursal Central"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                  Dirección (Opcional)
                </label>
                <textarea
                  value={newBranch.address}
                  onChange={(e) =>
                    setNewBranch((p) => ({ ...p, address: e.target.value }))
                  }
                  className="w-full bg-white border border-slate-200 focus:border-pizza-red focus:ring-pizza-red text-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-all resize-none shadow-sm"
                  placeholder="Ej. Av. Principal 123"
                  rows="3"
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100">
                  {error}
                </div>
              )}

              <div className="flex gap-3 mt-2">
                <button
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold transition-all disabled:opacity-50 shadow-sm"
                >
                  Cerrar Ventana
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
                    "Guardar Sucursal"
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
