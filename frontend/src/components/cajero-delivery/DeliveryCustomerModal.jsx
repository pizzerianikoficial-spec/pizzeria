import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useApp } from "../../context/AppContext";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Search,
  UserPlus,
  Phone,
  User,
  IdCard,
  CheckCircle2,
} from "lucide-react";

export default function DeliveryCustomerModal({
  onConfirm,
  onClose,
  pendingProduct,
}) {
  const { setOrderType, addCustomer } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [foundCustomer, setFoundCustomer] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [showAliasPrompt, setShowAliasPrompt] = useState(false);
  const [wantsAlias, setWantsAlias] = useState(null);
  const [alias, setAlias] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const searchRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => searchRef.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, []);

  const handleSearch = async () => {
    if (isSearchingCustomer) return;
    const q = searchQuery.trim();
    if (!q) return;

    setIsSearchingCustomer(true);
    try {
      const { data } = await axios.post(
        "http://localhost:3001/api/buscar-o-registrar-cliente-delivery",
        { phoneLastDigits: q },
        { withCredentials: true }
      );

      if (data.success && data.cliente) {
        setFoundCustomer({ ...data.cliente, isDeliveryNew: data.created });
        setNotFound(false);
        setShowAliasPrompt(Boolean(data.created));
        setWantsAlias(null);
        setAlias("");
      } else {
        setFoundCustomer(null);
        setNotFound(true);
      }
    } catch (error) {
      console.error("Error en la búsqueda del cliente delivery:", error);
      setFoundCustomer(null);
      setNotFound(true);
    } finally {
      setIsSearchingCustomer(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setFoundCustomer(null);
    setNotFound(false);
    setShowAliasPrompt(false);
    setWantsAlias(null);
    setAlias("");
    setNewName("");
    setNewPhone("");
    searchRef.current?.focus();
  };

  const selectedCustomer =
    foundCustomer ||
    (notFound && newName.trim()
      ? {
          id: null,
          name: newName.trim(),
          phone: newPhone.trim() || searchQuery.trim(),
          cedula: "V-00000000",
          isNew: true,
        }
      : null);

  const isValid = Boolean(selectedCustomer);

  const handleConfirm = async () => {
    if (!isValid || isSaving) return;
    setIsSaving(true);

    try {
      let finalCustomer = selectedCustomer;

      // Si es un cliente nuevo delivery con alias
      if (selectedCustomer?.isDeliveryNew && alias.trim()) {
        try {
          const { data } = await axios.put(
            `http://localhost:3001/api/clientes/${selectedCustomer.id}/alias`,
            { name: alias.trim() },
            { withCredentials: true }
          );
          if (data.success && data.cliente) {
            finalCustomer = {
              ...selectedCustomer,
              ...data.cliente,
            };
          }
        } catch (error) {
          console.error("Error guardando el alias del cliente:", error);
        }
      }

      // Si es nuevo cliente creado manualmente
      if (selectedCustomer?.isNew) {
        try {
          const { data } = await axios.post(
            "http://localhost:3001/api/registrar-clientes",
            {
              cedula: selectedCustomer.cedula,
              name: selectedCustomer.name,
              phone: selectedCustomer.phone,
            },
            { withCredentials: true }
          );

          if (data.success && data.cliente) {
            finalCustomer = data.cliente;
            addCustomer({
              ...data.cliente,
              lastVisit: new Date().toISOString().split("T")[0],
            });
          }
        } catch (error) {
          console.error("Error registrando al nuevo cliente:", error);
        }
      }

      setOrderType(
        "delivery",
        null,
        0,
        finalCustomer
          ? {
              id: finalCustomer.id || finalCustomer.id_cliente,
              name: finalCustomer.name || finalCustomer.nombre,
              cedula: finalCustomer.cedula,
              phone: finalCustomer.phone || finalCustomer.telefono || searchQuery.trim(),
            }
          : null,
        searchQuery.trim() || finalCustomer?.phone || null,
        null
      );

      onConfirm?.();
    } catch (error) {
      console.error("Error al confirmar cliente:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div className="min-h-full flex items-center justify-center p-4 py-8">
        <div
          className="bg-white w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header idéntico a la caja principal */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-4 sm:px-6 sm:py-5 rounded-t-2xl sm:rounded-t-3xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-white font-extrabold text-xl tracking-tight">
                  Datos del cliente
                </h2>
                <p className="text-slate-300 text-sm mt-0.5">
                  Asocia o registra al cliente
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progreso de Pasos idéntico */}
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 flex-1">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-emerald-400 text-white">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-white/70">
                  Tipo de Pedido
                </span>
                <div className="h-0.5 flex-1 rounded bg-emerald-400" />
              </div>
              <div className="flex items-center gap-1.5 flex-1">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-white text-slate-800">
                  2
                </div>
                <span className="text-xs font-semibold text-white">
                  Cliente
                </span>
              </div>
            </div>
          </div>

          {/* Cuerpo */}
          <div className="p-4 sm:p-6 flex flex-col gap-4 animate-fade-in flex-1">
            {/* Buscador */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <IdCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchRef}
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="4 últimos dígitos del teléfono del cliente..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value.replace(/\D/g, "").slice(0, 4));
                    setFoundCustomer(null);
                    setNotFound(false);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full pl-9 pr-3 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pizza-red focus:ring-2 focus:ring-pizza-red/20 transition-all font-medium"
                />
              </div>
              <button
                type="button"
                onClick={handleSearch}
                disabled={isSearchingCustomer || searchQuery.length !== 4}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm flex items-center gap-1.5 transition-colors"
              >
                <Search className="w-4 h-4" />
                {isSearchingCustomer ? "Buscando..." : "Buscar"}
              </button>
            </div>

            {/* Cliente Encontrado */}
            {foundCustomer && (
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 flex items-center gap-3 animate-fade-in">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 truncate">
                    {foundCustomer.name || foundCustomer.nombre}
                  </p>
                  <p className="text-xs text-slate-500">
                    {foundCustomer.cedula || foundCustomer.phone || foundCustomer.telefono} ·{" "}
                    {foundCustomer.orders || 0} pedidos
                  </p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <button
                  type="button"
                  onClick={clearSearch}
                  className="text-slate-400 hover:text-slate-600 ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Prompt de Alias si es nuevo delivery */}
            {showAliasPrompt && foundCustomer?.isDeliveryNew && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 flex flex-col gap-3 animate-fade-in">
                <span className="text-sm font-bold text-blue-700">
                  ¿Desea agregarle un nombre o alias?
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setWantsAlias(true)}
                    className={`flex-1 py-2 rounded-xl border font-semibold text-sm transition-colors ${
                      wantsAlias === true
                        ? "bg-blue-500 border-blue-500 text-white"
                        : "bg-white border-blue-200 text-blue-700 hover:border-blue-400"
                    }`}
                  >
                    Sí
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWantsAlias(false);
                      setAlias("");
                    }}
                    className={`flex-1 py-2 rounded-xl border font-semibold text-sm transition-colors ${
                      wantsAlias === false
                        ? "bg-slate-700 border-slate-700 text-white"
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-400"
                    }`}
                  >
                    No
                  </button>
                </div>
                {wantsAlias === true && (
                  <input
                    type="text"
                    placeholder="Nombre o alias del cliente"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-blue-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    autoFocus
                  />
                )}
              </div>
            )}

            {/* Cliente No Encontrado → Formulario de Registro rápido */}
            {notFound && !foundCustomer && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 flex flex-col gap-3 animate-fade-in">
                <div className="flex items-center gap-2 text-blue-700">
                  <UserPlus className="w-4 h-4" />
                  <span className="text-sm font-bold">
                    Cliente nuevo — completa los datos
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <div className="relative">
                    <User className="w-4 h-4 text-blue-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Nombre completo *"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-blue-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      autoFocus
                    />
                  </div>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-blue-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      placeholder="Teléfono (opcional)"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-blue-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Opción rápida: seguir sin cliente */}
            {!foundCustomer && !notFound && (
              <button
                type="button"
                onClick={() => {
                  setFoundCustomer({
                    id: null,
                    name: "Consumidor Final",
                    cedula: "V-00000000",
                  });
                  setNotFound(false);
                }}
                className="text-xs text-slate-400 hover:text-slate-600 underline text-center transition-colors mt-2"
              >
                Asociar como Consumidor Final
              </button>
            )}
          </div>

          {/* Footer de Navegación idéntico */}
          <div className="px-4 pb-4 sm:px-6 sm:pb-6 pt-2 flex gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3.5 rounded-2xl font-bold text-sm flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Atrás
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={!isValid || isSaving}
              className={`flex-1 py-3.5 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200 ${
                isValid && !isSaving
                  ? "bg-slate-800 hover:bg-slate-900 text-white shadow-md hover:shadow-lg active:scale-[0.98]"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              {isSaving ? "Guardando..." : "Confirmar y Continuar"}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
