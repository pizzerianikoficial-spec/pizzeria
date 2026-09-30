import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoImg from "../assets/login/logo.png";
import { getSucursalPalette } from "../components/admin/CierresAdminScreen";

const MAX_LOGO_PX = 220;

const loadImageDownscaled = async (src) => {
  const img = await new Promise((resolve) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => resolve(null);
    im.src = src;
  });
  if (!img) return null;
  try {
    const scale = Math.min(
      MAX_LOGO_PX / (img.naturalWidth || 1),
      MAX_LOGO_PX / (img.naturalHeight || 1),
      1,
    );
    const w = Math.max(1, Math.round((img.naturalWidth || 1) * scale));
    const h = Math.max(1, Math.round((img.naturalHeight || 1) * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
};

export const exportCierrePDF = async (cierre) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Load & downscale the logo image
  const logoDataUrl = await loadImageDownscaled(logoImg);

  // Deduce or fallback rate
  let tasa = cierre.tasa_cambio;
  if (!tasa) {
    const totalBs =
      Number(cierre.monto_efectivo_bs || 0) +
      Number(cierre.monto_punto_bs || 0) +
      Number(cierre.monto_pago_movil_bs || 0);
    const totalUsdBsEq =
      Number(cierre.total_usdt || 0) - Number(cierre.monto_efectivo_usd || 0);
    if (totalUsdBsEq > 0 && totalBs > 0) {
      tasa = totalBs / totalUsdBsEq;
    } else {
      tasa = 1.0;
    }
  }

  const esDelivery =
    String(cierre.tipo_cierre || "").toLowerCase() === "delivery";

  // --- DYNAMIC COLOR PALETTE ---
  // Delivery usa una paleta amarilla/ámbar de alto contraste para distinguirlo claramente de la caja de salón
  const branchPalette = getSucursalPalette(cierre.id_sucursal);
  const ACCENT = esDelivery
    ? [217, 119, 6] // Amber-600: amarillo dorado cálido y legible
    : branchPalette.bg;
  const ACCENT_LIGHT = esDelivery
    ? [254, 243, 199] // Amber-100: amarillo claro suave
    : branchPalette.light;
  const BOX_BG = esDelivery
    ? [255, 251, 235] // Amber-50: fondo cálido para tarjetas
    : [248, 250, 252]; // Slate-50

  // Static colors
  const TEXT_DARK = [30, 41, 59]; // slate-800
  const TEXT_MUTED = [148, 163, 184]; // slate-400
  const SLATE_600 = [71, 85, 105];
  const WHITE = [255, 255, 255];

  // Money formatters
  const fmtMoneyUSD = (n) => `$${Number(n || 0).toFixed(2)}`;
  const fmtMoneyBs = (n) =>
    `Bs. ${Number(n || 0).toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formattedDate = cierre.fecha_hora
    ? new Date(cierre.fecha_hora).toLocaleDateString("es-VE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

  const formattedTime = cierre.fecha_hora
    ? new Date(cierre.fecha_hora).toLocaleTimeString("es-VE", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "—";

  // ═══════════════════════════════════════════════════════
  // HEADER — Logo + Company info
  // ═══════════════════════════════════════════════════════
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", 14, 13, 30, 30);
  }

  // Company name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(...TEXT_DARK);
  doc.text("PIZZERÍA NICO", 196, 19, { align: "right" });

  // Branch name (colored)
  const sucursalNombre = cierre.sucursal || "Sucursal Principal";
  const sucursalDir = cierre.sucursal_direccion || cierre.direccion || "";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...ACCENT);
  doc.text(sucursalNombre.toUpperCase(), 196, 26, { align: "right" });

  if (sucursalDir) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...SLATE_600);
    doc.text(sucursalDir, 196, 31, { align: "right" });
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_MUTED);
  doc.text("Sistema de Control Interno y Caja", 196, sucursalDir ? 36 : 31, {
    align: "right",
  });

  // Divider line (accent colored)
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.8);
  doc.line(14, 47, 196, 47);

  // ═══════════════════════════════════════════════════════
  // DOCUMENT TITLE
  // ═══════════════════════════════════════════════════════
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...TEXT_DARK);
  doc.text(
    esDelivery
      ? "REPORTE DE CIERRE DE CAJA · DELIVERY"
      : "REPORTE DE CIERRE DE CAJA · SALÓN",
    14,
    56,
  );

  // Badge de tipo de caja
  if (esDelivery) {
    doc.setFillColor(254, 240, 138); // Yellow-200
    doc.setDrawColor(217, 119, 6); // Amber-600
    doc.setLineWidth(0.5);
    doc.roundedRect(132, 51, 32, 6.5, 2, 2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(120, 53, 15); // Amber-900
    doc.text("CAJA DELIVERY", 148, 55.4, { align: "center" });
  } else {
    doc.setFillColor(241, 245, 249); // Slate-100
    doc.setDrawColor(203, 213, 225); // Slate-300
    doc.setLineWidth(0.5);
    doc.roundedRect(134, 51, 30, 6.5, 2, 2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85); // Slate-700
    doc.text("CAJA SALÓN", 149, 55.4, { align: "center" });
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...ACCENT);
  doc.text(`#${cierre.id_cierre || "N/A"}`, 196, 56, { align: "right" });

  // ═══════════════════════════════════════════════════════
  // METADATA GRID BOX
  // ═══════════════════════════════════════════════════════
  doc.setFillColor(...BOX_BG);
  doc.roundedRect(14, 61, 182, 32, 4, 4, "F");

  // Left accent stripe inside box
  doc.setFillColor(...ACCENT);
  doc.roundedRect(14, 61, 3, 32, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...(esDelivery ? ACCENT : SLATE_600));
  doc.text(
    esDelivery ? "INFORMACIÓN DEL CIERRE · DELIVERY" : "INFORMACIÓN DEL CIERRE",
    21,
    68,
  );

  // Row 1
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_DARK);
  doc.text("Cajero:", 21, 76);
  doc.setFont("helvetica", "normal");
  doc.text(cierre.usuario_nombre || "Cajero Desconocido", 46, 76);

  doc.setFont("helvetica", "bold");
  doc.text("Tipo de Caja:", 120, 76);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...ACCENT);
  doc.text(
    esDelivery ? "Caja Delivery (Repartos)" : "Caja Salón / Mostrador",
    144,
    76,
  );

  // Row 2
  doc.setTextColor(...TEXT_DARK);
  doc.setFont("helvetica", "bold");
  doc.text("Fecha:", 21, 83);
  doc.setFont("helvetica", "normal");
  doc.text(`${formattedDate}  •  ${formattedTime}`, 46, 83);

  doc.setFont("helvetica", "bold");
  doc.text("Sucursal:", 120, 83);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...ACCENT);
  doc.text(sucursalNombre, 144, 83);

  // Row 3
  doc.setTextColor(...TEXT_DARK);
  doc.setFont("helvetica", "bold");
  doc.text("Órdenes:", 21, 90);
  doc.setFont("helvetica", "normal");
  doc.text(`${cierre.num_ordenes || 0}`, 46, 90);

  if (tasa && tasa !== 1.0) {
    doc.setFont("helvetica", "bold");
    doc.text("Tasa de Cambio:", 120, 90);
    doc.setFont("helvetica", "normal");
    doc.text(`Bs. ${tasa.toFixed(2)} / USD`, 148, 90);
  }

  // ═══════════════════════════════════════════════════════
  // TOTAL HERO BOX
  // ═══════════════════════════════════════════════════════
  doc.setFillColor(...ACCENT_LIGHT);
  doc.roundedRect(14, 99, 182, 20, 3, 3, "F");

  // Left accent stripe
  doc.setFillColor(...ACCENT);
  doc.roundedRect(14, 99, 4, 20, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...TEXT_DARK);
  doc.text(
    esDelivery
      ? "TOTAL GENERAL CONCILIADO · CAJA DELIVERY (USDT):"
      : "TOTAL GENERAL CONCILIADO · CAJA SALÓN (USDT):",
    22,
    112,
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...ACCENT);
  doc.text(fmtMoneyUSD(cierre.total_usdt), 193, 113, { align: "right" });

  // ═══════════════════════════════════════════════════════
  // BREAKDOWN TABLE
  // ═══════════════════════════════════════════════════════
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_DARK);
  doc.text("Desglose Detallado por Método de Pago", 14, 130);

  autoTable(doc, {
    startY: 134,
    head: [["Método de Pago", "Moneda", "Monto Declarado", "Equiv. USD"]],
    body: [
      [
        "Efectivo en Dólares (USD)",
        "USD ($)",
        fmtMoneyUSD(cierre.monto_efectivo_usd),
        fmtMoneyUSD(cierre.monto_efectivo_usd),
      ],
      [
        "Efectivo en Bolívares (Bs)",
        "VES (Bs.)",
        fmtMoneyBs(cierre.monto_efectivo_bs),
        tasa > 0 ? fmtMoneyUSD(cierre.monto_efectivo_bs / tasa) : "—",
      ],
      [
        "Punto de Venta / Tarjeta (Bs)",
        "VES (Bs.)",
        fmtMoneyBs(cierre.monto_punto_bs),
        tasa > 0 ? fmtMoneyUSD(cierre.monto_punto_bs / tasa) : "—",
      ],
      [
        "Transferencia / Pago Móvil (Bs)",
        "VES (Bs.)",
        fmtMoneyBs(cierre.monto_pago_movil_bs),
        tasa > 0 ? fmtMoneyUSD(cierre.monto_pago_movil_bs / tasa) : "—",
      ],
      [
        "Binance / Zelle (USD)",
        "USD ($)",
        fmtMoneyUSD(cierre.monto_binance_usd),
        fmtMoneyUSD(cierre.monto_binance_usd),
      ],
      [
        "Cashea (USD)",
        "USD ($)",
        fmtMoneyUSD(cierre.monto_cashea_usd),
        fmtMoneyUSD(cierre.monto_cashea_usd),
      ],
    ],
    headStyles: {
      fillColor: ACCENT,
      textColor: WHITE,
      fontStyle: "bold",
      fontSize: 9,
      halign: "left",
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 72 },
      1: { halign: "center", cellWidth: 24 },
      2: { halign: "right", cellWidth: 48 },
      3: {
        halign: "right",
        cellWidth: 38,
        fontStyle: "bold",
        textColor: ACCENT,
      },
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
      valign: "middle",
    },
    alternateRowStyles: {
      fillColor: ACCENT_LIGHT,
    },
    margin: { left: 14, right: 14 },
    theme: "striped",
  });

  const reembolsos = cierre.reembolsos;
  if (reembolsos && reembolsos.productos && reembolsos.productos.length > 0) {
    const lastY = doc.lastAutoTable?.finalY || 178;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...TEXT_DARK);
    doc.text("REEMBOLSOS DEL DÍA", 14, lastY + 12);

    // Mini-caja de estadísticas
    const statsY = lastY + 16;
    doc.setFillColor(...ACCENT_LIGHT);
    doc.roundedRect(14, statsY, 182, 13, 3, 3, "F");
    doc.setFontSize(9);
    doc.setTextColor(...TEXT_MUTED);
    doc.text("Pizzas devueltas:", 20, statsY + 5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...ACCENT);
    doc.text(String(reembolsos.total_pizzas_devueltas || 0), 48, statsY + 5);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...TEXT_MUTED);
    doc.text("Total reembolsado (USD):", 20, statsY + 10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...ACCENT);
    doc.text(fmtMoneyUSD(reembolsos.total_usd), 55, statsY + 10);

    autoTable(doc, {
      startY: statsY + 18,
      head: [["Producto / Pizza Devuelta", "Cantidad", "Monto Reembolsado"]],
      body: reembolsos.productos.map((p) => [
        p.nombre,
        String(p.cantidad),
        fmtMoneyUSD(p.monto),
      ]),
      headStyles: {
        fillColor: ACCENT,
        textColor: WHITE,
        fontStyle: "bold",
        fontSize: 9,
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 120 },
        1: { halign: "center", cellWidth: 30 },
        2: {
          halign: "right",
          cellWidth: 32,
          fontStyle: "bold",
          textColor: ACCENT,
        },
      },
      styles: {
        fontSize: 9,
        cellPadding: 4,
        valign: "middle",
      },
      alternateRowStyles: {
        fillColor: ACCENT_LIGHT,
      },
      margin: { left: 14, right: 14 },
      theme: "striped",
    });
  }

  // ═══════════════════════════════════════════════════════
  // VENTAS DEL DÍA POR TIPO DE DESPACHO
  // ═══════════════════════════════════════════════════════
  const transacciones = cierre.transacciones || [];

  const gruposPorTipo = (["Local", "Delivery", "Pick Up", "Llevar"])
    .map((tipo) => ({
      tipo,
      ventas: transacciones.filter(
        (tx) =>
          String(tx.despacho || "").trim().toLowerCase() ===
          tipo.toLowerCase(),
      ),
      totalUSD: transacciones
        .filter(
          (tx) =>
            String(tx.despacho || "").trim().toLowerCase() ===
            tipo.toLowerCase(),
        )
        .reduce((s, v) => s + Number(v.monto_total_usd || 0), 0),
    }))
    .filter((g) => g.ventas.length > 0);

  if (gruposPorTipo.length > 0) {
    let cursorY = (doc.lastAutoTable?.finalY || 150) + 12;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...TEXT_DARK);
    doc.text("VENTAS DEL DÍA POR TIPO DE DESPACHO", 14, cursorY);

    const totalVentasUSD = gruposPorTipo.reduce(
      (s, g) => s + g.totalUSD,
      0,
    );
    const totalOrdenesDia = transacciones.length;

    const filas = gruposPorTipo.map((g) => [
      g.tipo.toUpperCase(),
      String(g.ventas.length),
      fmtMoneyUSD(g.totalUSD),
    ]);
    const idxTotal = filas.length;

    autoTable(doc, {
      startY: cursorY + 5,
      head: [["Tipo de Despacho", "Órdenes", "Total (USD)"]],
      body: [
        ...filas,
        ["TOTAL GENERAL", String(totalOrdenesDia), fmtMoneyUSD(totalVentasUSD)],
      ],
      headStyles: {
        fillColor: ACCENT,
        textColor: WHITE,
        fontStyle: "bold",
        fontSize: 9,
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 122 },
        1: { halign: "center", cellWidth: 28 },
        2: {
          halign: "right",
          cellWidth: 34,
          fontStyle: "bold",
          textColor: ACCENT,
        },
      },
      styles: { fontSize: 9, cellPadding: 4, valign: "middle" },
      alternateRowStyles: { fillColor: ACCENT_LIGHT },
      margin: { left: 14, right: 14 },
      theme: "striped",
      didParseCell: (data) => {
        if (data.section === "body" && data.row.index === idxTotal) {
          data.cell.styles.fillColor = TEXT_DARK;
          data.cell.styles.textColor = WHITE;
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.halign =
            data.column.index === 1
              ? "center"
              : data.column.index === 2
                ? "right"
                : "left";
        }
      },
    });
  }

  // ═══════════════════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════════════════
  const totalPaginas = doc.getNumberOfPages();
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(
      `Documento generado el ${new Date().toLocaleString("es-VE")} · ${sucursalNombre}`,
      14,
      285,
    );
    doc.text(`Pág ${i} de ${totalPaginas}`, 196, 285, { align: "right" });
  }

  // Nombre de archivo: Cierre_caja_28-09-2026 (o Cierre_delivery_...)
  const fechaArchivo = cierre.fecha_hora ? new Date(cierre.fecha_hora) : new Date();
  const dd = String(fechaArchivo.getDate()).padStart(2, "0");
  const mm = String(fechaArchivo.getMonth() + 1).padStart(2, "0");
  const yyyy = fechaArchivo.getFullYear();
  const fileName = `Cierre_${esDelivery ? "delivery" : "caja"}_${dd}-${mm}-${yyyy}.pdf`;

  const blob = doc.output("blob");

  // Descarga con el MISMO blob que se devuelve para el correo
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  return { blob, fileName };
};
