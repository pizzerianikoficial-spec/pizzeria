import { Pizza, CupSoda, Sandwich, Star, IceCreamBowl } from "lucide-react";
import { useContadorCajero } from "../../hooks/useContadorCajero.js";

export default function CategoryFilter({ selected, onSelect }) {
  const { data: pedidosPendientes = 0, isLoading } = useContadorCajero();

  const categories = [
    { id: "Normal", name: "Normal", icon: <Pizza className="w-4 h-4" /> },
    { id: "Familiar", name: "Familiar", icon: <Pizza className="w-6 h-4" /> },
    { id: "bebidas", name: "Bebidas", icon: <CupSoda className="w-4 h-4" /> },
    {
      id: "Gigantes",
      name: "Gigantes",
      icon: <Pizza className="w-4 h-4" />,
    },
    {
      id: "combos",
      name: "Combos",
      icon: <Pizza className="w-4 h-4" />,
    },
    {
      id: "Helados",
      name: "Helados",
      icon: <IceCreamBowl className="w-4 h-4" />,
      mostrarContador: true,
    },
  ];

  return (
    <div className="flex gap-1.5 sm:gap-2 items-center overflow-x-auto pb-1 hide-scrollbar w-full lg:w-auto">
      {categories.map((cat) => {
        const isSelected = selected === cat.id;

        return (
          <div key={cat.id} className="flex items-center gap-2">
            <button
              onClick={() => onSelect(cat.id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full whitespace-nowrap text-xs sm:text-sm font-medium transition-all ${
                isSelected
                  ? "bg-slate-800 text-white shadow-md"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat.icon}
              <span>{cat.name}</span>
            </button>

            {/* Ahora se muestra si hay 1 o más pedidos ( > 0 ) */}
            {cat.mostrarContador && pedidosPendientes > 0 && (
              <span className="flex items-center justify-center min-w-[24px] h-6 px-2 text-xs rounded-full font-bold bg-emerald-100 text-emerald-700 shadow-sm">
                {pedidosPendientes}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
