import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useApp } from "../context/AppContext";

const API_BASE = "http://localhost:3001/api";

const api = axios.create({
  baseURL: "http://localhost:3001/api",
  withCredentials: true,
});

const normalizePizza = (p) => ({
  id: p.id || p.id_pizza,
  name: p.name || p.nombre,
  price: Number(p.price || p.precio),
  description: p.description || p.descripcion,
  category: "pizzas",
  size: p.size || p.categoria_nombre || "Normal",
  pizzaCategory: p.pizzaCategory || p.categoria_nombre || "Normal",
  url: p.url || null,
  estado: p.estado || "Activo",
  emoji: "🍕",
});

const normalizeBebida = (b) => ({
  id: b.id || b.id_bebida,
  name: b.name || b.nombre,
  price: Number(b.price || b.precio),
  description: b.description || b.descripcion,
  category: "drinks",
  url: b.url || null,
  estado: b.estado || "Activo",
  emoji: "🥤",
});

const normalizeHelado = (h) => ({
  id: h.id ?? h.id_helado ?? h.id_heladeria ?? h.id_producto,
  name: h.name || h.nombre,
  price: Number(h.price || h.precio),
  description: h.description || h.descripcion,
  category: "icecream",
  url: h.url || null,
  estado: h.estado || "Activo",
  emoji: "🍦",
});

const normalizeCombo = (c) => ({
  ...c,
  id: c.id || c.id_combo,
  name: c.name || c.nombre,
  price: Number(c.price || c.precio),
  description: c.description || c.descripcion,
  category: "combos",
  estado: c.estado || "Activo",
  url: c.url || null,
  items: c.items || [],
  emoji: "🎁",
});

const fetchCategory = async (endpoint) => {
  try {
    const { data } = await api.get(endpoint);
    return data?.data || [];
  } catch (error) {
    console.error(`Error cargando ${endpoint}:`, error);
    return [];
  }
};

export function useProducts() {
  const { currentUser } = useApp();
  return useQuery({
    queryKey: ["products"],
    staleTime: 5 * 60_000, // La data es "fresca" por 5 minutos
    refetchOnWindowFocus: false, // No recargar al cambiar de pestaña del PC
    refetchOnMount: false,
    enabled: !!currentUser,
    queryFn: async () => {
      const [pizzas, drinks, icecream, extras, combos, categoriesPizza] =
        await Promise.all([
          fetchCategory("/pizzas"),
          fetchCategory("/bebidas"),
          fetchCategory("/heladeria"),
          fetchCategory("/extras"),
          fetchCategory("/combos"),
          fetchCategory("/categorias-pizza"),
        ]);
      return {
        pizzas: pizzas.map(normalizePizza),
        drinks: drinks.map(normalizeBebida),
        icecream: icecream.map(normalizeHelado),
        extras: extras.map(normalizeExtra),
        combos: combos.map(normalizeCombo),
        categoriesPizza,
      };
    },
  });
}

const normalizeExtra = (e) => ({
  id: e.id || e.id_extras,
  id_categoria_pizza: e.id_categoria_pizza,
  name: e.name || e.nombre,
  price: Number(e.price || e.precio),
  category: "extras",
  size: e.size || e.categoria_nombre || "Normal",
  extraCategory: e.extraCategory || e.categoria_nombre || null,
  estado: e.estado || "Activo",
});

export function useExtras() {
  const { currentUser } = useApp();
  return useQuery({
    queryKey: ["extras"],
    staleTime: 5 * 60_000, // Aumentado a 5 minutos para consistencia
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: !!currentUser,
    queryFn: async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/extras`);
        return (data?.data || []).map(normalizeExtra);
      } catch (error) {
        console.error("Error cargando extras:", error);
        return [];
      }
    },
  });
}
