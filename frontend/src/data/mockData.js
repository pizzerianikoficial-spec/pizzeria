// ============================================================
// DATOS MOCK — Sistema de Gestión Pizzería
// ============================================================

export const PRODUCTS = {
  pizzas: [
    {
      id: "p1",
      category: "pizzas",
      name: "Margarita Clásica",
      price: 12.0,
      description: "Salsa de tomate, mozzarella, albahaca fresca",
      sizes: ["Normal", "Familiar", "Gigante"],
      emoji: "🍕",
      image:
        "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=400&auto=format&fit=crop",
      available: true,
    },
    {
      id: "p2",
      category: "pizzas",
      name: "Pepperoni Suprema",
      price: 14.5,
      description: "Doble pepperoni, mozzarella, orégano",
      sizes: ["Normal", "Familiar", "Gigante"],
      emoji: "🍕",
      image:
        "https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=400&auto=format&fit=crop",
      available: true,
    },
    {
      id: "p3",
      category: "pizzas",
      name: "BBQ Chicken",
      price: 15.0,
      description: "Pollo a la BBQ, cebolla caramelizada, jalapeños",
      sizes: ["Normal", "Familiar", "Gigante"],
      emoji: "🍕",
      image:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=400&auto=format&fit=crop",
      available: true,
    },
    {
      id: "p4",
      category: "pizzas",
      name: "Cuatro Quesos",
      price: 16.0,
      description: "Mozzarella, gorgonzola, parmesano, brie",
      sizes: ["Normal", "Familiar", "Gigante"],
      emoji: "🍕",
      image:
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=400&auto=format&fit=crop",
      available: true,
    },
    {
      id: "p5",
      category: "pizzas",
      name: "Vegetariana",
      price: 13.0,
      description: "Pimientos, champiñones, aceitunas, rúcula",
      sizes: ["Normal", "Familiar", "Gigante"],
      emoji: "🥦",
      image:
        "https://images.unsplash.com/photo-1576458088443-04a19bb13da6?q=80&w=400&auto=format&fit=crop",
      available: true,
    },
    {
      id: "p6",
      category: "pizzas",
      name: "Hawaiana",
      price: 13.5,
      description: "Jamón, piña, mozzarella, salsa de tomate",
      sizes: ["Normal", "Familiar", "Gigante"],
      emoji: "🍍",
      image:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=400&auto=format&fit=crop",
      available: true,
    },
    {
      id: "p7",
      category: "pizzas",
      name: "Carne Asada",
      price: 17.0,
      description: "Carne de res, pimientos, cebolla, chimichurri",
      sizes: ["Normal", "Familiar"],
      emoji: "🥩",
      image:
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=400&auto=format&fit=crop",
      available: true,
    },
    {
      id: "p8",
      category: "pizzas",
      name: "Mariscos",
      price: 18.5,
      description: "Camarones, calamares, salsa blanca, limón",
      sizes: ["Normal", "Familiar"],
      emoji: "🦐",
      image:
        "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?q=80&w=400&auto=format&fit=crop",
      available: true,
    },
  ],
  drinks: [
    {
      id: "d1",
      category: "drinks",
      name: "Coca-Cola",
      price: 2.5,
      description: "Lata 355ml",
      sizes: [],
      emoji: "🥤",
      available: true,
    },
    {
      id: "d2",
      category: "drinks",
      name: "Pepsi",
      price: 2.5,
      description: "Lata 355ml",
      sizes: [],
      emoji: "🥤",
      available: true,
    },
    {
      id: "d3",
      category: "drinks",
      name: "Agua Mineral",
      price: 1.5,
      description: "Botella 500ml",
      sizes: [],
      emoji: "💧",
      available: true,
    },
    {
      id: "d4",
      category: "drinks",
      name: "Jugo de Naranja",
      price: 3.0,
      description: "Natural, 350ml",
      sizes: [],
      emoji: "🍊",
      available: true,
    },
    {
      id: "d5",
      category: "drinks",
      name: "Cerveza Artesanal",
      price: 4.5,
      description: "Botella 330ml",
      sizes: [],
      emoji: "🍺",
      available: true,
    },
    {
      id: "d6",
      category: "drinks",
      name: "Limonada",
      price: 3.5,
      description: "Natural con hierbabuena",
      sizes: [],
      emoji: "🍋",
      available: true,
    },
    {
      id: "d7",
      category: "drinks",
      name: "Té Helado",
      price: 2.8,
      description: "Durazno o Limón",
      sizes: [],
      emoji: "🧋",
      available: true,
    },
    {
      id: "d8",
      category: "drinks",
      name: "Vino de la Casa",
      price: 6.0,
      description: "Copa 150ml",
      sizes: [],
      emoji: "🍷",
      available: true,
    },
  ],
  icecream: [
    {
      id: "i1",
      category: "icecream",
      name: "Helado Vainilla",
      price: 3.0,
      description: "Bola doble con toppings",
      sizes: [],
      emoji: "🍦",
      available: true,
    },
    {
      id: "i2",
      category: "icecream",
      name: "Helado Chocolate",
      price: 3.0,
      description: "Bola doble con chispas",
      sizes: [],
      emoji: "🍫",
      available: true,
    },
    {
      id: "i3",
      category: "icecream",
      name: "Sundae Especial",
      price: 5.5,
      description: "Helado, caramelo, crema y nueces",
      sizes: [],
      emoji: "🍨",
      available: true,
    },
    {
      id: "i4",
      category: "icecream",
      name: "Banana Split",
      price: 6.0,
      description: "Tres helados, banana, chocolate y fresa",
      sizes: [],
      emoji: "🍌",
      available: true,
    },
    {
      id: "i5",
      category: "icecream",
      name: "Milkshake Fresa",
      price: 5.0,
      description: "Batido cremoso de fresa natural",
      sizes: [],
      emoji: "🍓",
      available: true,
    },
    {
      id: "i6",
      category: "icecream",
      name: "Milkshake Oreo",
      price: 5.5,
      description: "Batido con galleta Oreo triturada",
      sizes: [],
      emoji: "🖤",
      available: true,
    },
  ],
  combos: [
    {
      id: "c1",
      category: "combos",
      name: "Combo Pareja",
      price: 18.0,
      description: "1 Pizza Mediana + 2 Bebidas",
      sizes: [],
      emoji: "💑",
      image:
        "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=400&auto=format&fit=crop",
      available: true,
    },
    {
      id: "c2",
      category: "combos",
      name: "Combo Familiar",
      price: 28.0,
      description: "1 Pizza Familiar + 1 Pizza Personal + Bebida Grande",
      sizes: [],
      emoji: "👨‍👩‍👧‍👦",
      image:
        "https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=400&auto=format&fit=crop",
      available: true,
    },
    {
      id: "c3",
      category: "combos",
      name: "Combo Fiesta",
      price: 45.0,
      description: "3 Pizzas Familiares + 2 Bebidas Grandes",
      sizes: [],
      emoji: "🎉",
      image:
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=400&auto=format&fit=crop",
      available: true,
    },
  ],
};

export const EXTRAS = [
  { id: "e1", name: "Extra Queso", price: 1.5 },
  { id: "e2", name: "Extra Pepperoni", price: 2.0 },
  { id: "e3", name: "Jalapeños", price: 0.75 },
  { id: "e4", name: "Champiñones", price: 1.0 },
  { id: "e5", name: "Aceitunas", price: 0.75 },
  { id: "e6", name: "Cebolla Caramelizada", price: 1.25 },
  { id: "e7", name: "Extra Salsa BBQ", price: 0.5 },
  { id: "e8", name: "Albahaca Fresca", price: 0.5 },
];

export const BRANCHES = [
  { id: "b1", name: "Sucursal Centro", address: "Av. Principal #123" },
  { id: "b2", name: "Sucursal Norte", address: "Calle 45 #67" },
  { id: "b3", name: "Sucursal Sur", address: "Blvd. Sur #890" },
];

export const STAFF = [
  { id: 's0', name: 'Admin General', role: 'admin', branchId: 'all', email: 'admin@pizzeria.com' },
  { id: 's1', name: 'Carlos Rodríguez', role: 'cashier', branchId: 'b1', email: 'carlos@pizzeria.com' },
  { id: 's2', name: 'María López', role: 'chef', branchId: 'b1', email: 'maria@pizzeria.com' },
  { id: 's3', name: 'José Martínez', role: 'waiter', branchId: 'b1', email: 'jose@pizzeria.com' },
  { id: 's4', name: 'Ana García', role: 'cashier', branchId: 'b2', email: 'ana@pizzeria.com' },
  { id: 's5', name: 'Luis Hernández', role: 'chef', branchId: 'b2', email: 'luis@pizzeria.com' },
  { id: 's6', name: 'Sofia Torres', role: 'mesero', branchId: 'b2', email: 'sofia@pizzeria.com' },
  { id: 's7', name: 'Pedro Sánchez', role: 'chef', branchId: 'b3', email: 'pedro@pizzeria.com' },
  { id: 's8', name: 'Laura Jiménez', role: 'despachador', branchId: 'b3', email: 'laura@pizzeria.com' },
];

// Generate realistic mock sales for the past 30 days
const generateSales = () => {
  const sales = [];
  const cashiers = ["Carlos Rodríguez", "Ana García", "Laura Jiménez"];
  const methods = ["Efectivo", "Pago Móvil", "Punto de Venta"];
  const branches = ["Centro", "Norte", "Sur"];

  for (let day = 29; day >= 0; day--) {
    const date = new Date();
    date.setDate(date.getDate() - day);
    const ordersPerDay = Math.floor(Math.random() * 15) + 8;

    for (let i = 0; i < ordersPerDay; i++) {
      const hour = Math.floor(Math.random() * 12) + 10;
      const minute = Math.floor(Math.random() * 60);
      date.setHours(hour, minute, 0, 0);

      const itemCount = Math.floor(Math.random() * 4) + 1;
      const total = parseFloat((Math.random() * 45 + 15).toFixed(2));

      sales.push({
        id: `SALE-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        date: new Date(date).toISOString(),
        cashier: cashiers[Math.floor(Math.random() * cashiers.length)],
        branch: branches[Math.floor(Math.random() * branches.length)],
        items: itemCount,
        total,
        paymentMethod: methods[Math.floor(Math.random() * methods.length)],
        status: "completed",
      });
    }
  }
  return sales.sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const MOCK_SALES = generateSales();

// Initial kitchen orders for demo
export const INITIAL_ORDERS = [
  {
    id: "ORD-001",
    status: "pending",
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    items: [
      { name: "Pepperoni Suprema", size: "Familiar", qty: 2, category: "pizzas" },
      { name: "Coca-Cola", size: null, qty: 3, category: "drinks" },
    ],
    total: 36.0,
    table: "Mesa 4",
    orderType: "dine_in",
    customerName: "Juan Pérez",
  },
  {
    id: "ORD-002",
    status: "pending",
    createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    items: [
      { name: "Margarita Clásica", size: "Mediana", qty: 1, category: "pizzas" },
      { name: "Cuatro Quesos", size: "Personal", qty: 1, category: "pizzas" },
    ],
    total: 28.0,
    orderType: "delivery_ws",
    customerName: "María García",
    phoneLastDigits: "5555",
  },
  {
    id: "ORD-003",
    status: "preparing",
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    items: [
      { name: "BBQ Chicken", size: "Familiar", qty: 1, category: "pizzas" },
      { name: "Agua Mineral", size: null, qty: 2, category: "drinks" },
      { name: "Helado Vainilla", size: null, qty: 2, category: "icecream" },
    ],
    total: 25.0,
    orderType: "takeaway",
    customerName: "Carlos López",
  },
  {
    id: "ORD-004",
    status: "preparing",
    createdAt: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
    items: [
      { name: "Vegetariana", size: "Mediana", qty: 2, category: "pizzas" },
      { name: "Limonada", size: null, qty: 2, category: "drinks" },
    ],
    total: 33.0,
    orderType: "pickup",
    customerName: "Ana Martínez",
  },
  {
    id: "ORD-005",
    status: "ready",
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    items: [
      { name: "Hawaiana", size: "Familiar", qty: 1, category: "pizzas" },
      { name: "Pepsi", size: null, qty: 4, category: "drinks" },
    ],
    total: 23.5,
    table: "Mesa 1",
  },
];
