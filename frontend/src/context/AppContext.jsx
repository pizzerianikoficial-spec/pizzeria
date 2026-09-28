import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { MOCK_SALES } from "../data/mockData";
import { tieneExtrasGratis } from "../utils/extrasPrecio";

const AppContext = createContext(null);

export const KITCHEN_CATEGORIES = ["pizzas", "combos"];

const DEFAULT_BOX_PRICE = 1;
const BOX_ORDER_TYPES = new Set(["takeaway", "pickup", "PickUp", "delivery"]);

// ── Cajas como ítems del carrito
export const BOX_CATEGORY = "cajas";
const BOX_PRODUCT_ID = "caja";

export const isBoxItem = (item) =>
  String(item?.category || "").toLowerCase() === BOX_CATEGORY;

// Caja "editable"
const isEditableBox = (item) => isBoxItem(item) && !item.isPendingExisting;
const findBoxIndex = (items) => items.findIndex(isEditableBox);
const removeEditableBoxes = (items) =>
  items.some(isEditableBox) ? items.filter((i) => !isEditableBox(i)) : items;

const createBoxItem = (qty, price) => ({
  id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
  productId: BOX_PRODUCT_ID,
  productOriginId: BOX_PRODUCT_ID,
  name: "Caja",
  basePrice: price,
  price,
  size: null,
  qty,
  extras: [],
  category: BOX_CATEGORY,
  emoji: "📦",
  isPendingExisting: false,
});

const initialState = {
  // Authentication
  currentUser: null,

  // Precio dinámico de la caja (cargado desde la tabla `caja`)
  boxPrice: DEFAULT_BOX_PRICE,

  // Current cashier order (cart)
  currentOrder: {
    items: [],
    payments: [],
    orderType: null, // 'local' | 'takeaway' | 'delivery' | 'pickup'
    includesBox: false,
    paymentStatus: null, // 'paid' | 'partial' | 'pending'  (only for delivery/pickup)
    advanceAmount: 0, // monto abonado si paymentStatus === 'partial'
    advancePaymentMethod: null, // método usado para el abono
    advanceCurrency: "USD", // moneda original del abono
    pendingSaleId: null,
    pendingOriginalTotal: null,
    pendingRemaining: null,
    customer: null, // { id?, name, cedula, phone? }
    phoneLastDigits: "", // últimos 4 dígitos del teléfono (delivery)
    deliveryId: null,
  },

  // Customers
  customers: [
    {
      id: 1,
      cedula: "V-12345678",
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
      cedula: "V-123",
      name: "Carlos Ramírez",
      phone: "0416-5553210",
      orders: 22,
      total: 512.75,
      lastVisit: "2026-07-18",
    },
  ],

  // Historical sales (se sobreescribirán con datos reales)
  sales: MOCK_SALES,
};

const TAX_RATE = 0.16;

const normalizeRole = (role) => {
  if (!role) return "cashier";

  const roleMap = {
    administrador: "admin",
    admin: "admin",
    cajero: "cashier",
    cashier: "cashier",
    cocinero: "chef",
    chef: "chef",
    pizzero: "chef",
    mesero: "mesero",
    waiter: "waiter",
    despachador: "despachador",
    cashierdelivery: "cashierdelivery",
    "caja delivery": "cashierdelivery",
    "cajero delivery": "cashierdelivery",
  };

  const normalized = String(role).trim().toLowerCase();
  return roleMap[normalized] || normalized;
};

const calculateItemPrice = (
  basePrice,
  size,
  extras = [],
  nombreProducto = "",
) => {
  let multiplier = 1;
  if (size === "Mediana") multiplier = 1.3;
  if (size === "Familiar") multiplier = 1.6;
  const extrasCost = tieneExtrasGratis(nombreProducto)
    ? 0
    : extras.reduce((sum, e) => sum + e.price, 0);
  return basePrice * multiplier + extrasCost;
};

function reducer(state, action) {
  switch (action.type) {
    // ── CART ──────────────────────────────────────────────────
    case "ADD_TO_CART": {
      const { product, size } = action.payload;
      const existingIdx = state.currentOrder.items.findIndex(
        (i) =>
          i.productId === product.id &&
          i.size === (size || null) &&
          (!i.extras || i.extras.length === 0) &&
          (!state.currentOrder.pendingSaleId || !i.isPendingExisting),
      );
      if (existingIdx >= 0) {
        const items = [...state.currentOrder.items];
        items[existingIdx] = {
          ...items[existingIdx],
          qty: items[existingIdx].qty + 1,
        };
        return { ...state, currentOrder: { ...state.currentOrder, items } };
      }
      const newItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        productId: product.id,
        productOriginId:
          product.id ?? product.id_helado ?? product.id_heladeria,
        name: product.name,
        basePrice: product.price,
        price: calculateItemPrice(
          product.price,
          size || null,
          [],
          product.name,
        ),
        size: size || null,
        qty: 1,
        extras: [],
        category: product.category,
        emoji: product.emoji,
        isPendingExisting: false,
      };
      return {
        ...state,
        currentOrder: {
          ...state.currentOrder,
          items: [...state.currentOrder.items, newItem],
        },
      };
    }

    case "UPDATE_ITEM_QTY": {
      const items = state.currentOrder.items.map((item) =>
        item.id === action.payload.id
          ? { ...item, qty: Math.max(1, action.payload.qty) }
          : item,
      );
      return { ...state, currentOrder: { ...state.currentOrder, items } };
    }

    case "UPDATE_ITEM_SIZE": {
      const items = state.currentOrder.items.map((item) => {
        if (item.id !== action.payload.id) return item;
        return {
          ...item,
          size: action.payload.size,
          price: calculateItemPrice(
            item.basePrice,
            action.payload.size,
            item.extras,
            item.name,
          ),
        };
      });
      return { ...state, currentOrder: { ...state.currentOrder, items } };
    }

    case "UPDATE_ITEM_EXTRAS": {
      const { id, extras } = action.payload;
      const itemIndex = state.currentOrder.items.findIndex((i) => i.id === id);
      if (itemIndex === -1) return state;
      const item = state.currentOrder.items[itemIndex];

      if (item.qty > 1 && extras.length > 0) {
        const originalItem = { ...item, qty: item.qty - 1 };
        const newItem = {
          ...item,
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          qty: 1,
          extras,
          price: calculateItemPrice(
            item.basePrice,
            item.size,
            extras,
            item.name,
          ),
        };
        const newItems = [...state.currentOrder.items];
        newItems.splice(itemIndex, 1, originalItem, newItem);
        return {
          ...state,
          currentOrder: { ...state.currentOrder, items: newItems },
        };
      } else {
        const items = state.currentOrder.items.map((i) => {
          if (i.id !== id) return i;
          return {
            ...i,
            extras,
            price: calculateItemPrice(i.basePrice, i.size, extras, i.name),
          };
        });
        return { ...state, currentOrder: { ...state.currentOrder, items } };
      }
    }

    case "REMOVE_ITEM": {
      const items = state.currentOrder.items.filter(
        (i) => i.id !== action.payload.id,
      );
      return { ...state, currentOrder: { ...state.currentOrder, items } };
    }

    case "UPDATE_ITEM_NOTE": {
      const { id, note } = action.payload;
      const items = state.currentOrder.items.map((i) =>
        i.id === id ? { ...i, note } : i,
      );
      return { ...state, currentOrder: { ...state.currentOrder, items } };
    }

    case "CLEAR_CART":
      return {
        ...state,
        currentOrder: {
          items: [],
          payments: [],
          orderType: null,
          paymentStatus: null,
          advanceAmount: 0,
          advancePaymentMethod: null,
          advanceCurrency: "USD",
          pendingSaleId: null,
          pendingOriginalTotal: null,
          pendingRemaining: null,
          customer: null,
          phoneLastDigits: "",
          deliveryId: null,
        },
      };

    case "SET_ORDER_TYPE": {
      const {
        orderType,
        paymentStatus,
        advanceAmount,
        advancePaymentMethod,
        advanceCurrency,
        customer,
        phoneLastDigits,
        deliveryId,
        includesBox,
      } = action.payload;
      let items = state.currentOrder.items;
      if (!BOX_ORDER_TYPES.has(orderType) || includesBox === false) {
        items = removeEditableBoxes(items);
      } else if (includesBox === true && findBoxIndex(items) === -1) {
        items = [...items, createBoxItem(1, state.boxPrice)];
      }
      return {
        ...state,
        currentOrder: {
          ...state.currentOrder,
          items,
          orderType,
          paymentStatus: paymentStatus || null,
          advanceAmount: advanceAmount || 0,
          advancePaymentMethod: advancePaymentMethod || null,
          advanceCurrency: advanceCurrency || "USD",
          customer: customer || null,
          phoneLastDigits: phoneLastDigits || "",
          deliveryId: deliveryId || null,
        },
      };
    }

    case "SET_INCLUDES_BOX": {
      // Compatibilidad: true => al menos 1 caja, false => quita todas
      const { items, orderType } = state.currentOrder;
      let nextItems = items;
      if (!action.payload) {
        nextItems = removeEditableBoxes(items);
      } else if (BOX_ORDER_TYPES.has(orderType) && findBoxIndex(items) === -1) {
        nextItems = [...items, createBoxItem(1, state.boxPrice)];
      }
      if (nextItems === items) return state;
      return {
        ...state,
        currentOrder: { ...state.currentOrder, items: nextItems },
      };
    }

    case "SET_BOX_QTY": {
      const qty = Math.max(0, Math.floor(Number(action.payload) || 0));
      const { items, orderType } = state.currentOrder;
      let nextItems = items;

      if (qty === 0) {
        nextItems = removeEditableBoxes(items);
      } else if (BOX_ORDER_TYPES.has(orderType)) {
        const idx = findBoxIndex(items);
        nextItems =
          idx >= 0
            ? items.map((it, i) => (i === idx ? { ...it, qty } : it))
            : [...items, createBoxItem(qty, state.boxPrice)];
      }

      if (nextItems === items) return state;
      return {
        ...state,
        currentOrder: { ...state.currentOrder, items: nextItems },
      };
    }

    case "ADD_BOXES": {
      // Regla de negocio: solo takeaway / pickup / delivery
      if (!BOX_ORDER_TYPES.has(state.currentOrder.orderType)) return state;

      const amount = Math.max(1, Math.floor(Number(action.payload) || 1));
      const items = state.currentOrder.items;
      const idx = findBoxIndex(items);

      // Igual que ADD_TO_CART: si ya hay una caja, se incrementa su qty
      const nextItems =
        idx >= 0
          ? items.map((it, i) =>
              i === idx ? { ...it, qty: it.qty + amount } : it,
            )
          : [...items, createBoxItem(amount, state.boxPrice)];

      return {
        ...state,
        currentOrder: { ...state.currentOrder, items: nextItems },
      };
    }

    case "SET_BOX_PRICE": {
      const boxPrice = Number(action.payload) || DEFAULT_BOX_PRICE;
      // Si el precio llega después de agregar cajas, se actualizan las del carrito
      const items = state.currentOrder.items.some(isEditableBox)
        ? state.currentOrder.items.map((it) =>
            isEditableBox(it)
              ? { ...it, basePrice: boxPrice, price: boxPrice }
              : it,
          )
        : state.currentOrder.items;
      return {
        ...state,
        boxPrice,
        currentOrder: { ...state.currentOrder, items },
      };
    }

    case "LOAD_PENDING_ORDER": {
      // boxQty / includesBox ahora se derivan de `items`.
      const {
        boxQty: legacyBoxQty,
        includesBox: legacyIncludesBox,
        ...payload
      } = action.payload;

      const items = Array.isArray(payload.items)
        ? payload.items
        : state.currentOrder.items;

      const legacyQty =
        Number(legacyBoxQty) > 0
          ? Math.floor(Number(legacyBoxQty))
          : legacyIncludesBox
            ? 1
            : 0;

      const finalItems =
        legacyQty > 0 && !items.some(isBoxItem)
          ? [...items, createBoxItem(legacyQty, state.boxPrice)]
          : items;

      return {
        ...state,
        currentOrder: {
          ...state.currentOrder,
          ...payload,
          items: finalItems,
          payments: payload.payments || [],
        },
      };
    }

    // ── PAYMENT ───────────────────────────────────────────────
    case "ADD_PAYMENT": {
      const payments = [...state.currentOrder.payments, action.payload];
      return { ...state, currentOrder: { ...state.currentOrder, payments } };
    }

    case "CONFIRM_SALE": {
      const { total, items, payments, orderType } = action.payload;
      const newSale = {
        id: `SALE-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        date: new Date().toISOString(),
        cashier: "Carlos Rodríguez",
        branch: "Centro",
        items: items.length,
        total,
        paymentMethod: payments.map((p) => p.method).join(" + "),
        orderType: orderType || "unknown",
        status: "completed",
      };
      return {
        ...state,
        sales: [newSale, ...state.sales],
        currentOrder: { items: [], payments: [] },
      };
    }

    case "ADD_CUSTOMER": {
      const customer = { ...action.payload, id: Date.now() };
      return { ...state, customers: [customer, ...state.customers] };
    }

    // ── AUTHENTICATION ─────────────────────────────────────────────────────
    case "LOGIN":
      return { ...state, currentUser: action.payload };
    case "LOGOUT":
      return { ...state, currentUser: null };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const savedUser = (() => {
    try {
      const u = JSON.parse(localStorage.getItem("currentUser")) || null;
      if (u) {
        return {
          ...u,
          role: normalizeRole(u.role || u.rol),
        };
      }
      return null;
    } catch {
      return null;
    }
  })();
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    currentUser: savedUser,
  });

  // Cart totals — sin IVA
  const subtotal = state.currentOrder.items.reduce(
    (sum, i) => sum + i.price * i.qty,
    0,
  );
  const tax = 0; // IVA eliminado
  // Cajas: ahora son ítems de `items`, así que ya están dentro del subtotal.
  const boxItems = state.currentOrder.items.filter(isBoxItem);
  const boxQty = boxItems.reduce((sum, i) => sum + Number(i.qty || 0), 0);
  const includesBox = boxQty > 0;
  const boxTotal = boxItems.reduce(
    (sum, i) => sum + Number(i.price || 0) * Number(i.qty || 0),
    0,
  ); // informativo: NO se suma al total (ya está en subtotal)
  const total = subtotal + tax;

  // currentOrder con boxQty / includesBox calculados (lo leen otros componentes)
  const currentOrder = useMemo(
    () => ({ ...state.currentOrder, boxQty, includesBox }),
    [state.currentOrder, boxQty, includesBox],
  );
  const amountPaid = state.currentOrder.payments.reduce(
    (sum, p) => sum + p.amount,
    0,
  );
  const remaining = Math.max(0, total - amountPaid);

  const addToCart = useCallback(
    (product, size) =>
      dispatch({ type: "ADD_TO_CART", payload: { product, size } }),
    [],
  );
  const updateItemQty = useCallback(
    (id, qty) => dispatch({ type: "UPDATE_ITEM_QTY", payload: { id, qty } }),
    [],
  );
  const updateItemSize = useCallback(
    (id, size) => dispatch({ type: "UPDATE_ITEM_SIZE", payload: { id, size } }),
    [],
  );
  const updateItemExtras = useCallback(
    (id, extras) =>
      dispatch({ type: "UPDATE_ITEM_EXTRAS", payload: { id, extras } }),
    [],
  );
  const updateItemNote = useCallback(
    (id, note) => dispatch({ type: "UPDATE_ITEM_NOTE", payload: { id, note } }),
    [],
  );
  const removeItem = useCallback(
    (id) => dispatch({ type: "REMOVE_ITEM", payload: { id } }),
    [],
  );
  const clearCart = useCallback(() => dispatch({ type: "CLEAR_CART" }), []);
  const setIncludesBox = useCallback(
    (includesBox) =>
      dispatch({ type: "SET_INCLUDES_BOX", payload: includesBox }),
    [],
  );
  const setBoxQty = useCallback(
    (qty) => dispatch({ type: "SET_BOX_QTY", payload: qty }),
    [],
  );
  const addBoxes = useCallback(
    (qty) => dispatch({ type: "ADD_BOXES", payload: qty }),
    [],
  );
  const setBoxPrice = useCallback(
    (precio) => dispatch({ type: "SET_BOX_PRICE", payload: precio }),
    [],
  );

  // Cargar el precio de la caja desde la DB cuando hay sesión activa
  useEffect(() => {
    if (!state.currentUser) return;
    let activo = true;
    const cargarCaja = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/caja", {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (activo && data.success && data.caja) {
          dispatch({ type: "SET_BOX_PRICE", payload: data.caja.precio_caja });
        }
      } catch (error) {
        console.error("Error cargando precio de caja:", error);
      }
    };
    cargarCaja();
    return () => {
      activo = false;
    };
  }, [state.currentUser]);
  const setOrderType = useCallback(
    (
      orderType,
      paymentStatus,
      advanceAmount,
      customer,
      phoneLastDigits,
      deliveryId,
      advancePaymentMethod,
      advanceCurrency,
      includesBox,
    ) =>
      dispatch({
        type: "SET_ORDER_TYPE",
        payload: {
          orderType,
          paymentStatus,
          advanceAmount,
          customer,
          phoneLastDigits,
          deliveryId,
          advancePaymentMethod,
          advanceCurrency,
          includesBox,
        },
      }),
    [],
  );
  const addPayment = useCallback(
    (payment) => dispatch({ type: "ADD_PAYMENT", payload: payment }),
    [],
  );
  const loadPendingOrder = useCallback(
    (order) => dispatch({ type: "LOAD_PENDING_ORDER", payload: order }),
    [],
  );
  const confirmSale = useCallback(
    (payload) => dispatch({ type: "CONFIRM_SALE", payload }),
    [],
  );
  const addCustomer = useCallback(
    (customer) => dispatch({ type: "ADD_CUSTOMER", payload: customer }),
    [],
  );

  const login = useCallback(async (email, password) => {
    try {
      const res = await fetch("http://localhost:3001/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: String(email || "").trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.user) {
        return {
          success: false,
          message: data?.message || "Credenciales inválidas",
        };
      }

      const normalizedUser = {
        id: data.user.id ?? data.user.id_login ?? data.user.id_usuario,
        email: data.user.email,
        role: normalizeRole(data.user.role ?? data.user.rol),
        name: data.user.nombre || data.user.name || data.user.email,
        sucursal: data.user.sucursal ?? data.user.id_sucursal ?? null,
        id_sucursal: data.user.id_sucursal ?? null,
        estado: data.user.estado,
      };

      dispatch({ type: "LOGIN", payload: normalizedUser });
      localStorage.setItem("currentUser", JSON.stringify(normalizedUser));
      if (data.token) {
        localStorage.setItem("authToken", data.token);
      }

      return { success: true, user: normalizedUser, token: data.token };
    } catch (error) {
      console.error("Error en login desde API:", error);
      return {
        success: false,
        message: "No se pudo conectar con el servidor",
      };
    }
  }, []);

  const logout = useCallback(() => {
    dispatch({ type: "LOGOUT" });
    localStorage.removeItem("currentUser");
    localStorage.removeItem("authToken");
  }, []);

  const contextValue = useMemo(
    () => ({
      ...state,
      currentOrder,
      subtotal,
      tax,
      total,
      boxQty,
      includesBox,
      boxTotal,
      amountPaid,
      remaining,
      TAX_RATE,
      KITCHEN_CATEGORIES,
      setBoxPrice,
      setBoxQty,
      addBoxes,
      addToCart,
      updateItemQty,
      updateItemSize,
      updateItemExtras,
      updateItemNote,
      removeItem,
      clearCart,
      setIncludesBox,
      setOrderType,
      addPayment,
      loadPendingOrder,
      confirmSale,
      addCustomer,
      login,
      logout,
    }),
    [
      state,
      currentOrder,
      subtotal,
      tax,
      total,
      boxQty,
      includesBox,
      boxTotal,
      amountPaid,
      remaining,
      setBoxPrice,
      setBoxQty,
      addBoxes,
      addToCart,
      updateItemQty,
      updateItemSize,
      updateItemExtras,
      updateItemNote,
      removeItem,
      clearCart,
      setIncludesBox,
      setOrderType,
      addPayment,
      loadPendingOrder,
      confirmSale,
      addCustomer,
      login,
      logout,
    ],
  );

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
