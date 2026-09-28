import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Search,
  Plus,
  Package,
  Package2,
  Pencil,
  Trash2,
  Pizza,
  Coffee,
  IceCream,
  X,
  Layers,
} from "lucide-react";
import ProductForm from "./products/ProductForm";
import ComboForm from "./products/ComboForm";
import Pagination from "../ui/Pagination";
import { useBranches } from "../../hooks/useBranches";
import { useProducts } from "../../hooks/useProducts";

// ─── Configuración ────────────────────────────────────────────────
const CATEGORY_TYPES = [
  {
    id: "pizzas",
    label: "Pizza",
    sublabel: "Masa tradicional",
    icon: Pizza,
    colorLight: "bg-amber-50 border-amber-200",
    colorSelected: "bg-amber-500 border-amber-500",
    colorIcon: "text-amber-500",
  },
  {
    id: "drinks",
    label: "Bebida",
    sublabel: "Refrescos y jugos",
    icon: Coffee,
    colorLight: "bg-blue-50 border-blue-200",
    colorSelected: "bg-blue-500 border-blue-500",
    colorIcon: "text-blue-500",
  },
  {
    id: "icecream",
    label: "Helado",
    sublabel: "Postres fríos",
    icon: IceCream,
    colorLight: "bg-pink-50 border-pink-200",
    colorSelected: "bg-pink-500 border-pink-500",
    colorIcon: "text-pink-500",
  },
  {
    id: "extras",
    label: "Extras",
    sublabel: "Adicionales",
    icon: Pizza,
    colorLight: "bg-emerald-50 border-emerald-200",
    colorSelected: "bg-emerald-500 border-emerald-500",
    colorIcon: "text-emerald-500",
  },
  {
    id: "combos",
    label: "Combos",
    sublabel: "Pizzas + Bebidas",
    icon: Layers,
    colorLight: "bg-purple-50 border-purple-200",
    colorSelected: "bg-purple-600 border-purple-600",
    colorIcon: "text-purple-600",
  },
];

const getHeaderDate = () => {
  const date = new Date();
  const options = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  };
  const dateString = date.toLocaleDateString("es-ES", options);
  return dateString
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// ─── Componente Principal ────────────────────────────────────────────────
export default function ProductosScreen() {
  const { data: branches } = useBranches();
  const { data: catalog, isLoading } = useProducts();
  const [selectedBranchFilter, setSelectedBranchFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [products, setProducts] = useState([]);

  // Estados para el Modal y Flujo
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Estados para edición y carga
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Estados para el precio de la caja (empaque)
  const [boxPrice, setBoxPrice] = useState(null);
  const [boxPriceInput, setBoxPriceInput] = useState("");
  const [savingBox, setSavingBox] = useState(false);

  useEffect(() => {
    const loadBox = async () => {
      try {
        const { data } = await axios.get("http://localhost:3001/api/caja", {
          withCredentials: true,
        });
        if (data.success && data.caja) {
          setBoxPrice(Number(data.caja.precio_caja));
          setBoxPriceInput(String(data.caja.precio_caja));
        }
      } catch (error) {
        console.error("Error cargando precio de caja:", error);
      }
    };
    loadBox();
  }, []);

  const handleSaveBoxPrice = async () => {
    const value = Number(boxPriceInput);
    if (isNaN(value) || value < 0) {
      window.Toast.fire({
        icon: "error",
        title: "Ingresa un precio válido",
      });
      return;
    }
    setSavingBox(true);
    try {
      const { data } = await axios.put(
        "http://localhost:3001/api/caja",
        { precio_caja: value },
        { withCredentials: true },
      );
      if (data.success) {
        setBoxPrice(value);
        window.Toast.fire({
          icon: "success",
          title: "Precio de caja actualizado",
        });
      }
    } catch (error) {
      window.Toast.fire({
        icon: "error",
        title: error.response?.data?.message || "Error al actualizar el precio",
      });
    } finally {
      setSavingBox(false);
    }
  };

  useEffect(() => {
    if (!catalog) return;

    setProducts([
      ...(catalog.pizzas || []),
      ...(catalog.drinks || []),
      ...(catalog.icecream || []),
      ...(catalog.extras || []),
      ...(catalog.combos || []),
    ]);
  }, [catalog]);

  // ─── Carga de Datos desde useProducts ───
  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description &&
        p.description.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory =
      categoryFilter === "all" || p.category === categoryFilter;
    const matchesBranch =
      selectedBranchFilter === "all" ||
      String(p.id_sucursal) === String(selectedBranchFilter);
    return matchesSearch && matchesCategory && matchesBranch;
  });

  // Paginación (10 productos por página)
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, selectedBranchFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedProducts = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  const counts = products.reduce(
    (acc, p) => {
      if (
        selectedBranchFilter === "all" ||
        String(p.id_sucursal) === String(selectedBranchFilter)
      ) {
        acc.all++;
        if (acc[p.category] !== undefined) {
          acc[p.category]++;
        }
      }
      return acc;
    },
    { all: 0, pizzas: 0, drinks: 0, icecream: 0, extras: 0, combos: 0 },
  );

  const FILTER_TABS = [
    { id: "all", label: "Todos", count: counts.all },
    { id: "pizzas", label: "Pizza", count: counts.pizzas },
    { id: "drinks", label: "Bebida", count: counts.drinks },
    { id: "icecream", label: "Helado", count: counts.icecream },
    { id: "extras", label: "Extras", count: counts.extras },
    { id: "combos", label: "Combos", count: counts.combos },
  ];

  // Funciones de apertura
  const handleNewClick = () => {
    setEditingProduct(null);
    setSelectedCategory(null);
    setModalStep(1);
    setIsModalOpen(true);
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setSelectedCategory(product.category); // Aquí asignamos correctamente la categoría para que el formulario la reconozca
    setModalStep(2);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setModalStep(1);
      setSelectedCategory(null);
      setEditingProduct(null);
    }, 300);
  };

  // Guardar en DB (Crear o Actualizar) — Productos individuales
  const handleSaveProduct = async (productData) => {
    setIsSaving(true);
    try {
      let endpoint = "";
      if (selectedCategory === "pizzas")
        endpoint = "http://localhost:3001/api/pizzas";
      if (selectedCategory === "drinks")
        endpoint = "http://localhost:3001/api/bebidas";
      if (selectedCategory === "icecream")
        endpoint = "http://localhost:3001/api/heladeria";
      if (selectedCategory === "extras")
        endpoint = "http://localhost:3001/api/extras";

      const formData = new FormData();
      formData.append("name", productData.name);
      formData.append("price", productData.price);
      formData.append("description", productData.description || "");

      if (
        (selectedCategory === "pizzas" || selectedCategory === "extras") &&
        productData.size
      ) {
        formData.append("size", productData.size);
      }

      // Evitamos añadir imagen si se trata de un extra
      if (productData.image && selectedCategory !== "extras") {
        formData.append("imagen", productData.image);
      }

      if (editingProduct) {
        const response = await axios.put(
          `${endpoint}/${editingProduct.id}`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            withCredentials: true,
          },
        );

        if (response.data.success) {
          const updatedProduct = {
            ...productData,
            id: editingProduct.id,
            category: selectedCategory,
          };
          if (response.data.url) updatedProduct.url = response.data.url;
          setProducts((prev) =>
            prev.map((p) => (p.id === editingProduct.id ? updatedProduct : p)),
          );
          window.Toast.fire({
            icon: "success",
            title: "¡Producto editado exitosamente!",
          });
        }
      } else {
        const response = await axios.post(endpoint, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        });

        if (response.data.success) {
          setProducts((prev) => [
            ...prev,
            {
              ...productData,
              id: response.data.id,
              url: response.data.url,
              category: selectedCategory,
            },
          ]);
          window.Toast.fire({
            icon: "success",
            title: "¡Producto creado exitosamente!",
          });
        }
      }
      closeModal();
    } catch (error) {
      console.error("Error al guardar:", error);
      window.Toast.fire({
        icon: "error",
        title: error.response?.data?.message || "Error al guardar el producto",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Guardar en DB — Combos
  const handleSaveCombo = async (comboData) => {
    setIsSaving(true);
    try {
      const endpoint = "http://localhost:3001/api/combos";

      const formData = new FormData();
      formData.append("nombre", comboData.nombre);
      formData.append("descripcion", comboData.descripcion || "");
      formData.append("precio", comboData.precio);
      formData.append("items", JSON.stringify(comboData.items));
      if (comboData.image) formData.append("imagen", comboData.image);

      if (editingProduct) {
        const response = await axios.put(
          `${endpoint}/${editingProduct.id}`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            withCredentials: true,
          },
        );
        if (response.data.success) {
          const comboId = editingProduct.id ?? editingProduct.id_combo;
          const updatedCombo = {
            ...editingProduct,
            id: comboId,
            name: comboData.nombre,
            description: comboData.descripcion,
            price: comboData.precio,
            items: comboData.items,
            category: "combos",
          };
          if (response.data.url) updatedCombo.url = response.data.url;
          setProducts((prev) => {
            let comboReplaced = false;
            return prev.reduce((next, product) => {
              const productId = product.id ?? product.id_combo;
              if (Number(productId) !== Number(comboId)) {
                next.push(product);
              } else if (!comboReplaced) {
                next.push(updatedCombo);
                comboReplaced = true;
              }
              return next;
            }, []);
          });
          window.Toast.fire({
            icon: "success",
            title: "¡Combo actualizado exitosamente!",
          });
        }
      } else {
        const response = await axios.post(endpoint, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        });
        if (response.data.success) {
          setProducts((prev) => [
            ...prev,
            {
              id: response.data.id,
              name: comboData.nombre,
              description: comboData.descripcion,
              price: comboData.precio,
              url: response.data.url,
              items: comboData.items,
              category: "combos",
              estado: "Activo",
            },
          ]);
          window.Toast.fire({
            icon: "success",
            title: "¡Combo creado exitosamente!",
          });
        }
      }
      closeModal();
    } catch (error) {
      console.error("Error al guardar combo:", error);
      window.Toast.fire({
        icon: "error",
        title: error.response?.data?.message || "Error al guardar el combo",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id, category) => {
    window.confirmDelete(async () => {
      let endpoint = "";
      if (category === "pizzas") endpoint = "http://localhost:3001/api/pizzas";
      if (category === "drinks") endpoint = "http://localhost:3001/api/bebidas";
      if (category === "icecream")
        endpoint = "http://localhost:3001/api/heladeria";
      if (category === "extras") endpoint = "http://localhost:3001/api/extras";
      if (category === "combos") endpoint = "http://localhost:3001/api/combos";

      try {
        await axios.put(
          `${endpoint}/${id}/eliminar`,
          {},
          { withCredentials: true },
        );
        setProducts((prev) => prev.filter((p) => p.id !== id));
        window.Toast.fire({
          icon: "success",
          title:
            category === "combos"
              ? "¡Combo eliminado exitosamente!"
              : "¡Producto eliminado exitosamente!",
        });
      } catch (error) {
        window.Toast.fire({
          icon: "error",
          title:
            category === "combos"
              ? "Error al eliminar el combo"
              : "Error al eliminar el producto",
        });
      }
    });
  };

  // Función auxiliar para obtener el emoji por defecto según la categoría
  const getDefaultEmoji = (category) => {
    switch (category) {
      case "drinks":
        return "🥤";
      case "icecream":
        return "🍦";
      case "combos":
        return "🎁";
      case "extras":
      case "pizzas":
      default:
        return "🍕";
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col p-4 sm:p-6 pb-16 gap-4 sm:gap-6 overflow-y-auto w-full h-full bg-slate-50">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-pizza-red/10 rounded-2xl flex items-center justify-center shrink-0">
            <Package className="w-6 h-6 text-pizza-red" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
              Productos
            </h1>
            <p className="text-xs font-semibold text-slate-400 mt-1.5">
              {getHeaderDate()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleNewClick}
            className="bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all flex flex-1 sm:flex-none items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Nuevo Producto
          </button>
        </div>
      </header>

      {/* Cards de métricas por tipo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 shrink-0">
        {/* Total Productos */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-4 w-full min-w-0  flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-700 flex items-center justify-center text-white shrink-0 shadow-[0_4px_12px_rgba(51,65,85,0.2)]">
              <Package2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[8px] sm:text-[9px] font-extrabold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Total Productos
              </p>
              <p className="text-slate-800 text-2xl font-black leading-none mt-1">
                {isLoading ? "—" : products.length}
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block text-[9px] sm:text-[10px] font-bold text-slate-600 bg-slate-200 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
            Registrados
          </span>
        </div>

        {/* Pizzas */}
        <div className="bg-amber-50/70 border border-amber-100/80 rounded-2xl p-3 sm:p-4 w-full min-w-0  flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shrink-0 shadow-[0_4px_12px_rgba(245,158,11,0.2)]">
              <Pizza className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[8px] sm:text-[9px] font-extrabold text-amber-500 uppercase tracking-wider whitespace-nowrap">
                Pizzas
              </p>
              <p className="text-slate-800 text-2xl font-black leading-none mt-1">
                {isLoading
                  ? "—"
                  : products.filter((p) => p.category === "pizzas").length}
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block text-[9px] sm:text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
            Masa trad.
          </span>
        </div>

        {/* Bebidas */}
        <div className="bg-blue-50/70 border border-blue-100/80 rounded-2xl p-3 sm:p-4 w-full min-w-0  flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shrink-0 shadow-[0_4px_12px_rgba(59,130,246,0.2)]">
              <Coffee className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[8px] sm:text-[9px] font-extrabold text-blue-500 uppercase tracking-wider whitespace-nowrap">
                Bebidas
              </p>
              <p className="text-slate-800 text-2xl font-black leading-none mt-1">
                {isLoading
                  ? "—"
                  : products.filter((p) => p.category === "drinks").length}
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block text-[9px] sm:text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
            Refrescos
          </span>
        </div>

        {/* Helados + Extras */}
        <div className="bg-pink-50/70 border border-pink-100/80 rounded-2xl p-3 sm:p-4 w-full min-w-0  flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-pink-500 flex items-center justify-center text-white shrink-0 shadow-[0_4px_12px_rgba(236,72,153,0.2)]">
              <IceCream className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[8px] sm:text-[9px] font-extrabold text-pink-500 uppercase tracking-wider whitespace-nowrap">
                Helados y Extras
              </p>
              <p className="text-slate-800 text-2xl font-black leading-none mt-1">
                {isLoading
                  ? "—"
                  : products.filter(
                      (p) =>
                        p.category === "icecream" || p.category === "extras",
                    ).length}
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block text-[9px] sm:text-[10px] font-bold text-pink-600 bg-pink-100 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
            Postres
          </span>
        </div>
      </div>

      {/* Configuración: Precio de la Caja */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pizza-red/10 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5 text-pizza-red" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">
              Precio de la Caja
            </h3>
            <p className="text-xs text-slate-500">
              Se cobra en pedidos Para Llevar, Delivery y Pickup.
            </p>
          </div>
        </div>
        {boxPrice !== null && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
            <span className="text-sm font-bold text-slate-500">
              Actual: ${boxPrice.toFixed(2)}
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="number"
                min="0"
                step="0.01"
                value={boxPriceInput}
                onChange={(e) => setBoxPriceInput(e.target.value)}
                className="flex-1 sm:flex-none sm:w-28 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-pizza-red focus:ring-1 focus:ring-pizza-red transition-all"
                placeholder="0.00"
              />
              <button
                onClick={handleSaveBoxPrice}
                disabled={savingBox}
                className="bg-slate-900 hover:bg-black disabled:opacity-50 text-white px-3 py-2 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2"
              >
                {savingBox ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col w-full shrink-0">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col gap-3 shrink-0">
          {/* Fila superior: título + buscador */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="font-bold text-slate-800 text-base">
                Directorio de Productos
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isLoading
                  ? "Cargando..."
                  : `${filtered.length} de ${products.length} productos`}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-pizza-red focus:ring-1 focus:ring-pizza-red transition-all shadow-sm"
                />
              </div>
            </div>
          </div>
          {/* Fila inferior: filtros por tipo */}
          <div className="flex items-center gap-2 flex-wrap">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCategoryFilter(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  categoryFilter === tab.id
                    ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700"
                }`}
              >
                {tab.label}
                <span
                  className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-extrabold ${
                    categoryFilter === tab.id
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm min-w-[720px] hidden lg:table">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider w-12">
                  N°
                </th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="text-right px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <p className="font-medium">Cargando inventario...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium">No se encontraron productos</p>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product, index) => (
                  <tr
                    key={`${product.category}-${product.id}`}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold">
                        {(safePage - 1) * PAGE_SIZE + index + 1}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xl shrink-0 overflow-hidden border border-slate-200">
                          {product.url ? (
                            <img
                              src={product.url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>
                              {product.emoji ||
                                getDefaultEmoji(product.category)}
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 block">
                            {product.name}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                            {
                              CATEGORY_TYPES.find(
                                (c) => c.id === product.category,
                              )?.label
                            }
                            {(product.category === "pizzas" ||
                              product.category === "extras") &&
                              (product.pizzaCategory ||
                                product.extraCategory) && (
                                <span className="text-slate-500 font-semibold">
                                  •{" "}
                                  {product.pizzaCategory ||
                                    product.extraCategory}
                                </span>
                              )}
                            {product.category === "combos" &&
                              product.items?.length > 0 && (
                                <span className="text-slate-500 font-semibold normal-case truncate max-w-[220px]">
                                  •{" "}
                                  {product.items
                                    .map((item) => item.nombre_producto)
                                    .filter(Boolean)
                                    .join(", ")}
                                </span>
                              )}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {product.description}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="font-bold text-emerald-600">
                        ${Number(product.price).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditClick(product)}
                          className="opacity-100 lg:opacity-0  lg:group-hover:opacity-100 text-slate-400 hover:text-slate-800 transition-all p-1.5 rounded-lg hover:bg-slate-100"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(product.id, product.category)
                          }
                          className="opacity-100 lg:opacity-0  lg:group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all p-1.5 rounded-lg hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {/* Vista Móvil: Cards */}
          <div className="lg:hidden flex flex-col gap-3 p-4">
            {isLoading ? (
              <div className="text-center py-12 text-slate-400">
                <div className="w-8 h-8 rounded-full border-4 border-pizza-red/20 border-t-pizza-red animate-spin mx-auto mb-2"></div>
                <p className="font-medium">Cargando productos...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="font-medium">No se encontraron productos</p>
              </div>
            ) : (
              paginatedProducts.map((product) => {
                const categoryLabel =
                  CATEGORY_TYPES.find((c) => c.id === product.category)
                    ?.label || product.category;
                const subCategory =
                  product.category === "pizzas" || product.category === "extras"
                    ? product.pizzaCategory || product.extraCategory
                    : null;
                const comboItems =
                  product.category === "combos" && product.items?.length > 0
                    ? product.items
                        .map((i) => i.nombre_producto)
                        .filter(Boolean)
                        .join(", ")
                    : null;

                return (
                  <div
                    key={`${product.category}-${product.id}`}
                    className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"
                  >
                    {/* Header: Imagen/Emoji, Nombre, Categoría y Precio */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-2xl shrink-0 overflow-hidden border border-slate-200">
                        {product.url ? (
                          <img
                            src={product.url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>
                            {product.emoji || getDefaultEmoji(product.category)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 truncate">
                          {product.name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {categoryLabel}
                          </span>
                          {(subCategory || comboItems) && (
                            <span className="text-[10px] font-semibold text-slate-400 truncate">
                              • {subCategory || comboItems}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-extrabold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 whitespace-nowrap">
                        ${Number(product.price).toFixed(2)}
                      </span>
                    </div>

                    {/* Body: Descripción */}
                    {product.description && (
                      <p className="text-xs text-slate-500 mb-4 line-clamp-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        {product.description}
                      </p>
                    )}

                    {/* Footer: Acciones (Editar / Eliminar) */}
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => handleEditClick(product)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all border border-slate-200"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Editar
                      </button>
                      <button
                        onClick={() =>
                          handleDelete(product.id, product.category)
                        }
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-red-200"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        {!isLoading && filtered.length > 0 && (
          <Pagination
            currentPage={safePage}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
            itemName="producto(s)"
          />
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6">
          <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]">
            <div className="bg-slate-800 p-6 text-white relative">
              <button
                onClick={closeModal}
                className="absolute right-4 top-4 p-1.5 bg-slate-700 hover:bg-slate-600 rounded-full text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <h2 className="text-xl font-bold mb-1">
                {editingProduct
                  ? selectedCategory === "combos"
                    ? "Editar Combo"
                    : "Editar Producto"
                  : modalStep === 1
                    ? "¿Qué vas a registrar?"
                    : selectedCategory === "combos"
                      ? "Nuevo Combo"
                      : "Detalles del Producto"}
              </h2>
              <p className="text-slate-400 text-sm">
                {editingProduct
                  ? "Modifica la información a continuación"
                  : modalStep === 1
                    ? "Selecciona la categoría del producto"
                    : selectedCategory === "combos"
                      ? "Configura los productos y el precio del combo"
                      : "Completa la información requerida"}
              </p>
              {!editingProduct && (
                <div className="flex items-center mt-6 text-sm">
                  <span
                    className={`font-bold ${modalStep === 1 ? "text-white" : "text-slate-400"}`}
                  >
                    <span
                      className={`inline-flex items-center justify-center w-5 h-5 rounded-full mr-2 text-xs ${modalStep === 1 ? "bg-white text-slate-900" : "bg-slate-700"}`}
                    >
                      1
                    </span>
                    Categoría
                  </span>
                  <div className="flex-1 h-px bg-slate-600 mx-4" />
                  <span
                    className={`font-bold ${modalStep === 2 ? "text-white" : "text-slate-400"}`}
                  >
                    <span
                      className={`inline-flex items-center justify-center w-5 h-5 rounded-full mr-2 text-xs ${modalStep === 2 ? "bg-white text-slate-900" : "bg-slate-700"}`}
                    >
                      2
                    </span>
                    Detalles
                  </span>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto">
              {modalStep === 1 && !editingProduct ? (
                <div className="flex flex-col gap-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {CATEGORY_TYPES.map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = selectedCategory === cat.id;
                      return (
                        <div
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`relative border-2 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${isSelected ? `${cat.colorSelected} shadow-md scale-[1.02]` : "border-slate-100 hover:border-slate-300 hover:bg-slate-50"}`}
                        >
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-colors ${isSelected ? "bg-white/20" : cat.colorLight}`}
                          >
                            <Icon
                              className={`w-6 h-6 ${isSelected ? "text-white" : cat.colorIcon}`}
                            />
                          </div>
                          <span
                            className={`font-bold block ${isSelected ? "text-white" : "text-slate-800"}`}
                          >
                            {cat.label}
                          </span>
                          <span
                            className={`text-xs mt-1 ${isSelected ? "text-white/80" : "text-slate-500"}`}
                          >
                            {cat.sublabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setModalStep(2)}
                    disabled={!selectedCategory}
                    className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 text-white py-3.5 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center"
                  >
                    Siguiente
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg flex gap-4 mb-2">
                    <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
                      {(() => {
                        const Icon = CATEGORY_TYPES.find(
                          (c) => c.id === selectedCategory,
                        )?.icon;
                        return Icon ? (
                          <Icon className="w-5 h-5 text-slate-700" />
                        ) : null;
                      })()}
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase">
                        Categoría Seleccionada
                      </p>
                      <p className="text-sm font-bold text-slate-800">
                        {
                          CATEGORY_TYPES.find((c) => c.id === selectedCategory)
                            ?.label
                        }
                      </p>
                    </div>
                  </div>
                  {selectedCategory === "combos" ? (
                    <ComboForm
                      initial={editingProduct}
                      isSaving={isSaving}
                      onSave={handleSaveCombo}
                      onCancel={() =>
                        editingProduct ? closeModal() : setModalStep(1)
                      }
                    />
                  ) : (
                    <ProductForm
                      initial={editingProduct}
                      category={selectedCategory}
                      isSaving={isSaving}
                      onSave={handleSaveProduct}
                      onCancel={() =>
                        editingProduct ? closeModal() : setModalStep(1)
                      }
                      branches={branches || []}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
