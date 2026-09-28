import { useState } from "react";
import { UserPlus, Search, ChevronDown } from "lucide-react";
import { useApp } from "../../context/AppContext";

const MOCK_CUSTOMERS = [
  {
    id: 1,
    cedula: "12345678",
    name: "Juan Pérez",
    phone: "0414-1234567",
    orders: 12,
    total: 284.5,
    lastVisit: "2026-07-17",
  },
  {
    id: 2,
    cedula: "V-23456789",
    name: "María González",
    phone: "0424-9876543",
    orders: 8,
    total: 198.0,
    lastVisit: "2026-07-16",
  },
  {
    id: 3,
    cedula: "E-34567890",
    name: "Carlos Ramírez",
    phone: "0416-5553210",
    orders: 22,
    total: 512.75,
    lastVisit: "2026-07-18",
  },
  {
    id: 4,
    cedula: "V-45678901",
    name: "Ana Soto",
    phone: "0412-7776543",
    orders: 5,
    total: 120.0,
    lastVisit: "2026-07-10",
  },
  {
    id: 5,
    cedula: "V-56789012",
    name: "Luis Herrera",
    phone: "0426-4441122",
    orders: 17,
    total: 390.3,
    lastVisit: "2026-07-14",
  },
];

export default function FastCustomerForm() {
  const [cedula, setCedula] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [saved, setSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [customers, setCustomers] = useState(MOCK_CUSTOMERS);
  const [isOpen, setIsOpen] = useState(true);

  const handleSearch = () => {
    if (!cedula) return;

    // Buscamos en el arreglo 'customers' que viene del contexto
    const found = customers.find(
      (c) => c.cedula.toLowerCase() === cedula.toLowerCase(),
    );

    if (found) {
      setNombre(found.name);
      setTelefono(found.phone || "");
      setIsEditing(true);
    } else {
      setNombre("");
      setTelefono("");
      setIsEditing(false);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!cedula || !nombre || !telefono) return;

    if (isEditing) {
      // Llamamos a la función del contexto en lugar de intentar hacer setCustomers local
      updateCustomer({ cedula, name: nombre, phone: telefono });
    } else {
      addCustomer({
        cedula,
        name: nombre,
        phone: telefono,
        orders: 0,
        total: 0,
        lastVisit: new Date().toISOString().split("T")[0],
      });
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-3 sm:p-4 bg-white border-b border-slate-100 shrink-0">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <UserPlus className="w-4 h-4 text-pizza-red" />
          Registro Express
        </h2>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-slate-500 hover:text-slate-700"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
        {saved && (
          <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            ¡Guardado!
          </span>
        )}
      </div>

      {isOpen && (
        <form onSubmit={handleSave} className="flex flex-col gap-2">
          {/* Fila 1: Buscador */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cédula"
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-pizza-red focus:ring-1 focus:ring-pizza-red"
              />
            </div>
            <button
              type="button"
              onClick={handleSearch}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-md text-sm font-medium transition-colors"
            >
              Buscar
            </button>
          </div>

          {/* Fila 2: Nombre */}
          <input
            type="text"
            placeholder="Nombre Completo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-pizza-red focus:ring-1 focus:ring-pizza-red"
            required
          />

          {/* Fila 3: Teléfono y botón Fijar */}
          <div className="flex gap-2">
            <input
              type="tel"
              placeholder="Teléfono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-pizza-red focus:ring-1 focus:ring-pizza-red"
              required
            />
            <button
              type="submit"
              className="bg-slate-800 hover:bg-slate-900 text-white px-4 rounded-lg text-sm font-bold transition-colors"
            >
              {isEditing ? "Actualizar" : "Guardar"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
