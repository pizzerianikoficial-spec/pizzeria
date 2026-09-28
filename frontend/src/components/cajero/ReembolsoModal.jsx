import React from "react";
import { X, User, Package, Undo2, DollarSign, AlertCircle } from "lucide-react";
import { useExchangeRate } from "../../hooks/useExchangeRate";

const TIPO_EMOJI = { Pizza: "🍕", Bebida: "🥤", Helado: "🍦" };

export default function ReembolsoModal({ pedido = {}, displayNum, onClose }) {
  const { exchangeRate } = useExchangeRate();
  const safePedido = pedido ?? {};
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleConfirmarReembolso = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch("http://localhost:3001/api/reembolsar-venta", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id_venta: safePedido.id_venta }),
      });

      const data = await res.json();

      if (data.success) {
        window.Toast?.fire({
          icon: "success",
          title: "Reembolso procesado con éxito",
        });
        onClose(true);
      } else {
        throw new Error(data.message || "Error desconocido");
      }
    } catch (error) {
      console.error("Error en reembolso:", error);
      window.Toast?.fire({
        icon: "error",
        title: "No se pudo procesar el reembolso",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Cálculos financieros
  const totalUsd = safePedido.monto_total_usd ?? 0;
  const totalBs = totalUsd * (exchangeRate || 0);
  const tasa = exchangeRate?.toFixed(2) ?? "0.00";

  if (!safePedido.id_venta) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-3 bg-slate-900/65 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[96vh] flex flex-col overflow-hidden border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-red-50 to-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20 text-white shrink-0">
              <Undo2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="font-black text-slate-800 text-2xl leading-tight">
                Procesar Reembolso
              </h2>
              <p className="text-sm text-slate-500 font-semibold mt-0.5">
                Pedido #{String(displayNum).padStart(3, "0")} •{" "}
                {new Date(safePedido.fecha_hora).toLocaleDateString("es-VE")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* ── BODY ────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Columna Izquierda: Cliente y Alerta */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              {/* Datos Cliente */}
              <section className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <User className="w-4 h-4" /> Cliente
                </p>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs font-bold text-slate-400 block">
                      Nombre
                    </span>
                    <span className="text-lg font-bold text-slate-800">
                      {safePedido.nombre_cliente || "Anónimo"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50">
                    <div>
                      <span className="text-xs font-bold text-slate-400 block">
                        Cédula
                      </span>
                      <span className="text-sm font-semibold text-slate-700">
                        {safePedido.cedula_cliente
                          ? `V-${safePedido.cedula_cliente}`
                          : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-400 block">
                        Teléfono
                      </span>
                      <span className="text-sm font-semibold text-slate-700">
                        {safePedido.telefono_cliente || "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Alerta Visual */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 font-medium leading-relaxed">
                  Esta acción registrará la devolución del dinero y cancelará
                  los estados de los productos en el sistema.
                </div>
              </div>
            </div>

            {/* Columna Derecha: Productos */}
            <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                  <Package className="w-4 h-4" /> Productos a Reembolsar
                </h3>
              </div>
              <div className="p-5 overflow-y-auto max-h-[400px] space-y-3">
                {safePedido.detalles?.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-start p-3 bg-slate-50 rounded-xl border border-slate-100"
                  >
                    <div className="flex gap-3">
                      <span className="text-2xl">
                        {TIPO_EMOJI[item.tipo_producto] || "📦"}
                      </span>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">
                          {item.nombre_producto}
                        </p>
                        <p className="text-xs text-slate-500">
                          Cant: {item.cantidad} • Unit: $
                          {Number(item.precio_unitario || 0).toFixed(2)}
                        </p>
                        {item.extras?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.extras.map((ex, i) => (
                              <span
                                key={i}
                                className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600"
                              >
                                +{ex.name || ex.nombre}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="font-bold text-slate-800 text-sm">
                      ${Number(item.monto_total || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── FOOTER / RESUMEN FINANCIERO ─────────────────────────────── */}
        <div className="shrink-0 border-t border-slate-100 bg-white">
          {/* Barra de Totales */}
          <div className="px-6 py-4 bg-slate-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase block">
                  Total USD
                </span>
                <span className="text-2xl font-black text-white">
                  ${totalUsd.toFixed(2)}
                </span>
              </div>
              <div className="h-8 w-px bg-slate-700" />
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase block">
                  Total Bs
                </span>
                <span className="text-2xl font-black text-emerald-400">
                  {totalBs.toLocaleString("es-VE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Tasa: {tasa}
                </span>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="px-6 py-4 flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 rounded-xl border-2 border-slate-200 text-slate-700 font-extrabold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmarReembolso}
              disabled={isProcessing}
              className={`flex-1 py-3.5 rounded-xl text-white font-extrabold shadow-lg transition-colors flex items-center justify-center gap-2 
                ${isProcessing ? "bg-red-400 cursor-not-allowed shadow-none" : "bg-red-600 hover:bg-red-700 shadow-red-600/20 cursor-pointer"}`}
            >
              <DollarSign className="w-5 h-5" />
              {isProcessing ? "Procesando..." : "Confirmar Reembolso"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
