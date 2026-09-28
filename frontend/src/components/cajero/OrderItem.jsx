import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { useApp, isBoxItem } from "../../context/AppContext";
import { tieneExtrasGratis } from "../../utils/extrasPrecio";
import { Minus, Plus, Trash2, ChevronDown, Edit3 } from "lucide-react";

const SIZE_OPTIONS = ["Normal", "Familiar", "Gigante"];
const NO_NOTE_CATEGORIES = ["drinks", "cajas"];

// Diccionario para relacionar el texto del tamaño con el id_categoria_pizza de tu base de datos
const SIZE_TO_CATEGORY = {
  Normal: 1,
  Familiar: 2,
  Gigante: 3,
};

function ExtrasModal({ item, onClose, onSave }) {
  const [apiExtras, setApiExtras] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Usamos id para inicializar los seleccionados correctamente
  const [selected, setSelected] = useState(
    () => new Set(item.extras.map((e) => e.id)),
  );

  useEffect(() => {
    const fetchExtras = async () => {
      try {
        const response = await axios.get("http://localhost:3001/api/extras", {
          withCredentials: true,
        });
        const data = response.data;

        if (data.success) {
          // Obtenemos el ID de la categoría según el tamaño de la pizza (por defecto 1 si no tiene)
          const categoriaId = SIZE_TO_CATEGORY[item.size] || 1;

          // Filtramos por id_categoria_pizza y opcionalmente que estén Activos
          const extrasFiltrados = data.data.filter(
            (extra) =>
              Number(extra.id_categoria_pizza) === Number(categoriaId) &&
              extra.estado === "Activo",
          );

          setApiExtras(extrasFiltrados);
        }
      } catch (error) {
        console.error("Error al obtener los extras:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExtras();
  }, [item.size]);

  const toggle = (extra) => {
    const extraId = extra.id; // Usamos el campo real de tu BD
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(extraId)) {
        next.delete(extraId);
      } else {
        next.add(extraId);
      }
      return next;
    });
  };

  const handleSave = () => {
    const chosenExtras = apiExtras.filter((e) => selected.has(e.id));
    onSave(item.id, chosenExtras);
    onClose();
  };

  const extrasIncluidos = tieneExtrasGratis(item.name);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/70 backdrop-blur-sm">
      <div
        className="modal-content p-6 w-full max-w-md flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold mb-1 text-pizza-dark">Personalizar</h3>
        <p className="text-pizza-muted text-sm mb-4">
          {item.name} {item.size ? `(${item.size})` : ""}
        </p>

        {extrasIncluidos && (
          <p className="text-emerald-600 text-xs font-medium mb-3">
            Los extras de esta pizza están incluidos.
          </p>
        )}

        <div className="flex flex-col gap-2 mb-5 flex-1 min-h-0 overflow-y-auto">
          {isLoading ? (
            <div className="text-center text-sm text-pizza-muted py-4 animate-pulse">
              Cargando extras...
            </div>
          ) : apiExtras.length === 0 ? (
            <div className="text-center text-sm text-pizza-muted py-4">
              No hay extras disponibles para este tamaño.
            </div>
          ) : (
            apiExtras.map((extra) => {
              const isSelected = selected.has(extra.id);
              return (
                <button
                  key={extra.id}
                  onClick={() => toggle(extra)}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
                    isSelected
                      ? "border-pizza-red bg-pizza-red/10 text-pizza-red font-semibold"
                      : "border-pizza-gray-3 text-pizza-muted hover:border-pizza-gray-4 hover:text-pizza-dark"
                  }`}
                >
                  {/* Usamos 'name' tal cual viene de tu tabla */}
                  <span className="text-sm">{extra.name}</span>
                  <span
                    className={`text-xs font-semibold ${isSelected ? "text-pizza-red" : ""}`}
                  >
                    {/* Usamos 'price' tal cual viene de tu tabla */}
                    {extrasIncluidos
                      ? "Incluido"
                      : `+$${Number(extra.price).toFixed(2)}`}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="flex gap-2 shrink-0">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cerrar
          </button>
          <button
            onClick={handleSave}
            className="btn-primary flex-1"
            disabled={isLoading}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function OrderItem({ item }) {
  const { updateItemQty, updateItemSize, updateItemExtras, removeItem } =
    useApp();

  const [showExtras, setShowExtras] = useState(false);
  const { updateItemNote } = useApp();
  const [showNote, setShowNote] = useState(false);
  const [noteValue, setNoteValue] = useState(item.note || "");

  const hasSize = item.category === "pizzas";
  const isBox = isBoxItem(item);
  const itemExtras = item.extras || [];

  const canHaveNote = !NO_NOTE_CATEGORIES.includes(
    String(item.category || "").toLowerCase(),
  );

  return (
    <>
      <div className="bg-pizza-gray-2 rounded-lg sm:rounded-xl p-2 sm:p-3 flex flex-col gap-1.5 sm:gap-2 animate-slide-in border border-pizza-gray-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg">{item.emoji}</span>
            <div className="min-w-0">
              <p className="text-pizza-dark text-sm font-semibold truncate">
                {item.name}
              </p>
              {item.extras.length > 0 && (
                <p className="text-pizza-muted text-xs truncate">
                  {/* Mostramos 'name' o 'name' por compatibilidad */}+{" "}
                  {item.extras.map((e) => e.name || e.name).join(", ")}
                </p>
              )}
              {canHaveNote && item.note && (
                <p className="text-xs text-slate-500 mt-1">Nota: {item.note}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => removeItem(item.id)}
            className="text-pizza-muted hover:text-pizza-red transition-colors p-1 rounded-lg hover:bg-pizza-red/10 flex-shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Controls row */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Qty */}
          <div className="flex items-center gap-1 bg-pizza-gray-3/50 rounded-lg p-1 border border-pizza-gray-3">
            <button
              onClick={() => updateItemQty(item.id, item.qty - 1)}
              disabled={item.qty <= 1}
              className="w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center hover:bg-pizza-gray-3 disabled:opacity-30 transition-colors"
            >
              <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-pizza-dark" />
            </button>
            <span className="text-pizza-dark text-xs sm:text-sm font-bold w-5 sm:w-6 text-center">
              {item.qty}
            </span>
            <button
              onClick={() => updateItemQty(item.id, item.qty + 1)}
              className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-pizza-gray-3 transition-colors"
            >
              <Plus className="w-3 h-3 text-pizza-dark" />
            </button>
          </div>

          {/* Size selector */}
          {hasSize && (
            <div className="relative flex-1">
              <p className="text-sm border px-2 py-1 rounded ml-2">
                {item.size}
              </p>
            </div>
          )}

          {/* Extras button */}
          {item.category === "pizzas" && (
            <button
              onClick={() => setShowExtras(true)}
              className="text-xs text-pizza-red hover:text-pizza-red-light font-medium px-2 py-1.5 rounded-lg bg-pizza-red/10 hover:bg-pizza-red/20 transition-all whitespace-nowrap"
            >
              Extras
            </button>
          )}

          {/* Note button */}
          {canHaveNote && (
            <button
              onClick={() => setShowNote((prev) => !prev)}
              className="text-xs border px-2 py-1 rounded ml-2"
            >
              {showNote ? "Cerrar nota" : "Nota"}
            </button>
          )}

          {/* Price */}
          <span className="text-pizza-dark font-bold text-sm ml-auto">
            ${(item.price * item.qty).toFixed(2)}
          </span>
        </div>
      </div>

      {canHaveNote && showNote && (
        <div className="mt-2">
          <textarea
            value={noteValue}
            onChange={(e) => setNoteValue(e.target.value)}
            className="w-full border rounded p-2 text-sm"
            placeholder="Nota para cocina (p. ej. mitad queso / mitad champiñones)"
          ></textarea>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => {
                updateItemNote(item.id, noteValue);
                setShowNote(false);
              }}
              className="btn-primary"
            >
              Guardar nota
            </button>
            <button
              onClick={() => {
                setNoteValue(item.note || "");
                setShowNote(false);
              }}
              className="btn-secondary"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {showExtras && (
        <ExtrasModal
          item={item}
          onClose={() => setShowExtras(false)}
          onSave={updateItemExtras}
        />
      )}
    </>
  );
}
