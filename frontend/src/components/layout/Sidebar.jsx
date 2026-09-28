import { useApp } from "../../context/AppContext";
import { useBranches } from "../../hooks/useBranches";
import {
  LogOut,
  Pizza,
  LayoutDashboard,
  Users,
  ChefHat,
  FileText,
  Package,
  ShoppingBag,
  Truck,
  DollarSign,
  Menu,
  X,
  Archive,
  Building2,
  Store,
  MapPin,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Sidebar({ module, activeView, onNavigate }) {
  const { currentUser, logout } = useApp();
  const { data: branches = [] } = useBranches();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const currentBranch = branches.find(
    (b) =>
      b.id === currentUser?.id_sucursal ||
      b.id === currentUser?.sucursal ||
      Number(b.id) === Number(currentUser?.id_sucursal) ||
      Number(b.id) === Number(currentUser?.sucursal) ||
      String(b.name).toLowerCase() === String(currentUser?.sucursal).toLowerCase()
  ) || {
    name: currentUser?.sucursal || "Sucursal Desconocida",
    address: "Dirección no disponible",
  };

  const cashierLinks = [
    {
      id: "nueva-orden",
      name: "Nueva Orden",
      icon: <ShoppingBag className="w-5 h-5" />,
    },
    {
      id: "cola-trabajos",
      name: "Cola de Trabajos",
      icon: <ChefHat className="w-5 h-5" />,
    },
    { id: "entrega", name: "Entrega", icon: <Package className="w-5 h-5" /> },
    {
      id: "cierre",
      name: "Cierre",
      icon: <DollarSign className="w-5 h-5" />,
    },
  ];

  const adminLinks = [
    {
      id: "dashboard",
      name: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: "reportes",
      name: "Ventas y Reportes",
      icon: <FileText className="w-5 h-5" />,
    },
    {
      id: "sucursales",
      name: "Sucursales",
      icon: <Building2 className="w-5 h-5" />,
    },
    { id: "personal", name: "Personal", icon: <Users className="w-5 h-5" /> },
    { id: "clientes", name: "Clientes", icon: <Users className="w-5 h-5" /> },
    {
      id: "clientes-top",
      name: "Clientes Principales",
      icon: <Users className="w-5 h-5" />,
    },
    {
      id: "productos",
      name: "Productos",
      icon: <Package className="w-5 h-5" />,
    },
    {
      id: "cierres",
      name: "Cierres",
      icon: <Archive className="w-5 h-5" />,
    },
    {
      id: "tasa",
      name: "Tasa del Dólar",
      icon: <DollarSign className="w-5 h-5" />,
    },
  ];

  const deliveryCashierLinks = [
    {
      id: "caja-delivery",
      name: "Nueva Orden",
      icon: <ShoppingBag className="w-5 h-5" />,
    },
    {
      id: "delivery-cola",
      name: "Cola de Trabajos",
      icon: <ChefHat className="w-5 h-5" />,
    },
    { id: "entrega", name: "Entrega", icon: <Package className="w-5 h-5" /> },
    {
      id: "cierre-delivery",
      name: "Cierre Delivery",
      icon: <DollarSign className="w-5 h-5" />,
    },
  ];

  const links =
    module === "admin"
      ? adminLinks
      : module === "cashierdelivery"
        ? deliveryCashierLinks
        : cashierLinks;

  //para mostrar en movil.
  const showLabels = mobileOpen || !collapsed;

  const handleLogout = async () => {
    try {
      await axios.post(
        "http://localhost:3001/api/logout",
        {},
        { withCredentials: true },
      );
      logout();
      setMobileOpen(false);
      navigate("/");
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  };

  return (
    <>
      {/* Botón flotante para abrir sidebar en móvil */}
      <button
        type="button"
        aria-label="Abrir menú"
        onClick={() => setMobileOpen(true)}
        className={`lg:hidden fixed top-4 left-4 z-[70] inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all ${mobileOpen ? "hidden" : ""
          }`}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Overlay móvil */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60]"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`bg-white border-r border-slate-200 transition-all duration-300 flex flex-col fixed lg:relative inset-y-0 left-0 lg:inset-auto z-[65] h-full max-w-[85vw] shrink-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 w-72 ${collapsed ? "lg:w-20" : "lg:w-64"}`}
      >
        <div className="p-4 flex items-center gap-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pizza-red to-pizza-red-dark flex items-center justify-center shadow-md shrink-0">
            <Pizza className="w-5 h-5 text-white" />
          </div>
          {showLabels && (
            <div className="flex flex-col">
              <span className="font-bold text-slate-800 leading-tight text-lg tracking-tight">
                Pizzería
              </span>
              <span className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">
                {currentUser?.role === "cashierdelivery"
                  ? "Caja Delivery"
                  : currentUser?.role}
              </span>
            </div>
          )}
          {/* Cerrar en móvil */}
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setMobileOpen(false)}
            className="ml-auto lg:hidden p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
          {links.map((link) => {
            const isActive = activeView === link.id;
            return (
              <button
                key={link.id}
                onClick={() => {
                  onNavigate(link.id);
                  setMobileOpen(false);
                }}
                title={link.name}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all font-medium min-w-0 ${showLabels ? "justify-start" : "justify-center"} ${isActive
                    ? "bg-pizza-red text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-pizza-red"
                  }`}
              //title={collapsed ? link.name : ""}
              >
                <span className="shrink-0">{link.icon}</span>
                {showLabels && <span className="text-sm truncate">{link.name}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <div
            className={`flex flex-col gap-3 mb-4 ${showLabels ? "items-start" : "items-center"}`}
          >
            {showLabels && (
              <div className="flex flex-col w-full overflow-hidden min-w-0">
                <span className="text-sm font-semibold text-slate-800 truncate">
                  {currentUser?.name}
                </span>
                <span className="text-xs text-slate-500 truncate mb-3">
                  {currentUser?.email}
                </span>

                {/* Branch Info Box */}
                {(currentUser?.role === "cashier" ||
                  currentUser?.role === "cashierdelivery") && (
                    <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm mt-1">
                      <div className="w-8 h-8 bg-pizza-red/10 rounded-full flex items-center justify-center shrink-0">
                        <Store className="w-4 h-4 text-pizza-red" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-slate-700 truncate">
                          {currentBranch.name}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{currentBranch.address}</span>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className={`flex items-center gap-2 text-sm font-semibold w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all shadow-sm ${showLabels ? "" : "justify-center px-0"}`}
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4" />
            {showLabels && <span>Salir</span>}
          </button>
        </div>

        {/* Botón colapsar */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-6 bg-white border border-slate-200 rounded-full p-1 shadow-sm hover:shadow-md text-slate-400 hover:text-slate-600 transition-all z-30 items-center justify-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform ${collapsed ? "rotate-180" : ""}`}
          >
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
      </aside>
    </>
  );
}
