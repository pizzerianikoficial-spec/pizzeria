import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Plus, Loader2 } from "lucide-react";
import { useProducts } from "../../hooks/useProducts";
import OrderTypeModal from "../cajero/OrderTypeModal";

export default function DeliveryMenuGrid({ category }) {
  const { addToCart, currentOrder, setOrderType } = useApp();
  const { data: catalog, isLoading } = useProducts();

  const [showOrderTypeModal, setShowOrderTypeModal] = useState(false);
  const [pendingProduct, setPendingProduct] = useState(null);

  const products = [
    ...(catalog?.pizzas || []),
    ...(catalog?.drinks || []),
    ...(catalog?.icecream || []),
    ...(catalog?.combos || []),
  ];

  const handleAddToCart = (product, size) => {
    // Si el carrito está vacío y aún no se configuró el pedido (cliente, delivery, estado de pago), abrir OrderTypeModal
    if (currentOrder.items.length === 0 && (!currentOrder.orderType || !currentOrder.customer)) {
      setPendingProduct({ product, size });
      setShowOrderTypeModal(true);
    } else {
      if (currentOrder.orderType !== "delivery") {
        setOrderType("delivery");
      }
      addToCart(product, size);
    }
  };

  const handleOrderTypeConfirmed = ({ pendingRegistered = false } = {}) => {
    setShowOrderTypeModal(false);
    if (pendingProduct && !pendingRegistered) {
      addToCart(pendingProduct.product, pendingProduct.size);
    }
    setPendingProduct(null);
  };

  const handleOrderTypeClose = () => {
    setShowOrderTypeModal(false);
    setPendingProduct(null);
  };

  // Filtrar activos
  const activeProducts = products.filter((p) => p.estado === "Activo");

  let displayedProducts = [];
  const allPizzas = activeProducts.filter((p) => p.category === "pizzas");
  const normal = allPizzas.filter((p) => p.pizzaCategory === "Normal");
  const familiar = allPizzas.filter((p) => p.pizzaCategory === "Familiar");
  const gigantes = allPizzas.filter((p) => p.pizzaCategory === "Gigante");
  const combos = activeProducts.filter((p) => p.category === "combos");
  const drinks = activeProducts.filter((p) => p.category === "drinks");
  const icecreams = activeProducts.filter((p) => p.category === "icecream");

  switch (category) {
    case "Normal":
      displayedProducts = normal;
      break;
    case "Familiar":
      displayedProducts = familiar;
      break;
    case "bebidas":
    case "Bebidas":
      displayedProducts = drinks;
      break;
    case "Gigantes":
      displayedProducts = gigantes;
      break;
    case "combos":
      displayedProducts = combos;
      break;
    case "Helados":
      displayedProducts = icecreams;
      break;
    case "all":
    default:
      displayedProducts = activeProducts;
      break;
  }

  return (
    <div className="flex-1 overflow-y-auto p-2 md:p-4 sm:p-3 hide-scrollbar relative">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-pizza-red" />
          <p className="text-sm font-medium">Cargando menú delivery...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4 auto-rows-max">
          {displayedProducts.map((product, index) => {
            const productId =
              product.id ??
              product.id_helado ??
              product.id_heladeria ??
              product.id_producto;
            const productWithId = { ...product, id: productId };

            return (
              <div
                key={`${product.category}-${productId ?? index}`}
                className="bg-white border border-slate-100 rounded-xl overflow-hidden hover:shadow-pizza hover:border-pizza-red/30 transition-all cursor-pointer group flex flex-col"
                onClick={() => handleAddToCart(productWithId, product.size)}
              >
                {product.url || product.image ? (
                  <div className="h-24 sm:h-28 md:h-32 w-full shrink-0 overflow-hidden bg-slate-50 relative">
                    <img
                      src={product.url || product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <span className="absolute bottom-2 left-2 text-white font-bold text-sm">
                      ${Number(product.price || 0).toFixed(2)}
                    </span>
                  </div>
                ) : (
                  <div className="h-16 sm:h-20 md:h-24 w-full shrink-0 bg-slate-50 flex items-center justify-center text-3xl sm:text-4xl relative">
                    {product.emoji || "🍕"}
                    <span className="absolute bottom-2 right-2 text-slate-800 font-bold text-xs bg-white/80 px-2 py-0.5 rounded-full backdrop-blur-sm shadow-sm">
                      ${Number(product.price || 0).toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="p-2 sm:p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-slate-800 line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-[9px] sm:text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-tight">
                      {product.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="mt-2 sm:mt-3 w-full shrink-0 py-1 sm:py-1.5 flex items-center justify-center gap-1 bg-slate-50 hover:bg-pizza-red hover:text-white text-slate-600 rounded-lg text-[10px] sm:text-xs font-semibold transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Agregar
                  </button>
                </div>
              </div>
            );
          })}

          {!isLoading && displayedProducts.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400">
              <p className="text-xs">
                No hay productos activos en esta categoría.
              </p>
            </div>
          )}
        </div>
      )}

      {showOrderTypeModal && (
        <OrderTypeModal
          onConfirm={handleOrderTypeConfirmed}
          onClose={handleOrderTypeClose}
          pendingProduct={pendingProduct}
          initialType="delivery"
          lockType={true}
        />
      )}
    </div>
  );
}
