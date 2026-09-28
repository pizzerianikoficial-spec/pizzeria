// src/components/Header.jsx
import { useState, useEffect } from "react";
import { LogOut } from "lucide-react";
import { useApp } from "../../context/AppContext";

/**
 * Header — barra superior reutilizable para todas las pantallas del sistema.
 *
 * Props:
 *  - title    (string)   : Título principal de la pantalla.
 *  - children (ReactNode): Slot para indicadores/badges de estado de pedidos.
 *
 * Internamente gestiona:
 *  - Reloj en tiempo real (HH:MM) con formato es-ES.
 *  - Botón de Cerrar Sesión conectado al contexto useApp().
 */
export default function Header({ title, children }) {
const { logout } = useApp();
const [time, setTime] = useState(new Date());

  // Reloj dinámico actualizado cada segundo
useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
}, []);

const formattedTime = time.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
});

return (
    <header className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 sm:py-3.5 border-b border-pizza-gray-3 bg-white shrink-0">
      {/* Título */}
    <h1 className="text-pizza-dark font-bold text-lg sm:text-xl">
        {title}
    </h1>

      {/* Slot de indicadores + reloj + logout */}
    <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
        {/* {children} */}

        {/* Reloj */}
        <div className="text-pizza-muted text-sm font-mono tabular-nums">
        {formattedTime}
        </div>

        {/* Botón Salir */}
        <button
        onClick={logout}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all text-xs shadow-sm"
        title="Cerrar Sesión"
        >
        <LogOut className="w-3.5 h-3.5" />
        <span className="font-semibold">Salir</span>
        </button>
    </div>
    </header>
);
}