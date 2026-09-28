import { useState, useEffect, useCallback } from "react";
import { useProducts } from "../../../hooks/useProducts";
import {
  Save,
  XCircle,
  ImagePlus,
  X,
  Plus,
  Pizza,
  Coffee,
  Layers,
  Trash2,
  ChevronLeft,
  Search,
  Loader2,
} from "lucide-react";

// ─── Sub-modal: Selector de Tipo de Ítem ────────────────────────────────────
function ItemTypeModal({ onSelect, onClose }) {
  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl w-full max-w-xs shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-slate-800 px-6 py-4 flex items-center justify-between">
          <h3 className="text-white font-bold text-sm">¿Qué quieres añadir?</h3>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-full text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="p-4 flex flex-col gap-3">
          <button
            onClick={() => onSelect("Pizza")}
            className="flex items-center gap-3 p-4 border-2 border-amber-100 hover:border-amber-400 bg-amber-50 hover:bg-amber-100 rounded-xl transition-all group cursor-pointer"
          >
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <Pizza className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="font-bold text-slate-800 text-sm">Agregar Pizza</p>
              <p className="text-xs text-slate-500">
                Selecciona del catálogo de pizzas
              </p>
            </div>
            <Plus className="w-4 h-4 text-amber-500 ml-auto" />
          </button>

          <button
            onClick={() => onSelect("Bebida")}
            className="flex items-center gap-3 p-4 border-2 border-blue-100 hover:border-blue-400 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all group cursor-pointer"
          >
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <Coffee className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="font-bold text-slate-800 text-sm">Agregar Bebida</p>
              <p className="text-xs text-slate-500">
                Selecciona del catálogo de bebidas
              </p>
            </div>
            <Plus className="w-4 h-4 text-blue-500 ml-auto" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-modal: Selector de Pizzas ──────────────────────────────────────────
function PizzaPickerModal({ currentItems, onConfirm, onClose }) {
  const [catFilter, setCatFilter] = useState("all");
  const [search, setSearch] = useState("");
  const { data: products, isLoading: productsLoading } = useProducts();
  const pizzas = products?.pizzas || [];
  const categorias = products?.categoriesPizza || [];

  // Pre-cargar las pizzas ya elegidas
  const [selected, setSelected] = useState(() => {
    const preselected = {};
    currentItems
      .filter((i) => i.tipo_producto === "Pizza")
      .forEach((i) => {
        preselected[i.id_producto_origen] = i.cantidad;
      });
    return preselected;
  });

  const filtered = pizzas.filter((p) => {
    const selectedCategory = categorias.find(
      (category) => String(category.id_categoria_pizza) === String(catFilter),
    );
    const matchCat =
      catFilter === "all" || p.pizzaCategory === selectedCategory?.categoria;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const toggle = (pizza) => {
    setSelected((prev) => {
      if (prev[pizza.id]) {
        const next = { ...prev };
        delete next[pizza.id];
        return next;
      }
      return { ...prev, [pizza.id]: 1 };
    });
  };

  const setQty = (id, qty) => {
    const val = Math.max(1, parseInt(qty) || 1);
    setSelected((prev) => ({ ...prev, [id]: val }));
  };

  const handleConfirm = () => {
    const items = Object.entries(selected).map(([id, cantidad]) => {
      const pizza = pizzas.find((p) => p.id === parseInt(id));
      return {
        tipo_producto: "Pizza",
        id_producto_origen: parseInt(id),
        cantidad,
        nombre_producto: pizza?.name || "",
        url_producto: pizza?.url || null,
        categoria_pizza: pizza?.pizzaCategory || null,
      };
    });
    onConfirm(items);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-800 px-5 py-4 flex items-center justify-between shrink-0 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center">
              <Pizza className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-white font-bold text-sm">Seleccionar Pizzas</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-full text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Filtros */}
        <div className="px-4 pt-3 pb-2 border-b border-slate-100 shrink-0">
          {/* Búsqueda */}
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar pizza..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>
          {/* Pills de categoría */}
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setCatFilter("all")}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${catFilter === "all" ? "bg-amber-500 text-white border-amber-500" : "border-slate-200 text-slate-500 hover:border-amber-300"}`}
            >
              Todas
            </button>
            {categorias.map((c) => (
              <button
                key={c.id_categoria_pizza}
                onClick={() => setCatFilter(c.id_categoria_pizza)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${catFilter === c.id_categoria_pizza ? "bg-amber-500 text-white border-amber-500" : "border-slate-200 text-slate-500 hover:border-amber-300"}`}
              >
                {c.categoria}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de pizzas */}
        <div className="overflow-y-auto flex-1 px-4 py-3 flex flex-col gap-2">
          {productsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-slate-400 text-xs py-8">
              No se encontraron pizzas
            </p>
          ) : (
            filtered.map((pizza) => {
              const isSelected = !!selected[pizza.id];
              return (
                <div
                  key={pizza.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${isSelected ? "border-amber-400 bg-amber-50" : "border-slate-100 hover:border-slate-200 bg-white"}`}
                  onClick={() => toggle(pizza)}
                >
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                    {pizza.url ? (
                      <img
                        src={pizza.url}
                        alt={pizza.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="flex items-center justify-center w-full h-full text-base">
                        🍕
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {pizza.name}
                    </p>
                    <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                      {pizza.categoria_nombre}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 shrink-0">
                    ${Number(pizza.price).toFixed(2)}
                  </span>
                  {/* Checkbox visual */}
                  <div
                    className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${isSelected ? "bg-amber-500 border-amber-500" : "border-slate-300"}`}
                  >
                    {isSelected && (
                      <span className="text-white text-[10px] font-black">
                        ✓
                      </span>
                    )}
                  </div>
                  {/* Cantidad */}
                  {isSelected && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 shrink-0"
                    >
                      <button
                        onClick={() =>
                          setQty(pizza.id, (selected[pizza.id] || 1) - 1)
                        }
                        className="w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold flex items-center justify-center"
                      >
                        −
                      </button>
                      <span className="text-xs font-bold text-slate-800 w-4 text-center">
                        {selected[pizza.id] || 1}
                      </span>
                      <button
                        onClick={() =>
                          setQty(pizza.id, (selected[pizza.id] || 1) + 1)
                        }
                        className="w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-100 shrink-0 flex gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={Object.keys(selected).length === 0}
            className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 text-white py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            Confirmar ({Object.keys(selected).length} pizza
            {Object.keys(selected).length !== 1 ? "s" : ""})
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-modal: Selector de Bebidas ─────────────────────────────────────────
function BebidaPickerModal({ currentItems, onConfirm, onClose }) {
  const [search, setSearch] = useState("");
  const { data: products, isLoading: productsLoading } = useProducts();
  const bebidas = products?.drinks || [];

  // Pre-cargar las bebidas ya elegidas
  const [selected, setSelected] = useState(() => {
    const preselected = {};
    currentItems
      .filter((i) => i.tipo_producto === "Bebida")
      .forEach((i) => {
        preselected[i.id_producto_origen] = i.cantidad;
      });
    return preselected;
  });

  const filtered = bebidas.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()),
  );

  const toggle = (bebida) => {
    setSelected((prev) => {
      if (prev[bebida.id]) {
        const next = { ...prev };
        delete next[bebida.id];
        return next;
      }
      return { ...prev, [bebida.id]: 1 };
    });
  };

  const setQty = (id, qty) => {
    const val = Math.max(1, parseInt(qty) || 1);
    setSelected((prev) => ({ ...prev, [id]: val }));
  };

  const handleConfirm = () => {
    const items = Object.entries(selected).map(([id, cantidad]) => {
      const bebida = bebidas.find((b) => b.id === parseInt(id));
      return {
        tipo_producto: "Bebida",
        id_producto_origen: parseInt(id),
        cantidad,
        nombre_producto: bebida?.name || "",
        url_producto: bebida?.url || null,
        categoria_pizza: null,
      };
    });
    onConfirm(items);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-800 px-5 py-4 flex items-center justify-between shrink-0 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
              <Coffee className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-white font-bold text-sm">
              Seleccionar Bebidas
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-full text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Búsqueda */}
        <div className="px-4 pt-3 pb-2 border-b border-slate-100 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar bebida..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-blue-400 transition-colors"
            />
          </div>
        </div>

        {/* Lista de bebidas */}
        <div className="overflow-y-auto flex-1 px-4 py-3 flex flex-col gap-2">
          {productsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-slate-400 text-xs py-8">
              No se encontraron bebidas
            </p>
          ) : (
            filtered.map((bebida) => {
              const isSelected = !!selected[bebida.id];
              return (
                <div
                  key={bebida.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${isSelected ? "border-blue-400 bg-blue-50" : "border-slate-100 hover:border-slate-200 bg-white"}`}
                  onClick={() => toggle(bebida)}
                >
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                    {bebida.url ? (
                      <img
                        src={bebida.url}
                        alt={bebida.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="flex items-center justify-center w-full h-full text-base">
                        🥤
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {bebida.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      ${Number(bebida.price).toFixed(2)}
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${isSelected ? "bg-blue-500 border-blue-500" : "border-slate-300"}`}
                  >
                    {isSelected && (
                      <span className="text-white text-[10px] font-black">
                        ✓
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 shrink-0"
                    >
                      <button
                        onClick={() =>
                          setQty(bebida.id, (selected[bebida.id] || 1) - 1)
                        }
                        className="w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold flex items-center justify-center"
                      >
                        −
                      </button>
                      <span className="text-xs font-bold text-slate-800 w-4 text-center">
                        {selected[bebida.id] || 1}
                      </span>
                      <button
                        onClick={() =>
                          setQty(bebida.id, (selected[bebida.id] || 1) + 1)
                        }
                        className="w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-100 shrink-0 flex gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={Object.keys(selected).length === 0}
            className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            Confirmar ({Object.keys(selected).length} bebida
            {Object.keys(selected).length !== 1 ? "s" : ""})
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente Principal: ComboForm ─────────────────────────────────────────
export default function ComboForm({ initial, onSave, onCancel, isSaving }) {
  const isEditing = !!initial;

  const [form, setForm] = useState({
    name: initial?.name || "",
    price: initial?.price || "",
    description: initial?.description || "",
  });
  const [errors, setErrors] = useState({});
  const [items, setItems] = useState(initial?.items || []); // ítems del combo

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(initial?.url || null);

  // Control de submodales
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showPizzaPicker, setShowPizzaPicker] = useState(false);
  const [showBebidaPicker, setShowBebidaPicker] = useState(false);

  useEffect(() => {
    return () => {
      if (imagePreview && !initial?.url) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview, initial]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // ── Manejo de ítems ──────────────────────────────────────────────────────
  const handleTypeSelect = (type) => {
    setShowTypeModal(false);
    if (type === "Pizza") setShowPizzaPicker(true);
    else setShowBebidaPicker(true);
  };

  // Al confirmar selección de pizzas: sustituir los ítems de tipo Pizza
  const handlePizzasConfirmed = useCallback((newPizzaItems) => {
    setItems((prev) => {
      const sinPizzas = prev.filter((i) => i.tipo_producto !== "Pizza");
      return [...sinPizzas, ...newPizzaItems];
    });
    setShowPizzaPicker(false);
    setErrors((prev) => ({ ...prev, items: "" }));
  }, []);

  // Al confirmar selección de bebidas: sustituir los ítems de tipo Bebida
  const handleBebidasConfirmed = useCallback((newBebidaItems) => {
    setItems((prev) => {
      const sinBebidas = prev.filter((i) => i.tipo_producto !== "Bebida");
      return [...sinBebidas, ...newBebidaItems];
    });
    setShowBebidaPicker(false);
    setErrors((prev) => ({ ...prev, items: "" }));
  }, []);

  const removeItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItemQty = (idx, qty) => {
    const val = Math.max(1, parseInt(qty) || 1);
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, cantidad: val } : item)),
    );
  };

  // ── Validación y envío ───────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "El nombre del combo es requerido";
    if (!form.price || isNaN(form.price) || parseFloat(form.price) <= 0)
      e.price = "Precio inválido";
    if (items.length === 0)
      e.items = "El combo debe tener al menos un ítem (pizza o bebida)";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    const payload = {
      nombre: form.name.trim(),
      descripcion: form.description.trim(),
      precio: parseFloat(form.price),
      items: items.map((item) => ({
        tipo_producto: item.tipo_producto,
        id_producto_origen: item.id_producto_origen,
        cantidad: item.cantidad,
      })),
      image: imageFile,
    };

    onSave(payload);
  };

  return (
    <>
      <div className="flex flex-col gap-4 relative">
        {/* Overlay de carga */}
        {isSaving && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
            <div className="flex items-center gap-2 text-purple-600 font-bold">
              <Loader2 className="w-4 h-4 animate-spin" />
              Guardando combo...
            </div>
          </div>
        )}

        {/* Nombre */}
        <div>
          <label className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5 block">
            Nombre del Combo
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className={`w-full bg-slate-50 border ${errors.name ? "border-red-400" : "border-slate-200"} rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 transition-colors`}
            placeholder="Ej. Combo Familiar Pepperoni"
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1 font-medium">
              {errors.name}
            </p>
          )}
        </div>

        {/* Sección de componentes del combo */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-slate-500 text-xs font-bold uppercase tracking-wider">
              Productos del Combo
            </label>
            <button
              type="button"
              onClick={() => setShowTypeModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Añadir productos
            </button>
          </div>

          {/* Lista de ítems seleccionados */}
          {items.length === 0 ? (
            <div
              className={`border-2 border-dashed ${errors.items ? "border-red-300 bg-red-50" : "border-slate-200 bg-slate-50"} rounded-xl p-6 text-center`}
            >
              <Layers
                className={`w-8 h-8 mx-auto mb-2 ${errors.items ? "text-red-300" : "text-slate-300"}`}
              />
              <p
                className={`text-xs font-medium ${errors.items ? "text-red-400" : "text-slate-400"}`}
              >
                {errors.items || "Aún no has añadido productos al combo"}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                Haz clic en «Añadir productos» para empezar
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors"
                >
                  {/* Icono tipo */}
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${item.tipo_producto === "Pizza" ? "bg-amber-100" : "bg-blue-100"}`}
                  >
                    {item.tipo_producto === "Pizza" ? (
                      <Pizza className="w-3.5 h-3.5 text-amber-600" />
                    ) : (
                      <Coffee className="w-3.5 h-3.5 text-blue-600" />
                    )}
                  </div>

                  {/* Imagen miniatura */}
                  {item.url_producto && (
                    <div className="w-6 h-6 rounded overflow-hidden shrink-0 border border-slate-100">
                      <img
                        src={item.url_producto}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {item.nombre_producto}
                    </p>
                    {item.categoria_pizza && (
                      <span className="text-[9px] text-amber-600 font-semibold">
                        {item.categoria_pizza}
                      </span>
                    )}
                  </div>

                  {/* Selector de cantidad */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateItemQty(idx, item.cantidad - 1)}
                      className="w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 text-xs font-bold flex items-center justify-center transition-colors"
                    >
                      −
                    </button>
                    <span className="text-xs font-bold text-slate-800 w-5 text-center">
                      {item.cantidad}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateItemQty(idx, item.cantidad + 1)}
                      className="w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 text-xs font-bold flex items-center justify-center transition-colors"
                    >
                      +
                    </button>
                  </div>

                  {/* Eliminar */}
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Precio */}
        <div>
          <label className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5 block">
            Precio del Combo ($)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.price}
            onChange={(e) => handleChange("price", e.target.value)}
            className={`w-full bg-slate-50 border ${errors.price ? "border-red-400" : "border-slate-200"} rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 transition-colors`}
            placeholder="0.00"
          />
          {errors.price && (
            <p className="text-red-500 text-xs mt-1 font-medium">
              {errors.price}
            </p>
          )}
        </div>

        {/* Descripción */}
        <div>
          <label className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5 block">
            Descripción
          </label>
          <textarea
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 resize-none transition-colors"
            rows={2}
            placeholder="Ej. Pizza familiar + 2 bebidas a precio especial..."
          />
        </div>

        {/* Imagen */}
        <div>
          <label className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5 block">
            Imagen Promocional
          </label>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {imagePreview && (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Vista previa"
                  className="w-16 h-16 rounded-lg object-cover border border-slate-200 shadow-sm"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-white rounded-full p-0.5 shadow-md border border-slate-200 text-slate-500 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <label className="cursor-pointer bg-slate-50 border-2 border-dashed border-slate-300 hover:border-purple-400 rounded-lg px-4 py-3 text-sm text-slate-600 flex items-center justify-center flex-1 transition-colors group w-full">
              <div className="flex items-center gap-2">
                <ImagePlus className="w-5 h-5 text-slate-400 group-hover:text-purple-500 transition-colors" />
                <span className="font-medium">
                  {imageFile ? "Cambiar imagen" : "Seleccionar imagen"}
                </span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 mt-2">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 w-full sm:w-1/3 transition-colors flex items-center justify-center gap-2"
          >
            <XCircle className="w-4 h-4" />
            {isEditing ? "Cancelar" : "Atrás"}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 text-white py-3 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isEditing ? "Actualizar Combo" : "Guardar Combo"}
          </button>
        </div>
      </div>

      {/* Sub-modales (fuera del flujo del formulario para el z-index) */}
      {showTypeModal && (
        <ItemTypeModal
          onSelect={handleTypeSelect}
          onClose={() => setShowTypeModal(false)}
        />
      )}
      {showPizzaPicker && (
        <PizzaPickerModal
          currentItems={items}
          onConfirm={handlePizzasConfirmed}
          onClose={() => setShowPizzaPicker(false)}
        />
      )}
      {showBebidaPicker && (
        <BebidaPickerModal
          currentItems={items}
          onConfirm={handleBebidasConfirmed}
          onClose={() => setShowBebidaPicker(false)}
        />
      )}
    </>
  );
}
