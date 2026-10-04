import { API_BASE as API_URL } from "../../config/api";
import { useEffect, useState } from "react";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { subscribeToPusher } from "../../lib/pusherClient";
import { usePusherConnection } from "../../hooks/usePusherConnection";
import {
  Bell,
  ChevronRight,
  Flame,
  Loader2,
  X,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useExchangeRate } from "../../hooks/useExchangeRate";



const CATEGORY_TO_SIZE = {
  1: "Normal",
  2: "Familiar",
  3: "Gigante",
};

export default function PendingNotifications() {
  const queryClient = useQueryClient();
  const { loadPendingOrder, currentOrder } = useApp();
  const { exchangeRate } = useExchangeRate();
  const pusherConnected = usePusherConnection();

  const [open, setOpen] = useState(false);
  const [loadingId, setLoadingId] = useState(null);
  const [sendingToOvenId, setSendingToOvenId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeToPusher({
      channelName: "pizzeria-notifications",
      events: {
        notificacion_pendiente_creada: () => {
          queryClient.invalidateQueries({
            queryKey: ["notificaciones-pendientes"],
            refetchType: "active",
          });
        },
        notificacion_pendiente_resuelta: () => {
          queryClient.invalidateQueries({
            queryKey: ["notificaciones-pendientes"],
          });
        },
        notificacion_actualizada: (payload) => {
          queryClient.setQueryData(
            ["notificaciones-pendientes"],
            (oldNotifications = []) =>
              oldNotifications.map((item) =>
                item.id_venta === payload.id_venta
                  ? {
                      ...item,
                      monto_restante: payload.monto_restante,
                      estado_notificacion: payload.estado_notificacion,
                      en_espera_horno: payload.en_espera_horno,
                    }
                  : item
              )
          );
        },
      },
    });

    return () => unsubscribe();
  }, [queryClient]);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notificaciones-pendientes"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/notificaciones-pendientes`);
      return data.success ? data.data || [] : [];
    },
    staleTime: 15_000,
    refetchOnWindowFocus: false,
    // Polling SOLO cuando Pusher está caído: con Pusher activo no se refetcha.
    refetchInterval: pusherConnected ? false : 15_000,
  });

  const loadNotification = async (notification) => {
    if (currentOrder.items.length > 0) {
      setError("Primero termina o limpia el ticket actual.");
      return;
    }

    setLoadingId(notification.id_venta);
    try {
      const { data } = await axios.get(
        `${API_URL}/notificaciones-pendientes/${notification.id_venta}`,
      );
      const { venta, detalles, pagos } = data.data;
      const rate = Number(venta.tasa_cambio || exchangeRate || 0);
      const deliveryCost = Number(venta.costo_delivery || 0);
      const originalTotal =
        detalles.reduce(
          (sum, detail) => sum + Number(detail.monto_total || 0),
          0,
        ) + deliveryCost;
      const paidTotal = pagos.reduce((sum, payment) => {
        const amountUsd = Number(payment.monto_usd || 0);
        return (
          sum +
          (amountUsd || (rate > 0 ? Number(payment.monto_bs || 0) / rate : 0))
        );
      }, 0);
      const pendingRemaining = Math.max(
        0,
        Number(venta.monto_restante || originalTotal - paidTotal),
      );

      const items = detalles.map((detail) => ({
        id: `pending-${detail.id_detalle}`,
        id_detalle: detail.id_detalle,
        productId: detail.id_producto_origen,
        name: detail.nombre_producto,
        basePrice:
          Number(detail.monto_total || 0) / Math.max(1, detail.cantidad),
        price: Number(detail.monto_total || 0) / Math.max(1, detail.cantidad),
        qty: Number(detail.cantidad || 1),
        size: CATEGORY_TO_SIZE[Number(detail.id_categoria_pizza)] || null,
        extras: detail.extras || [],
        note: detail.nota || "",
        category:
          detail.tipo_producto === "Bebida"
            ? "drinks"
            : detail.tipo_producto === "Helado"
              ? "icecream"
              : "pizzas",
        emoji: detail.tipo_producto === "Pizza" ? "🍕" : "",
        isPendingExisting: true,
      }));

      const internalPayments = pagos.map((payment, index) => ({
        method:
          payment.metodo === "Pago_Movil"
            ? "mobile"
            : payment.metodo === "Efectivo"
              ? "cash"
              : /binance|zelle/i.test(payment.metodo || "")
                ? "binance"
                : /cashea/i.test(payment.metodo || "")
                  ? "cashea"
                  : "pos",
        label: payment.metodo,
        amount:
          payment.monto_usd > 0
            ? Number(payment.monto_usd)
            : rate > 0
              ? Number(payment.monto_bs || 0) / rate
              : 0,
        currency: payment.referencia || "Bs",
        id: index,
      }));

      loadPendingOrder({
        items,
        payments: internalPayments,
        orderType: venta.despacho === "Delivery" ? "delivery" : "pickup",
        paymentStatus: internalPayments.length > 0 ? "partial" : "pending",
        advanceAmount: internalPayments.reduce(
          (sum, payment) => sum + payment.amount,
          0,
        ),
        advancePaymentMethod: internalPayments[0]?.method || null,
        advanceCurrency: internalPayments[0]?.currency || "USD",
        customer: {
          id: venta.cliente_id,
          name: venta.nombre_cliente,
          cedula: venta.cedula_cliente,
          phone: venta.telefono_cliente,
        },
        deliveryId: venta.id_delivery || null,
        deliveryCostUSD: deliveryCost,
        deliveryCostBs: deliveryCost * (rate || 0),
        deliveryCostCurrency: "USD",
        deliveryCostRaw: deliveryCost > 0 ? String(deliveryCost) : "",
        pendingSaleId: venta.id_venta,
        pendingOriginalTotal: originalTotal,
        pendingRemaining: pendingRemaining,
      });

      // Actualización optimista de la caché local para que la notificación desaparezca al instante
      queryClient.setQueryData(
        ["notificaciones-pendientes"],
        (oldNotifications = []) =>
          oldNotifications.filter(
            (item) => item.id_venta !== notification.id_venta,
          ),
      );

      setOpen(false);
      setError("");
    } catch (requestError) {
      console.error("Error cargando la venta pendiente:", requestError);
      setError("No se pudo cargar el pedido.");
    } finally {
      setLoadingId(null);
    }
  };

  const isHoldNotification = (notification) =>
    Number(notification.en_espera_horno) === 1 ||
    notification.estado_notificacion === "EnEspera";

  // Venta ya cobrada retenida fuera de cocina: se libera con un solo clic
  const sendToOven = async (notification) => {
    if (sendingToOvenId !== null) return;

    setSendingToOvenId(notification.id_venta);
    setError("");
    try {
      const { data } = await axios.post(
        `${API_URL}/notificaciones-pendientes/${notification.id_venta}/mandar-al-horno`,
        {},
        { withCredentials: true },
      );

      if (!data?.success) {
        throw new Error(data?.message || "No se pudo enviar al horno.");
      }

      queryClient.setQueryData(
        ["notificaciones-pendientes"],
        (oldNotifications = []) =>
          oldNotifications.filter(
            (item) => item.id_venta !== notification.id_venta,
          ),
      );

      window.Toast?.fire({
        icon: "success",
        title: "¡Pedido enviado al horno!",
      });
    } catch (requestError) {
      console.error("Error enviando el pedido al horno:", requestError);
      setError(
        requestError.response?.data?.message ||
          "No se pudo enviar el pedido al horno.",
      );
    } finally {
      setSendingToOvenId(null);
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
        title="Notificaciones de pagos pendientes"
      >
        <Bell className="h-5 w-5" />
        {notifications.length > 0 && (
          <span className="absolute -right-1 -top-1 flex min-w-5 h-5 items-center justify-center rounded-full bg-pizza-red px-1 text-[10px] font-black text-white">
            {notifications.length > 9 ? "9+" : notifications.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <h2 className="font-extrabold text-slate-800">
                Pedidos pendientes
              </h2>
              <p className="text-xs text-slate-500">Cobros por completar</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {isLoading && notifications.length === 0 ? (
            <div className="flex items-center justify-center gap-2 p-6 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
            </div>
          ) : notifications.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-500">
              No hay pagos pendientes.
            </p>
          ) : (
            <div className="max-h-[55vh] overflow-y-auto p-2">
              {notifications.map((notification) => {
                const esEsperaHorno = isHoldNotification(notification);
                const isSending = sendingToOvenId === notification.id_venta;
                const isLoading = loadingId === notification.id_venta;

                return (
                  <div
                    key={notification.id_notificacion}
                    role={esEsperaHorno ? undefined : "button"}
                    tabIndex={esEsperaHorno ? undefined : 0}
                    onClick={
                      esEsperaHorno ? undefined : () => loadNotification(notification)
                    }
                    onKeyDown={
                      esEsperaHorno
                        ? undefined
                        : (event) => {
                            if (event.key !== "Enter" && event.key !== " ") return;
                            event.preventDefault();
                            loadNotification(notification);
                          }
                    }
                    className={`mb-2 w-full rounded-xl border p-3 text-left transition-colors ${
                      esEsperaHorno
                        ? "border-orange-200 bg-orange-50"
                        : "border-slate-200 bg-slate-50 hover:border-amber-300 hover:bg-amber-50 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-800">
                          {notification.nombre_cliente || "Cliente sin nombre"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {notification.cedula_cliente ||
                            notification.telefono_cliente ||
                            "Sin identificación"}
                        </p>
                      </div>
                      {esEsperaHorno ? (
                        isSending ? (
                          <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
                        ) : (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">
                            <Flame className="h-3 w-3" />
                            En espera
                          </span>
                        )
                      ) : isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                    <p className="mt-2 truncate text-xs text-slate-600">
                      {notification.resumen_items || "Pedido"} ·{" "}
                      {notification.despacho}
                    </p>
                    {esEsperaHorno ? (
                      <p className="mt-1 font-extrabold text-orange-700">
                        Pagado · pendiente de enviar al horno
                      </p>
                    ) : (
                      <p className="mt-1 font-extrabold text-amber-700">
                        Falta: $
                        {Number(notification.monto_restante || 0).toFixed(2)}
                        {exchangeRate > 0 &&
                          ` · Bs. ${(Number(notification.monto_restante || 0) * exchangeRate).toFixed(2)}`}
                      </p>
                    )}
                    {esEsperaHorno && (
                      <button
                        type="button"
                        onClick={() => sendToOven(notification)}
                        disabled={isSending}
                        className={`mt-2 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-white transition-colors ${
                          isSending
                            ? "cursor-not-allowed bg-slate-400"
                            : "bg-orange-500 hover:bg-orange-600"
                        }`}
                      >
                        {isSending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Flame className="h-3.5 w-3.5" />
                        )}
                        {isSending ? "Enviando..." : "Mandar al horno"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {error && (
            <p className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
