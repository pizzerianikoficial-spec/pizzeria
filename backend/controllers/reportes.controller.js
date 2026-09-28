import db from "../config/turso.js";

const queryRows = async (sql, args = []) => {
  const result = await db.execute({ sql, args });
  return result.rows;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildDateRange(periodo, fecha) {
  if (periodo === "semana") {
    const [yearStr, weekStr] = (fecha || "").split("-W");
    const year = parseInt(yearStr) || new Date().getFullYear();
    const week = parseInt(weekStr) || 1;

    const jan4 = new Date(year, 0, 4);
    const jan4Day = jan4.getDay() || 7;
    const monday = new Date(jan4);
    monday.setDate(jan4.getDate() - (jan4Day - 1) + (week - 1) * 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const fmt = (d) => d.toISOString().split("T")[0];
    return {
      conditionVentas: `DATE(v.fecha_hora) BETWEEN ? AND ?`,
      params: [fmt(monday), fmt(sunday)],
      start: monday,
      end: sunday,
    };
  } else {
    const [yearStr, monthStr] = (fecha || "").split("-");
    const year = parseInt(yearStr) || new Date().getFullYear();
    const month = parseInt(monthStr) || new Date().getMonth() + 1;
    const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).toISOString().split("T")[0];
    return {
      conditionVentas: `DATE(v.fecha_hora) BETWEEN ? AND ?`,
      params: [firstDay, lastDay],
      start: new Date(firstDay),
      end: new Date(lastDay),
    };
  }
}

// ─── Obtener sucursales activas ─────────────────────────────────────────────
export const obtenerSucursalesReporte = async (req, res) => {
  try {
    const rows = await queryRows(
      `SELECT id_sucursal AS id, sucursal AS nombre, direccion
       FROM sucursal
       WHERE estado = 'Activo'
       ORDER BY id_sucursal ASC`,
    );
    return res.json({ success: true, sucursales: rows });
  } catch (error) {
    console.error("Error obteniendo sucursales para reporte:", error);
    return res.status(500).json({ success: false, mensaje: "Error interno" });
  }
};

// ─── KPIs de resumen ────────────────────────────────────────────────────────
export const obtenerResumenReporte = async (req, res) => {
  const { id_sucursal, periodo = "mes", fecha, modulo = "todos" } = req.query;

  try {
    const { conditionVentas, params } = buildDateRange(periodo, fecha);

    const branchVentas = id_sucursal ? `AND v.id_sucursal = ?` : "";
    const branchParams = id_sucursal ? [Number(id_sucursal)] : [];

    // Tasa de cambio actual
    const tasaRows = await queryRows(
      "SELECT tasa_sistema FROM configuracion_tasa WHERE id_config = 1",
    );
    const tasa = tasaRows.length > 0 ? Number(tasaRows[0].tasa_sistema) : 1;

    // Resumen desde ventas
    const ventasRows = await queryRows(
      `SELECT
         COUNT(*) AS total_ordenes,
         IFNULL(SUM(v.monto_total_usd), 0) AS total_usd,
         IFNULL(AVG(v.monto_total_usd), 0) AS ticket_promedio_usd
       FROM ventas v
       WHERE ${conditionVentas} ${branchVentas} AND v.estado != 'Reembolsado'`,
      [...params, ...branchParams],
    );

    // Métricas por tipo de producto si hay filtro de módulo
    let moduloCondition = "";
    if (modulo === "heladeria") {
      moduloCondition = "AND vd.tipo_producto = 'Helado'";
    } else if (modulo === "pizzeria") {
      moduloCondition = "AND vd.tipo_producto != 'Helado'";
    }

    const detallesVentas = await queryRows(
      `SELECT
         IFNULL(SUM(vd.monto_total), 0) AS total_modulo_usd,
         COUNT(DISTINCT v.id_venta)    AS total_modulo_ordenes,
         IFNULL(SUM(vd.cantidad), 0)   AS total_modulo_items
       FROM venta_detalle vd
       INNER JOIN ventas v ON v.id_venta = vd.id_venta
       WHERE ${conditionVentas} ${branchVentas} AND v.estado != 'Reembolsado' ${moduloCondition}`,
      [...params, ...branchParams],
    );

    const r = ventasRows[0];
    const mod = detallesVentas[0];

    const isFilteredByModule = modulo === "heladeria" || modulo === "pizzeria";

    return res.json({
      success: true,
      tasa,
      resumen: {
        total_usd: isFilteredByModule
          ? Number(mod.total_modulo_usd)
          : Number(r.total_usd),
        total_ordenes: isFilteredByModule
          ? Number(mod.total_modulo_ordenes)
          : Number(r.total_ordenes),
        total_items: Number(mod.total_modulo_items),
        ticket_promedio_usd:
          isFilteredByModule && Number(mod.total_modulo_ordenes) > 0
            ? Number(mod.total_modulo_usd) / Number(mod.total_modulo_ordenes)
            : Number(r.ticket_promedio_usd),
      },
    });
  } catch (error) {
    console.error("Error en resumen reporte:", error);
    return res.status(500).json({ success: false, mensaje: "Error interno" });
  }
};

// ─── Desglose de pagos ──────────────────────────────────────────────────────
export const obtenerPagosReporte = async (req, res) => {
  const { id_sucursal, periodo = "mes", fecha } = req.query;

  try {
    const { conditionVentas, params } = buildDateRange(periodo, fecha);
    const branchVentas = id_sucursal ? `AND v.id_sucursal = ?` : "";
    const branchParams = id_sucursal ? [Number(id_sucursal)] : [];

    const rows = await queryRows(
      `SELECT
         IFNULL(SUM(CASE WHEN vp.metodo_pago LIKE '%efectivo%' AND UPPER(vp.referencia) != 'BS' THEN vp.monto_usd ELSE 0 END), 0) AS efectivo_usd,
         IFNULL(SUM(CASE WHEN vp.metodo_pago LIKE '%efectivo%' AND UPPER(vp.referencia) = 'BS' THEN vp.monto_bs ELSE 0 END), 0) AS efectivo_bs,
         IFNULL(SUM(CASE WHEN vp.metodo_pago LIKE '%punto%' OR vp.metodo_pago LIKE '%tarjeta%' THEN vp.monto_bs ELSE 0 END), 0) AS punto_bs,
         IFNULL(SUM(CASE WHEN vp.metodo_pago LIKE '%binance%' OR vp.metodo_pago LIKE '%zelle%' THEN vp.monto_usd ELSE 0 END), 0) AS binance_usd,
         IFNULL(SUM(CASE WHEN vp.metodo_pago NOT LIKE '%efectivo%' AND vp.metodo_pago NOT LIKE '%punto%' AND vp.metodo_pago NOT LIKE '%tarjeta%' AND vp.metodo_pago NOT LIKE '%binance%' AND vp.metodo_pago NOT LIKE '%zelle%' THEN vp.monto_bs ELSE 0 END), 0) AS pago_movil_bs
       FROM ventas_pagos vp
       INNER JOIN ventas v ON v.id_venta = vp.id_venta
       WHERE ${conditionVentas} ${branchVentas} AND v.estado != 'Reembolsado'`,
      [...params, ...branchParams],
    );

    const tasaRows = await queryRows(
      "SELECT tasa_sistema FROM configuracion_tasa WHERE id_config = 1",
    );
    const tasa = tasaRows.length > 0 ? Number(tasaRows[0].tasa_sistema) : 1;

    const r = rows[0];
    const efectivoUsd = Number(r.efectivo_usd);
    const efectivoBsEnUsd = tasa > 0 ? Number(r.efectivo_bs) / tasa : 0;
    const puntoEnUsd = tasa > 0 ? Number(r.punto_bs) / tasa : 0;
    const pagoMovilEnUsd = tasa > 0 ? Number(r.pago_movil_bs) / tasa : 0;
    const binanceUsd = Number(r.binance_usd);

    return res.json({
      success: true,
      tasa,
      pagos: [
        {
          nombre: "Efectivo USD",
          valor_usd: efectivoUsd,
          valor_bs: 0,
          color: "#10b981",
        },
        {
          nombre: "Efectivo Bs",
          valor_usd: efectivoBsEnUsd,
          valor_bs: Number(r.efectivo_bs),
          color: "#14b8a6",
        },
        {
          nombre: "Punto de Venta",
          valor_usd: puntoEnUsd,
          valor_bs: Number(r.punto_bs),
          color: "#3b82f6",
        },
        {
          nombre: "Pago Móvil",
          valor_usd: pagoMovilEnUsd,
          valor_bs: Number(r.pago_movil_bs),
          color: "#8b5cf6",
        },
        {
          nombre: "Binance/Zelle",
          valor_usd: binanceUsd,
          valor_bs: 0,
          color: "#f59e0b",
        },
      ],
    });
  } catch (error) {
    console.error("Error en pagos reporte:", error);
    return res.status(500).json({ success: false, mensaje: "Error interno" });
  }
};

// ─── Tendencia (Serie Temporal) ─────────────────────────────────────────────
export const obtenerTendenciaReporte = async (req, res) => {
  const { id_sucursal, periodo = "mes", fecha, modulo = "todos" } = req.query;

  try {
    const { conditionVentas, params, start, end } = buildDateRange(
      periodo,
      fecha,
    );
    const branchVentas = id_sucursal ? `AND v.id_sucursal = ?` : "";
    const branchParams = id_sucursal ? [Number(id_sucursal)] : [];

    let rows = [];

    if (modulo === "heladeria" || modulo === "pizzeria") {
      const filter =
        modulo === "heladeria"
          ? "AND vd.tipo_producto = 'Helado'"
          : "AND vd.tipo_producto != 'Helado'";
      const vRows = await queryRows(
        `SELECT
           strftime('%Y-%m-%d', v.fecha_hora) AS fecha,
           IFNULL(SUM(vd.monto_total), 0)        AS total_usd,
           COUNT(DISTINCT v.id_venta)            AS ordenes
         FROM venta_detalle vd
         INNER JOIN ventas v ON v.id_venta = vd.id_venta
         WHERE ${conditionVentas} ${branchVentas} AND v.estado != 'Reembolsado' ${filter}
         GROUP BY fecha
         ORDER BY fecha ASC`,
        [...params, ...branchParams],
      );
      rows = vRows;
    } else {
      const vRows = await queryRows(
        `SELECT
           strftime('%Y-%m-%d', v.fecha_hora) AS fecha,
           IFNULL(SUM(v.monto_total_usd), 0) AS total_usd,
           COUNT(*) AS ordenes
         FROM ventas v
         WHERE ${conditionVentas} ${branchVentas} AND v.estado != 'Reembolsado'
         GROUP BY fecha
         ORDER BY fecha ASC`,
        [...params, ...branchParams],
      );
      rows = vRows;
    }

    const dataMap = {};
    rows.forEach((r) => {
      dataMap[r.fecha] = {
        fecha: r.fecha,
        total_usd: Number(r.total_usd),
        ordenes: Number(r.ordenes),
      };
    });

    const series = [];
    const cur = new Date(start);
    const endDate = new Date(end);
    while (cur <= endDate) {
      const key = cur.toISOString().split("T")[0];
      const dayLabel =
        periodo === "semana"
          ? cur.toLocaleDateString("es-VE", {
              weekday: "short",
              day: "2-digit",
            })
          : cur.toLocaleDateString("es-VE", {
              day: "2-digit",
              month: "2-digit",
            });

      series.push(
        dataMap[key] || {
          fecha: key,
          total_usd: 0,
          ordenes: 0,
        },
      );
      series[series.length - 1].label = dayLabel;
      cur.setDate(cur.getDate() + 1);
    }

    return res.json({ success: true, tendencia: series });
  } catch (error) {
    console.error("Error en tendencia reporte:", error);
    return res.status(500).json({ success: false, mensaje: "Error interno" });
  }
};

// ─── Top Productos Vendidos ──────────────────────────────────────────────────
export const obtenerTopProductosReporte = async (req, res) => {
  const { id_sucursal, periodo = "mes", fecha, modulo = "todos" } = req.query;

  try {
    const { conditionVentas, params } = buildDateRange(periodo, fecha);
    const branchVentas = id_sucursal ? `AND v.id_sucursal = ?` : "";
    const branchParams = id_sucursal ? [Number(id_sucursal)] : [];

    let filter = "";
    if (modulo === "heladeria") filter = "AND vd.tipo_producto = 'Helado'";
    if (modulo === "pizzeria") filter = "AND vd.tipo_producto != 'Helado'";

    const rows = await queryRows(
      `SELECT
         vd.tipo_producto,
         COALESCE(p.nombre, b.nombre, h.nombre, ex.nombre, 'Producto') AS producto_nombre,
         IFNULL(SUM(vd.cantidad), 0)    AS cantidad_vendida,
         IFNULL(SUM(vd.monto_total), 0)  AS total_recaudado_usd
       FROM venta_detalle vd
       INNER JOIN ventas v ON v.id_venta = vd.id_venta
       LEFT JOIN pizza p       ON p.id_pizza = vd.id_producto_origen AND vd.tipo_producto = 'Pizza'
       LEFT JOIN bebidas b     ON b.id_bebida = vd.id_producto_origen AND vd.tipo_producto = 'Bebida'
       LEFT JOIN heladeria h   ON h.id_heladeria = vd.id_producto_origen AND vd.tipo_producto = 'Helado'
       LEFT JOIN extras ex     ON ex.id_extras = vd.id_producto_origen AND vd.tipo_producto = 'Extra'
       WHERE ${conditionVentas} ${branchVentas} AND v.estado != 'Reembolsado' ${filter}
       GROUP BY vd.tipo_producto, producto_nombre
       ORDER BY cantidad_vendida DESC
       LIMIT 10`,
      [...params, ...branchParams],
    );

    return res.json({ success: true, topProductos: rows });
  } catch (error) {
    console.error("Error en top productos reporte:", error);
    return res.status(500).json({ success: false, mensaje: "Error interno" });
  }
};
