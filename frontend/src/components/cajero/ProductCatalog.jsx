import { useState } from "react";
import { Plus, Search, X } from "lucide-react";
import CrudModal from "./CrudModal";
import { useProducts } from "../../hooks/useProducts";

const CATEGORIES = [
  { key: "pizzas", label: "Pizzas", icon: "🍕" },
  { key: "drinks", label: "Bebidas", icon: "🥤" },
  { key: "icecream", label: "Heladería", icon: "🍦" },
];

function SizeModal({ product, onConfirm, onClose }) {
  const [selected, setSelected] = useState(product.sizes[0]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content p-6 w-80"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold mb-1">{product.name}</h3>
        <p className="text-pizza-muted text-sm mb-4">Selecciona el tamaño:</p>
        <div className="flex flex-col gap-2 mb-5">
          {product.sizes.map((s) => (
            <button
              key={s}
              onClick={() => setSelected(s)}
              className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                selected === s
                  ? "border-pizza-red bg-pizza-red/10 text-pizza-red"
                  : "border-pizza-gray-3 text-pizza-dark hover:border-pizza-gray-4"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(selected)}
            className="btn-primary flex-1"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product }) {
  const { addToCart } = useApp();
  const [showSizeModal, setShowSizeModal] = useState(false);

  const handleAdd = () => {
    if (product.sizes && product.sizes.length > 0) {
      setShowSizeModal(true);
    } else {
      addToCart(product, null);
    }
  };

  const handleConfirmSize = (size) => {
    addToCart(product, size);
    setShowSizeModal(false);
  };

  return (
    <>
      <div
        className="card p-4 flex flex-col gap-2 hover:border-pizza-red/50 transition-all duration-200 cursor-pointer group"
        onClick={handleAdd}
      >
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-32 object-cover rounded-lg mb-1 shadow-sm"
          />
        ) : (
          <div className="text-3xl mb-1 text-center">{product.emoji}</div>
        )}
        <p className="text-pizza-dark font-semibold text-sm leading-tight line-clamp-2">
          {product.name}
        </p>
        <p className="text-pizza-muted text-xs line-clamp-2">
          {product.description}
        </p>
        {product.category && (
          <p className="text-pizza-muted text-xs mt-1">
            Categoría:{" "}
            <span className="text-pizza-dark font-medium">
              {product.category}
            </span>
          </p>
        )}
        {product.sizes?.length > 0 && (
          <p className="text-pizza-muted text-xs">
            {product.sizes.join(" · ")}
          </p>
        )}
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-pizza-red font-bold text-base">
            ${product.price.toFixed(2)}
          </span>
          <div className="w-7 h-7 rounded-lg bg-pizza-red/10 group-hover:bg-pizza-red flex items-center justify-center transition-all duration-200">
            <Plus className="w-4 h-4 text-pizza-red group-hover:text-white" />
          </div>
        </div>
      </div>
      {showSizeModal && (
        <SizeModal
          product={product}
          onConfirm={handleConfirmSize}
          onClose={() => setShowSizeModal(false)}
        />
      )}
    </>
  );
}

export default function ProductCatalog() {
  const { data: products } = useProducts();
  const [activeTab, setActiveTab] = useState("pizzas");
  const [search, setSearch] = useState("");
  const [showCrud, setShowCrud] = useState(false);

  const allProducts = [
    ...(products?.pizzas || []),
    ...(products?.drinks || []),
    ...(products?.icecream || []),
  ];

  const isSearching = search.trim().length > 0;
  const displayProducts = isSearching
    ? allProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          (p.description || "").toLowerCase().includes(search.toLowerCase()),
      )
    : products?.[activeTab] || [];

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 pb-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pizza-muted" />
          <input
            type="text"
            placeholder="Buscar en todo el catálogo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 pr-9"
          />
          <button
            onClick={() => setShowCrud(true)}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-pizza-red/10 hover:bg-pizza-red/20 text-pizza-red px-3 py-1 rounded-md text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Nuevo
          </button>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-pizza-muted hover:text-pizza-dark" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      {!isSearching && (
        <div className="flex gap-1 p-4 pb-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveTab(cat.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === cat.key ? "tab-active" : "tab-inactive"
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === cat.key ? "bg-white/20" : "bg-pizza-gray-3"
                }`}
              >
                {(products?.[cat.key] || []).length}
              </span>
            </button>
          ))}
        </div>
      )}

      {isSearching && (
        <div className="px-4 pt-3 pb-1">
          <p className="text-pizza-muted text-sm">
            {displayProducts.length} resultado
            {displayProducts.length !== 1 ? "s" : ""} para{" "}
            <span className="text-pizza-dark font-semibold">"{search}"</span>
          </p>
        </div>
      )}

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4 pt-2">
        <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
          {displayProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        {displayProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-pizza-muted">
            <span className="text-4xl mb-2">🍕</span>
            <p className="text-sm">No se encontraron productos</p>
          </div>
        )}
      </div>
      {showCrud && <CrudModal onClose={() => setShowCrud(false)} />}
    </div>
  );
}
