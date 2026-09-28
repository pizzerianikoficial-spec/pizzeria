import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { X, Plus, Pencil, Trash2, Save, XCircle } from "lucide-react";
import axios from "axios";
import { useProducts } from "../../hooks/useProducts";

const API_BASE = "http://localhost:3001/api";

const CATEGORIES_MAP = {
  pizzas: { label: "Pizzas", icon: "🍕" },
  drinks: { label: "Bebidas", icon: "🥤" },
  icecream: { label: "Heladería", icon: "🍦" },
};

// Modificado: Se cambia 'sizes: []' por 'size: ""' para asegurar selección única
const EMPTY_PRODUCT = {
  name: "",
  price: "",
  description: "",
  emoji: "🍕",
  size: "",
  available: true,
};

function ProductForm({ initial, category, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { ...EMPTY_PRODUCT });
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // Nueva función para forzar una única selección
  const selectSize = (selectedSize) => {
    setForm((prev) => ({ ...prev, size: selectedSize }));
    setErrors((prev) => ({ ...prev, size: "" })); // Limpia el error al seleccionar
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "El nombre es requerido";
    if (!form.price || isNaN(form.price) || parseFloat(form.price) <= 0)
      e.price = "Precio inválido";

    // Validación de tamaño obligatorio solo para pizzas
    if (category === "pizzas" && !form.size) {
      e.size = "Debe seleccionar un tamaño";
    }

    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    onSave({ ...form, price: parseFloat(form.price), category });
  };

  const EMOJIS = [
    "🍕",
    "🥤",
    "🍦",
    "🍫",
    "🍌",
    "🍓",
    "🥦",
    "🍺",
    "🍷",
    "🥩",
    "🍍",
    "🦐",
    "💧",
    "🍋",
    "🍨",
    "🥛",
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Name */}
      <div>
        <label className="text-pizza-muted text-xs font-semibold uppercase tracking-wider mb-1.5 block">
          Nombre del Producto
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
          className={`input-field ${errors.name ? "border-pizza-red" : ""}`}
          placeholder="Ej. Pepperoni Clásico"
        />
        {errors.name && (
          <p className="text-pizza-red text-xs mt-1">{errors.name}</p>
        )}
      </div>

      {/* Price + Emoji */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-pizza-muted text-xs font-semibold uppercase tracking-wider mb-1.5 block">
            Precio ($)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.price}
            onChange={(e) => handleChange("price", e.target.value)}
            className={`input-field ${errors.price ? "border-pizza-red" : ""}`}
            placeholder="0.00"
          />
          {errors.price && (
            <p className="text-pizza-red text-xs mt-1">{errors.price}</p>
          )}
        </div>
        <div>
          <label className="text-pizza-muted text-xs font-semibold uppercase tracking-wider mb-1.5 block">
            Icono
          </label>
          <select
            value={form.emoji}
            onChange={(e) => handleChange("emoji", e.target.value)}
            className="input-field text-xl"
          >
            {EMOJIS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-pizza-muted text-xs font-semibold uppercase tracking-wider mb-1.5 block">
          Descripción
        </label>
        <textarea
          value={form.description}
          onChange={(e) => handleChange("description", e.target.value)}
          className="input-field resize-none w-full"
          rows={2}
          placeholder="Ingredientes o detalles..."
        />
      </div>

      {/* Sizes (only for pizzas) - Modificado para un solo string */}
      {category === "pizzas" && (
        <div>
          <label className="text-pizza-muted text-xs font-semibold uppercase tracking-wider mb-1.5 block">
            Tamaño del Producto
          </label>
          <div className="flex gap-2">
            {["Normal", "Familiar", "Gigante"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => selectSize(s)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                  form.size === s
                    ? "border-pizza-red bg-pizza-red/10 text-pizza-red"
                    : "border-pizza-gray-3 text-pizza-muted hover:border-pizza-gray-4"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          {errors.size && (
            <p className="text-pizza-red text-xs mt-1">{errors.size}</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={onCancel}
          className="btn-secondary flex-1 flex items-center justify-center gap-2"
        >
          <XCircle className="w-4 h-4" /> Cancelar
        </button>
        <button
          onClick={handleSubmit}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" /> Guardar
        </button>
      </div>
    </div>
  );
}

export default function CrudModal({ onClose }) {
  const { data: products } = useProducts();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("pizzas");
  const [editingId, setEditingId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Estado para manejar el loading mientras se guarda en la DB
  const [isSaving, setIsSaving] = useState(false);

  const currentProducts = products?.[activeTab] || [];

  const getEndpoint = () => {
    if (activeTab === "pizzas") return `${API_BASE}/pizzas`;
    if (activeTab === "drinks") return `${API_BASE}/bebidas`;
    return `${API_BASE}/heladeria`;
  };

  // Modificado: Integración con las APIs separadas
  const handleSaveNew = async (product) => {
    setIsSaving(true);
    try {
      const response = await axios.post(getEndpoint(), product);

      const data = response.data;

      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["products"] });
        setCreating(false);
      } else {
        alert("Error al guardar: " + data.message);
      }
    } catch (error) {
      console.error("Error al registrar el producto:", error);
      const errorMessage =
        error.response?.data?.message || "Error de conexión con el servidor";
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEdit = async (product) => {
    if (!editingId) return;
    setIsSaving(true);
    try {
      const response = await axios.put(
        `${getEndpoint()}/${editingId}`,
        product,
      );

      if (response.data?.success) {
        queryClient.invalidateQueries({ queryKey: ["products"] });
        setEditingId(null);
      } else {
        alert(
          "Error al actualizar: " +
            (response.data?.message || "Error desconocido"),
        );
      }
    } catch (error) {
      console.error("Error al actualizar el producto:", error);
      const errorMessage =
        error.response?.data?.message || "Error de conexión con el servidor";
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id) => {
    // No hay endpoint de borrado en el backend; se elimina del caché
    queryClient.setQueryData(["products"], (old = {}) => ({
      ...old,
      [activeTab]: (old[activeTab] || []).filter((p) => p.id !== id),
    }));
    setDeleteConfirm(null);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content w-full max-w-[640px] max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-pizza-gray-3">
          <h2 className="text-pizza-dark font-bold text-lg">
            Gestión de Productos
          </h2>
          <button
            onClick={onClose}
            className="text-pizza-muted hover:text-pizza-dark p-1.5 rounded-lg hover:bg-pizza-gray-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-3 sm:p-4 pb-0 overflow-x-auto">
          {Object.entries(CATEGORIES_MAP).map(([key, { label, icon }]) => (
            <button
              key={key}
              onClick={() => {
                setActiveTab(key);
                setEditingId(null);
                setCreating(false);
              }}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                activeTab === key ? "tab-active" : "tab-inactive"
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 flex flex-col gap-2 sm:gap-3">
          {/* Create form */}
          {creating && (
            <div className="card p-4 border-pizza-red/30 bg-pizza-gray-2 relative">
              {isSaving && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                  <span className="text-pizza-red font-semibold">
                    Guardando...
                  </span>
                </div>
              )}
              <h3 className="text-pizza-dark font-semibold mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4 text-pizza-red" /> Nuevo Producto
              </h3>
              <ProductForm
                category={activeTab}
                onSave={handleSaveNew}
                onCancel={() => setCreating(false)}
              />
            </div>
          )}

          {/* Product list */}
          {currentProducts.map((product) => (
            <div key={product.id} className="card p-4">
              {editingId === product.id ? (
                <>
                  <h3 className="text-pizza-dark font-semibold mb-3 flex items-center gap-2">
                    <Pencil className="w-4 h-4 text-pizza-red" /> Editar
                    Producto
                  </h3>
                  <ProductForm
                    initial={product}
                    category={activeTab}
                    onSave={handleSaveEdit}
                    onCancel={() => setEditingId(null)}
                  />
                </>
              ) : deleteConfirm === product.id ? (
                <div className="flex flex-col gap-3">
                  <p className="text-pizza-dark">
                    ¿Eliminar{" "}
                    <span className="font-bold text-pizza-red">
                      {product.name}
                    </span>
                    ?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="btn-secondary flex-1"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="btn-primary flex-1"
                    >
                      Sí, Eliminar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{product.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-pizza-dark font-semibold text-sm truncate">
                      {product.name}
                    </p>
                    <p className="text-pizza-muted text-xs truncate">
                      {product.description}
                    </p>
                    {product.size && (
                      <p className="text-pizza-muted text-[10px] uppercase">
                        {product.size}
                      </p>
                    )}
                  </div>
                  <span className="text-pizza-red font-bold text-sm whitespace-nowrap">
                    ${product.price.toFixed(2)}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditingId(product.id);
                        setCreating(false);
                      }}
                      className="p-2 rounded-lg hover:bg-pizza-gray-2 text-pizza-muted hover:text-pizza-dark transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(product.id)}
                      className="p-2 rounded-lg hover:bg-pizza-red/10 text-pizza-muted hover:text-pizza-red transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {currentProducts.length === 0 && !creating && (
            <div className="flex flex-col items-center justify-center py-12 text-pizza-muted gap-2">
              <span className="text-4xl">{CATEGORIES_MAP[activeTab].icon}</span>
              <p className="text-sm">No hay productos en esta categoría</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-pizza-gray-3 p-3 sm:p-4">
          <button
            onClick={() => {
              setCreating(true);
              setEditingId(null);
            }}
            disabled={creating}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Nuevo Producto
          </button>
        </div>
      </div>
    </div>
  );
}
