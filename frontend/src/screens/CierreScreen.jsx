import { API_BASE as API } from "../config/api";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useQueryClient } from "@tanstack/react-query";
import { useApp } from "../context/AppContext";
import {
  DollarSign,
  ClipboardList,
  AlertCircle,
  X,
  Lock,
  CheckCircle2,
  Calendar,
  CreditCard,
  Smartphone,
  Coins,
  Wallet,
  ShoppingBag,
  RefreshCw,
  Undo2,
} from "lucide-react";
import { exportCierrePDF } from "../utils/pdfCierre";



export default function CierreScreen() {
  const { clearCart, currentUser } = useApp();
  const queryClient = useQueryClient();
  const esCierreDelivery = currentUser?.role === "cashierdelivery";
  const paramsCierre = esCierreDelivery ? { despacho: "Delivery" } : undefined;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [claveCierre, setClaveCierre] = useState("");
  const [selectedMethodForModal, setSelectedMethodForModal] = useState(null);
  const [modalPage, setModalPage] = useState(1);

  // ── Carrusel de Wallet Cards ──
  const walletTrackRef = useRef(null);
  const walletDragRef = useRef({
    isDragging: false,
    startX: 0,
    startScrollLeft: 0,
    moved: false,
  });
  const [isWalletHovering, setIsWalletHovering] = useState(false);
  const [isWalletDragging, setIsWalletDragging] = useState(false);
  const [walletActiveIndex, setWalletActiveIndex] = useState(0);
  const WALLET_CARD_WIDTH = 280; // ancho fijo de cada tarjeta (px)
  const WALLET_CARD_GAP = 20; // debe coincidir con el gap del track (gap-5 = 20px)
  const WALLET_CARDS_COUNT = 6; // cantidad de métodos de pago (tarjetas únicas)
  // El autoscroll se pausa si el usuario está encima (hover) o arrastrando (mouse/touch)
  const isWalletPaused = isWalletHovering || isWalletDragging;

  useEffect(() => {
    fetchResumenDia();
  }, []);

  // Autoscroll infinito y continuo del carrusel de wallet cards.
  useEffect(() => {
    let rafId;
    const speed = 0.5; // px por frame (ajustable para controlar la velocidad)
    const cardFullWidth = WALLET_CARD_WIDTH + WALLET_CARD_GAP;

    const step = () => {
      const track = walletTrackRef.current;
      if (track && !isWalletPaused) {
        const singleSetWidth = track.scrollWidth / 2;
        track.scrollLeft += speed;

        // Al llegar a la mitad (fin del primer set), regresamos al inicio
        if (singleSetWidth > 0 && track.scrollLeft >= singleSetWidth) {
          track.scrollLeft -= singleSetWidth;
        }

        const idx =
          Math.round(track.scrollLeft / cardFullWidth) % WALLET_CARDS_COUNT;
        setWalletActiveIndex(idx);
      }
      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [isWalletPaused]);

  // ── Arrastre manual del carrusel (mouse y touch) ──
  const handleWalletPointerDown = (e) => {
    const track = walletTrackRef.current;
    if (!track) return;
    walletDragRef.current.isDragging = true;
    walletDragRef.current.moved = false;
    walletDragRef.current.startX = e.clientX;
    walletDragRef.current.startScrollLeft = track.scrollLeft;
    setIsWalletDragging(true);
  };

  const handleWalletPointerMove = (e) => {
    const track = walletTrackRef.current;
    if (!track || !walletDragRef.current.isDragging) return;

    const delta = e.clientX - walletDragRef.current.startX;
    if (!walletDragRef.current.moved) {
      // Umbral mínimo para distinguir un "click" de un arrastre real.
      // Mientras no se supere, no tocamos el scroll ni capturamos el puntero.
      if (Math.abs(delta) <= 5) return;
      walletDragRef.current.moved = true;
      track.setPointerCapture?.(e.pointerId);
    }

    track.scrollLeft = walletDragRef.current.startScrollLeft - delta;

    // Mantiene el loop infinito también mientras se arrastra hacia adelante
    const singleSetWidth = track.scrollWidth / 2;
    if (singleSetWidth > 0 && track.scrollLeft >= singleSetWidth) {
      track.scrollLeft -= singleSetWidth;
      walletDragRef.current.startScrollLeft -= singleSetWidth;
    }
  };

  const endWalletDrag = (e) => {
    const track = walletTrackRef.current;
    walletDragRef.current.isDragging = false;
    setIsWalletDragging(false);
    if (
      track &&
      e?.pointerId != null &&
      track.hasPointerCapture?.(e.pointerId)
    ) {
      track.releasePointerCapture(e.pointerId);
    }
  };

  const fetchResumenDia = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/cierre/resumen-dia`, {
        params: paramsCierre,
        withCredentials: true,
      });
      setData(res.data);
    } catch {
      window.Toast?.fire({
        icon: "error",
        title: "No se pudo cargar la información del cierre",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartCierre = async () => {
    if (!data || data.total_divisa <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Caja sin Movimientos",
        text: "No se puede efectuar el cierre de caja porque los montos se encuentran en 0Bs/$.",
        confirmButtonColor: "#EA2A33",
        background: "#ffffff",
        customClass: {
          popup: "rounded-2xl font-sans shadow-xl border border-slate-100",
          title: "text-base font-black text-slate-800",
          confirmButton: "px-5 py-2.5 font-bold rounded-xl text-sm",
        },
      });
      return;
    }

    // 2. Verificar pedidos pendientes primero
    try {
      const check = await axios.get(`${API}/cierre/pedidos-pendientes`, {
        params: paramsCierre,
        withCredentials: true,
      });
      if (check.data.bloqueado) {
        Swal.fire({
          icon: "error",
          title: "¡Cola activa!",
          html: `
            <div style="display:flex;flex-direction:column;align-items:center;gap:10px;padding-top:4px">
              <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:14px;padding:10px 20px;font-size:2rem;font-weight:900;color:#dc2626;letter-spacing:-1px">
                ${check.data.pendientes}
              </div>
              <p style="margin:0;font-size:13px;color:#64748b;font-weight:600;text-align:center;line-height:1.5">
                orden(es) pendiente(s) en cola.<br>
                <span style="color:#94a3b8;font-size:12px;font-weight:500">Complétalas antes de cerrar caja.</span>
              </p>
            </div>`,
          confirmButtonColor: "#EA2A33",
          confirmButtonText: "Entendido",
          background: "#ffffff",
          customClass: {
            popup: "rounded-2xl font-sans shadow-xl border border-slate-100",
            title: "text-base font-black text-slate-800",
            confirmButton: "px-5 py-2.5 font-bold rounded-xl text-sm",
          },
        });
        return;
      }
    } catch {
      Swal.fire({
        icon: "warning",
        title: "Sin conexión",
        text: "No se pudo verificar la cola de trabajo.",
        confirmButtonColor: "#EA2A33",
        background: "#fff",
      });
      return;
    }

    // 3. Si no hay pendientes y los montos son > 0, mostrar confirmación
    Swal.fire({
      title: "¿Efectuar Cierre de Caja?",
      text: "¿Está seguro de que desea iniciar el proceso de cierre de caja para el día de hoy?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EA2A33",
      cancelButtonColor: "#94A3B8",
      confirmButtonText: "Sí, continuar",
      cancelButtonText: "Cancelar",
      background: "#ffffff",
      customClass: {
        popup: "rounded-2xl border border-slate-100 font-sans shadow-xl",
        title: "text-lg font-black text-slate-800",
        htmlContainer: "text-sm text-slate-500",
        confirmButton: "px-5 py-2.5 font-bold rounded-xl text-sm mx-2",
        cancelButton: "px-4 py-2.5 font-semibold rounded-xl text-sm mx-2",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        setShowDetailModal(true);
      }
    });
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();

    if (!claveCierre.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Clave requerida",
        text: "Debe ingresar la Clave de Cierre para continuar.",
        confirmButtonColor: "#EA2A33",
        confirmButtonText: "Entendido",
        background: "#ffffff",
        customClass: {
          popup: "rounded-2xl font-sans shadow-xl border border-slate-100",
          title: "text-lg font-black text-slate-800",
          htmlContainer: "text-sm text-slate-500",
          confirmButton: "px-5 py-2.5 font-bold rounded-xl text-sm",
        },
      });
      return;
    }

    const currentUser = JSON.parse(
      localStorage.getItem("currentUser") || "null",
    );

    try {
      const res = await axios.post(
        `${API}/cierre-caja`,
        {
          pin: claveCierre.trim(),
          monto_efectivo_usd: Number(desglose_pagos.efectivo_usd || 0),
          monto_efectivo_bs: Number(desglose_pagos.efectivo_bs || 0),
          monto_punto_bs: Number(desglose_pagos.punto_de_venta_bs || 0),
          monto_pago_movil_bs: Number(desglose_pagos.transferencia_bs || 0),
          monto_binance_usd: Number(desglose_pagos.binance_usd || 0),
          monto_cashea_usd: Number(desglose_pagos.cashea_usd || 0),
          total_usdt: Number(total_divisa || 0),
          num_ordenes: Number(total_ordenes || 0),
          tipo_cierre: esCierreDelivery ? "delivery" : "general",
        },
        { withCredentials: true },
      );

      const newCierreId = res.data?.id_cierre;

      // Auto-descargar PDF Profesional del Cierre
      let pdfBlob = null;
      let pdfFileName = "";
      try {
        const pdf = await exportCierrePDF({
          id_cierre: newCierreId,
          id_sucursal: data?.id_sucursal,
          sucursal: data?.sucursal,
          sucursal_direccion: data?.direccion,
          transacciones: data?.transacciones || [],
          fecha_hora: new Date(),
          usuario_nombre:
            currentUser?.name ||
            currentUser?.nombre_completo ||
            currentUser?.email ||
            "Cajero Responsable",
          monto_efectivo_usd: Number(desglose_pagos.efectivo_usd || 0),
          monto_efectivo_bs: Number(desglose_pagos.efectivo_bs || 0),
          monto_punto_bs: Number(desglose_pagos.punto_de_venta_bs || 0),
          monto_pago_movil_bs: Number(desglose_pagos.transferencia_bs || 0),
          monto_binance_usd: Number(desglose_pagos.binance_usd || 0),
          monto_cashea_usd: Number(desglose_pagos.cashea_usd || 0),
          total_usdt: Number(total_divisa || 0),
          num_ordenes: Number(total_ordenes || 0),
          tasa_cambio: Number(tasa || 1),
          tipo_cierre: esCierreDelivery ? "delivery" : "general",
          reembolsos: data.reembolsos || null,
        });
        pdfBlob = pdf?.blob || pdf || null;
        pdfFileName = pdf?.fileName || "";
      } catch (pdfError) {
        console.error("Error al generar PDF del cierre:", pdfError);
      }

      // Enviar el PDF del cierre por correo
      if (pdfBlob && pdfBlob.size > 0) {
        if (pdfBlob.size > 3.5 * 1024 * 1024) {
          console.warn(
            "PDF demasiado grande (" +
              (pdfBlob.size / 1024 / 1024).toFixed(1) +
              " MB), se omitió el envío por correo.",
          );
          clearCart();
          queryClient.invalidateQueries({ queryKey: ["kitchenOrders"] });
          queryClient.invalidateQueries({ queryKey: ["pedidosActivos"] });
          queryClient.invalidateQueries({ queryKey: ["verificarCierrePendiente"] });
          await fetchResumenDia();
          window.Toast.fire({
            icon: "warning",
            title:
              "¡Cierre realizado y PDF descargado! No se envió por correo (el PDF supera el tamaño máximo).",
          });
          return;
        }
        try {
          const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve(String(reader.result).split(",")[1]);
            reader.onerror = reject;
            reader.readAsDataURL(pdfBlob);
          });

          const fechaHora = new Date().toLocaleString("es-VE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });

          await axios.post(
            `${API}/cierre/enviar-email`,
            {
              pdf_base64: base64,
              asunto: `Cierre del día ${fechaHora}`,
              nombre_archivo:
                pdfFileName || `Cierre_${esCierreDelivery ? "delivery" : "caja"}.pdf`,
            },
            { withCredentials: true },
          );
        } catch (emailError) {
          console.error("Error al enviar el cierre por correo:", emailError);
        }
      } else {
        console.error("PDF vacío, no se envió el correo del cierre.");
      }

      setClaveCierre("");
      setShowDetailModal(false);
      clearCart();
      queryClient.invalidateQueries({ queryKey: ["kitchenOrders"] });
      queryClient.invalidateQueries({ queryKey: ["pedidosActivos"] });
      // Si el bloqueo estaba activo, verifica de nuevo para desbloquear el sistema.
      queryClient.invalidateQueries({ queryKey: ["verificarCierrePendiente"] });
      await fetchResumenDia();

      window.Toast.fire({
        icon: "success",
        title: "¡Cierre de caja realizado y PDF descargado exitosamente!",
      });
    } catch (error) {
      if (error.response?.status === 401) {
        window.Toast.fire({
          icon: "error",
          title: "Clave de cierre incorrecta",
        });
        return;
      }

      window.Toast.fire({
        icon: "error",
        title:
          error.response?.data?.mensaje ||
          "No se pudo completar el cierre de caja",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f4f7fc]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 border-4 border-pizza-red border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-slate-500">
            Calculando Relación del Día...
          </span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f4f7fc]">
        <div className="text-center p-8 bg-white rounded-3xl shadow-sm border border-slate-100">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-slate-800 font-bold">Error de Conexión</p>
          <p className="text-slate-500 text-sm mt-1 mb-4">
            No se pudo cargar la información de cierre.
          </p>
          <button
            onClick={fetchResumenDia}
            className="px-5 py-2.5 bg-pizza-red text-white font-bold rounded-xl text-sm hover:bg-pizza-red-dark transition-all"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const {
    fecha_consulta,
    total_divisa,
    ventas_totales,
    total_ordenes,
    ticket_promedio,
    anulaciones,
    propinas,
    desglose_pagos,
    transacciones,
    reembolsos,
  } = data;

  // El donut usa los montos en Bs. para Punto/Transf y USD para Efectivo — comparamos en Bs convertido
  const tasa = data.tasa_cambio || 1;
  const pvUSD = tasa > 0 ? desglose_pagos.punto_de_venta_bs / tasa : 0;
  const trUSD = tasa > 0 ? desglose_pagos.transferencia_bs / tasa : 0;
  const bnUSD = Number(desglose_pagos.binance_usd || 0);
  const csUSD = Number(desglose_pagos.cashea_usd || 0);
  const totalMetodosUSD =
    desglose_pagos.efectivo_usd + pvUSD + trUSD + bnUSD + csUSD;
  const pctEfectivo =
    totalMetodosUSD > 0
      ? Math.round((desglose_pagos.efectivo_usd / totalMetodosUSD) * 100)
      : 0;
  const pctTarjeta =
    totalMetodosUSD > 0 ? Math.round((pvUSD / totalMetodosUSD) * 100) : 0;
  const pctTransferencia =
    totalMetodosUSD > 0 ? Math.round((trUSD / totalMetodosUSD) * 100) : 0;
  const pctBinance =
    totalMetodosUSD > 0 ? Math.round((bnUSD / totalMetodosUSD) * 100) : 0;
  const pctCashea =
    totalMetodosUSD > 0 ? Math.round((csUSD / totalMetodosUSD) * 100) : 0;

  // Donut SVG
  const R = 40;
  const C = 2 * Math.PI * R;
  const dashEfectivo = (pctEfectivo / 100) * C;
  const dashTarjeta = (pctTarjeta / 100) * C;
  const dashTransf = (pctTransferencia / 100) * C;
  const dashBinance = (pctBinance / 100) * C;
  const dashCashea = (pctCashea / 100) * C;
  const offTarjeta = C - dashEfectivo;
  const offTransf = C - dashEfectivo - dashTarjeta;
  const offBinance = C - dashEfectivo - dashTarjeta - dashTransf;
  const offCashea = C - dashEfectivo - dashTarjeta - dashTransf - dashBinance;

  // Formato Bs.
  const fmtBs = (n) =>
    n.toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // Transacciones por método de pago
  const getTransactionsForMethod = (methodKey) => {
    if (!transacciones) return [];
    return transacciones.filter((t) => {
      if (!t.pagos) return false;
      return t.pagos.some((p) => {
        const metodo = p.metodo_pago?.toLowerCase() || "";
        const ref = p.referencia?.toUpperCase() || "";
        if (methodKey === "efectivo_usd") {
          return metodo.includes("efectivo") && ref !== "BS";
        }
        if (methodKey === "efectivo_bs") {
          return metodo.includes("efectivo") && ref === "BS";
        }
        if (methodKey === "punto_de_venta_bs") {
          return metodo.includes("punto") || metodo.includes("tarjeta");
        }
        if (methodKey === "binance_usd") {
          return metodo.includes("binance") || metodo.includes("zelle");
        }
        if (methodKey === "cashea_usd") {
          return metodo.includes("cashea");
        }
        if (methodKey === "transferencia_bs") {
          return (
            !metodo.includes("efectivo") &&
            !metodo.includes("punto") &&
            !metodo.includes("tarjeta") &&
            !metodo.includes("binance") &&
            !metodo.includes("zelle") &&
            !metodo.includes("cashea")
          );
        }
        return false;
      });
    });
  };

  // Obtener el monto pagado con un método específico en una venta
  const getPaymentAmountForMethod = (t, methodKey) => {
    if (!t.pagos) return "";
    let totalUSD = 0;
    let totalBS = 0;
    t.pagos.forEach((p) => {
      const metodo = p.metodo_pago?.toLowerCase() || "";
      const ref = p.referencia?.toUpperCase() || "";
      if (
        methodKey === "efectivo_usd" &&
        metodo.includes("efectivo") &&
        ref !== "BS"
      ) {
        totalUSD += Number(p.monto_usd || 0);
      } else if (
        methodKey === "efectivo_bs" &&
        metodo.includes("efectivo") &&
        ref === "BS"
      ) {
        totalBS += Number(p.monto_bs || 0);
      } else if (
        methodKey === "punto_de_venta_bs" &&
        (metodo.includes("punto") || metodo.includes("tarjeta"))
      ) {
        totalBS += Number(p.monto_bs || 0);
      } else if (
        methodKey === "transferencia_bs" &&
        !metodo.includes("efectivo") &&
        !metodo.includes("punto") &&
        !metodo.includes("tarjeta") &&
        !metodo.includes("binance") &&
        !metodo.includes("zelle") &&
        !metodo.includes("cashea")
      ) {
        totalBS += Number(p.monto_bs || 0);
      } else if (
        methodKey === "binance_usd" &&
        (metodo.includes("binance") || metodo.includes("zelle"))
      ) {
        totalUSD += Number(p.monto_usd || 0);
      } else if (
        methodKey === "cashea_usd" &&
        metodo.includes("cashea")
      ) {
        totalUSD += Number(p.monto_usd || 0);
      }
    });
    if (
      methodKey === "efectivo_usd" ||
      methodKey === "binance_usd" ||
      methodKey === "cashea_usd"
    ) {
      return `$${totalUSD.toFixed(2)}`;
    }
    return `Bs. ${fmtBs(totalBS)}`;
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 md:p-8 gap-6 overflow-y-auto w-full h-full bg-[#f4f7fc]">
      {/* ── HEADER ── */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-100 rounded-3xl px-6 py-5 shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-pizza-red/10 rounded-2xl flex items-center justify-center text-pizza-red shrink-0">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-none">
              Relación del Día
              {esCierreDelivery && (
                <span className="ml-2 align-middle inline-flex items-center px-2.5 py-1 rounded-full bg-pizza-red/10 border border-pizza-red/20 text-pizza-red text-[10px] font-extrabold uppercase tracking-wider">
                  Delivery
                </span>
              )}
            </h1>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mt-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                Fecha: <span className="text-slate-600">{fecha_consulta}</span>
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchResumenDia}
            className="w-10 h-10 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleStartCierre}
            className="px-6 py-3 bg-pizza-red text-white hover:bg-pizza-red-dark transition-all font-bold rounded-2xl text-sm shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <Lock className="w-4 h-4" />
            {esCierreDelivery ? "Cierre Delivery" : "Cierre de Caja"}
          </button>
        </div>
      </header>

      {/* ── HERO BALANCE + DONUT + LEYENDA ── */}
      <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Balance */}
        <div className="lg:col-span-5 flex flex-col justify-center border-r border-slate-100 pr-0 lg:pr-8 h-full min-h-[140px]">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total en Divisa (USDT)
            </span>
            <h2 className="text-5xl sm:text-6xl font-black text-slate-800 tracking-tight mt-2 flex items-baseline gap-1.5">
              ${total_divisa.toFixed(2)}
              <span className="text-base font-bold text-slate-400">USD</span>
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-3 leading-relaxed">
              Suma de todos los canales convertidos a dólares (tasa activa)
            </p>
          </div>
        </div>

        {/* Donut */}
        <div className="lg:col-span-3 flex justify-center items-center">
          <div className="relative w-40 h-40">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle
                cx="50"
                cy="50"
                r={R}
                fill="transparent"
                stroke="#f1f5f9"
                strokeWidth="10"
              />
              {dashEfectivo > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={R}
                  fill="transparent"
                  stroke="#fb923c"
                  strokeWidth="10"
                  strokeDasharray={`${dashEfectivo} ${C}`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                />
              )}
              {dashTarjeta > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={R}
                  fill="transparent"
                  stroke="#22d3ee"
                  strokeWidth="10"
                  strokeDasharray={`${dashTarjeta} ${C}`}
                  strokeDashoffset={offTarjeta}
                  strokeLinecap="round"
                />
              )}
              {dashTransf > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={R}
                  fill="transparent"
                  stroke="#34d399"
                  strokeWidth="10"
                  strokeDasharray={`${dashTransf} ${C}`}
                  strokeDashoffset={offTransf}
                  strokeLinecap="round"
                />
              )}
              {dashBinance > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={R}
                  fill="transparent"
                  stroke="#f59e0b"
                  strokeWidth="10"
                  strokeDasharray={`${dashBinance} ${C}`}
                  strokeDashoffset={offBinance}
                  strokeLinecap="round"
                />
              )}
              {dashCashea > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={R}
                  fill="transparent"
                  stroke="#ec4899"
                  strokeWidth="10"
                  strokeDasharray={`${dashCashea} ${C}`}
                  strokeDashoffset={offCashea}
                  strokeLinecap="round"
                />
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col justify-center items-center">
              <span className="text-3xl font-black text-slate-800">
                {total_ordenes}
              </span>
              <span className="text-sm font-medium text-slate-500">
                Órdenes
              </span>
            </div>
          </div>
        </div>

        {/* Leyenda */}
        <div className="lg:col-span-4 space-y-4">
          {[
            { color: "bg-orange-400", label: "Efectivo USD", pct: pctEfectivo },
            { color: "bg-cyan-400", label: "Tarjeta / POS", pct: pctTarjeta },
            {
              color: "bg-emerald-400",
              label: "Móvil / Transf.",
              pct: pctTransferencia,
            },
            {
              color: "bg-amber-400",
              label: "Binance / Zelle",
              pct: pctBinance,
            },
            {
              color: "bg-pink-400",
              label: "Cashea",
              pct: pctCashea,
            },
          ].map(({ color, label, pct }) => (
            <div key={label}>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2.5">
                  <div className={`w-3 h-3 rounded-full ${color}`} />
                  <span className="text-sm sm:text-base font-bold text-slate-600">
                    {label}
                  </span>
                </div>
                <span className="text-sm sm:text-base font-black text-slate-800">
                  {pct}%
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${color} rounded-full transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── WALLET CARDS (CLICKABLE) ── */}
      <section
        className="relative"
        onMouseEnter={() => setIsWalletHovering(true)}
        onMouseLeave={() => setIsWalletHovering(false)}
      >
        <div
          ref={walletTrackRef}
          onPointerDown={handleWalletPointerDown}
          onPointerMove={handleWalletPointerMove}
          onPointerUp={endWalletDrag}
          onPointerLeave={endWalletDrag}
          onPointerCancel={endWalletDrag}
          className={`flex gap-5 overflow-x-auto select-none [&::-webkit-scrollbar]:hidden ${
            isWalletDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
          style={{
            scrollBehavior: "auto",
            touchAction: "pan-y",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {(() => {
            const walletCards = [
              {
                key: "efectivo_usd",
                gradient: "from-[#f59e0b] to-[#ea580c]",
                icon: "$",
                label: "Efectivo USD",
                sub: "Billetes en Caja",
                value: `$${desglose_pagos.efectivo_usd.toFixed(2)}`,
                textLight: "text-orange-100",
              },
              {
                key: "efectivo_bs",
                gradient: "from-[#60a5fa] to-[#2563eb]",
                icon: "Bs",
                label: "Efectivo Local (Bs.)",
                sub: "Bolívares en Caja",
                value: `Bs. ${fmtBs(desglose_pagos.efectivo_bs)}`,
                textLight: "text-blue-100",
              },
              {
                key: "punto_de_venta_bs",
                gradient: "from-[#22d3ee] to-[#0891b2]",
                icon: <CreditCard className="w-5 h-5" />,
                label: "Punto de Venta",
                sub: "Tarjeta / Débito — en Bs.",
                value: `Bs. ${fmtBs(desglose_pagos.punto_de_venta_bs)}`,
                textLight: "text-cyan-100",
              },
              {
                key: "transferencia_bs",
                gradient: "from-[#34d399] to-[#059669]",
                icon: <Smartphone className="w-5 h-5" />,
                label: "Transferencia / PM",
                sub: "Pago Móvil & Transf. — en Bs.",
                value: `Bs. ${fmtBs(desglose_pagos.transferencia_bs)}`,
                textLight: "text-emerald-100",
              },
              {
                key: "binance_usd",
                gradient: "from-[#fbbf24] to-[#d97706]",
                icon: <Coins className="w-5 h-5" />,
                label: "Binance / Zelle",
                sub: "Cripto / Transferencia US",
                value: `$${Number(desglose_pagos.binance_usd || 0).toFixed(2)}`,
                textLight: "text-amber-100",
              },
              {
                key: "cashea_usd",
                gradient: "from-[#ec4899] to-[#db2777]",
                icon: <Wallet className="w-5 h-5" />,
                label: "Cashea",
                sub: "Crédito digital — en USD",
                value: `$${Number(desglose_pagos.cashea_usd || 0).toFixed(2)}`,
                textLight: "text-pink-100",
              },
            ];

            // Duplicamos el set de tarjetas para lograr un loop infinito:
            // cuando el track llega al final del primer set, se resetea el scrollLeft
            const carouselCards = [...walletCards, ...walletCards];

            return carouselCards.map(
              ({ key, gradient, icon, label, sub, value, textLight }, idx) => {
                const methodTxs = getTransactionsForMethod(key);
                return (
                  <button
                    key={`${key}-${idx}`}
                    onClick={() => {
                      // Si el usuario arrastró el carrusel, no abrir el modal
                      if (walletDragRef.current.moved) return;
                      setModalPage(1);
                      setSelectedMethodForModal({
                        key,
                        label,
                        value,
                        txs: methodTxs,
                      });
                    }}
                    onDragStart={(e) => e.preventDefault()}
                    style={{
                      width: WALLET_CARD_WIDTH,
                      minWidth: WALLET_CARD_WIDTH,
                    }}
                    className={`shrink-0 bg-gradient-to-b ${gradient} rounded-3xl p-6 shadow-sm text-white flex flex-col justify-between h-52 relative overflow-hidden text-left hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group`}
                  >
                    <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10">
                      <DollarSign className="w-36 h-36" />
                    </div>
                    <div className="flex justify-between items-start w-full">
                      <div
                        className={`w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center font-bold text-base`}
                      >
                        {icon}
                      </div>
                      <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-black">
                        {methodTxs.length} pedido
                        {methodTxs.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div>
                      <p
                        className={`text-xs font-semibold ${textLight} mb-1.5`}
                      >
                        {label}
                      </p>
                      <p className="text-2xl font-black truncate leading-tight">
                        {value}
                      </p>
                      <p className={`text-xs ${textLight} mt-1`}>{sub}</p>
                    </div>
                  </button>
                );
              },
            );
          })()}
        </div>

        {/* Paginación del carrusel */}
        <div className="flex justify-center items-center gap-2 mt-4">
          {Array.from({ length: WALLET_CARDS_COUNT }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ir a la tarjeta ${i + 1}`}
              onClick={() => {
                const track = walletTrackRef.current;
                if (track) {
                  track.scrollLeft = i * (WALLET_CARD_WIDTH + WALLET_CARD_GAP);
                }
                setWalletActiveIndex(i);
              }}
              className={`h-2 rounded-full transition-all duration-300 ${
                walletActiveIndex === i
                  ? "w-6 bg-pizza-red"
                  : "w-2 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>
      </section>

      {/* ── REEMBOLSOS DEL DÍA ── */}
      {reembolsos?.productos?.length > 0 && (
        <section className="bg-white border border-red-100 rounded-[32px] p-6 shadow-sm flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 shrink-0">
                <Undo2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">
                  Reembolsos del Día
                </h3>
                <p className="text-xs font-semibold text-slate-400">
                  {reembolsos.cantidad_reembolsos} reembolso
                  {reembolsos.cantidad_reembolsos !== 1 ? "s" : ""} •{" "}
                  {reembolsos.total_pizzas_devueltas} pizza
                  {reembolsos.total_pizzas_devueltas !== 1 ? "s" : ""} devuelta
                  {reembolsos.total_pizzas_devueltas !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total reembolsado
              </p>
              <p className="text-2xl font-black text-red-500">
                ${Number(reembolsos.total_usd || 0).toFixed(2)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {reembolsos.productos.map((p) => (
              <span
                key={p.nombre}
                className="inline-flex items-center gap-2 text-xs bg-red-50 border border-red-100 text-red-700 px-3 py-1.5 rounded-full font-bold"
              >
                {p.cantidad}x {p.nombre}
                <span className="text-red-400 font-semibold">
                  ${Number(p.monto || 0).toFixed(2)}
                </span>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ── MODAL DETALLE TRANSACCIONES POR MÉTODO ── */}
      {selectedMethodForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-2xl w-full p-6 animate-fade-in flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pizza-red/10 rounded-xl flex items-center justify-center text-pizza-red">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">
                    Pedidos - {selectedMethodForModal.label}
                  </h3>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">
                    Total Acumulado: {selectedMethodForModal.value}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMethodForModal(null)}
                className="text-slate-400 hover:text-slate-600 transition-all p-1.5 hover:bg-slate-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
              {selectedMethodForModal.txs.length > 0 ? (
                <>
                  {selectedMethodForModal.txs
                    .slice((modalPage - 1) * 10, modalPage * 10)
                    .map((t, idx) => (
                      <div
                        key={t.id_venta}
                        className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl"
                      >
                        <div className="w-10 h-10 bg-white border border-slate-100 text-slate-700 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                          #{t.id_venta}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">
                            {t.nombre_cliente || "Cliente General"}
                          </p>
                          <p className="text-xs text-slate-400 font-bold mt-0.5">
                            {t.hora} •{" "}
                            <span className="text-pizza-red">{t.despacho}</span>
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-black text-emerald-600">
                            {getPaymentAmountForMethod(
                              t,
                              selectedMethodForModal.key,
                            )}
                          </p>
                          <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                            Total Pedido: ${t.monto_total_usd.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}

                  {/* Controles de paginación del modal */}
                  {selectedMethodForModal.txs.length > 10 && (
                    <div className="flex items-center justify-between pt-4 select-none">
                      <button
                        type="button"
                        onClick={() => setModalPage((p) => Math.max(p - 1, 1))}
                        disabled={modalPage === 1}
                        className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                      >
                        Anterior
                      </button>
                      <span className="text-xs font-extrabold text-slate-500">
                        Pág. {modalPage} de{" "}
                        {Math.ceil(selectedMethodForModal.txs.length / 10)}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setModalPage((p) =>
                            Math.min(
                              p + 1,
                              Math.ceil(selectedMethodForModal.txs.length / 10),
                            ),
                          )
                        }
                        disabled={
                          modalPage >=
                          Math.ceil(selectedMethodForModal.txs.length / 10)
                        }
                        className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                      >
                        Siguiente
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-bold">
                    No hay transacciones registradas hoy con este método.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 mt-4 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedMethodForModal(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl text-sm transition-all shadow-md"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL PASO 2: DETALLE Y CLAVE ── */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full p-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pizza-red/10 rounded-xl flex items-center justify-center text-pizza-red">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">
                  Firma y Cuadre de Cierre
                </h3>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-all p-1.5 hover:bg-slate-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFinalSubmit} className="space-y-4">
              {/* Resumen cuadre */}
              <div className="bg-[#f8fafc] rounded-2xl p-4 border border-slate-100">
                <p className="text-[10px] font-semibold text-slate-400 mb-3">
                  Cuadre del Día
                </p>
                <div className="space-y-2.5">
                  {[
                    {
                      label: "Efectivo USD",
                      value: `$${desglose_pagos.efectivo_usd.toFixed(2)}`,
                      color: "text-orange-600",
                    },
                    {
                      label: "Efectivo Bs. (Local)",
                      value: `Bs. ${fmtBs(desglose_pagos.efectivo_bs)}`,
                      color: "text-blue-600",
                    },
                    {
                      label: "Punto de Venta / Tarjeta",
                      value: `Bs. ${fmtBs(desglose_pagos.punto_de_venta_bs)}`,
                      color: "text-cyan-600",
                    },
                    {
                      label: "Transferencia / Pago Móvil",
                      value: `Bs. ${fmtBs(desglose_pagos.transferencia_bs)}`,
                      color: "text-emerald-600",
                    },
                    {
                      label: "Binance / Zelle",
                      value: `$${Number(desglose_pagos.binance_usd || 0).toFixed(2)}`,
                      color: "text-amber-600",
                    },
                    {
                      label: "Cashea",
                      value: `$${Number(desglose_pagos.cashea_usd || 0).toFixed(2)}`,
                      color: "text-pink-600",
                    },
                  ].map(({ label, value, color }) => (
                    <div
                      key={label}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="text-slate-500 font-semibold">
                        {label}
                      </span>
                      <span className={`font-extrabold ${color}`}>{value}</span>
                    </div>
                  ))}
                  <div className="border-t border-slate-200 pt-2.5 mt-1 flex justify-between items-center">
                    <span className="text-slate-800 font-black">
                      Total en Divisa (USDT):
                    </span>
                    <span className="text-pizza-red font-black text-lg">
                      ${total_divisa.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Clave */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-2">
                  Clave de Cierre
                </label>
                <input
                  type="password"
                  pattern="[0-9]*"
                  maxLength={4}
                  placeholder="••••"
                  value={claveCierre}
                  onChange={(e) =>
                    setClaveCierre(e.target.value.replace(/\D/g, ""))
                  }
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pizza-red/20 focus:border-pizza-red transition-all text-sm font-semibold"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl text-sm transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-sm transition-all shadow-md flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmar Cierre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
