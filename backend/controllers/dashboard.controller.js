import db from "../config/turso.js";

const queryRows = async (sql, args = []) => {
  const result = await db.execute({ sql, args });
  return result.rows;
};

// ─── Dashboard Completo Resumen Consolidado ──────────────────────────────────
export const obtenerDashboardStats = async (req, res) => {
  const { id_sucursal, periodo = "semana" } = req.query;

  try {
    const branchCondition = id_sucursal ? `AND v.id_sucursal = ?` : "";
    const branchParams = id_sucursal ? [Number(id_sucursal)] : [];

    // Tasa de cambio del sistema
    const tasaRows = await queryRows(
      "SELECT tasa_sistema FROM configuracion_tasa WHERE id_config = 1",
    );
    const tasa = tasaRows.length > 0 ? Number(tasaRows[0].tasa_sistema) : 1;

    // Determinar rangos de fechas (Actual vs Anterior)
    const now = new Date();
    let startDate, endDate, prevStartDate, prevEndDate;

    if (periodo === "hoy") {
      const todayStr = now.toISOString().split("T")[0];
      startDate = `${todayStr} 00:00:00`;
      endDate = `${todayStr} 23:59:59`;

      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const yestStr = yesterday.toISOString().split("T")[0];
      prevStartDate = `${yestStr} 00:00:00`;
      prevEndDate = `${yestStr} 23:59:59`;
    } else if (periodo === "semana") {
      const dayOfWeek = now.getDay() || 7;
      const monday = new Date(now);
      monday.setDate(now.getDate() - dayOfWeek + 1);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      startDate = `${monday.toISOString().split("T")[0]} 00:00:00`;
      endDate = `${sunday.toISOString().split("T")[0]} 23:59:59`;

      const prevMonday = new Date(monday);
      prevMonday.setDate(monday.getDate() - 7);
      const prevSunday = new Date(prevMonday);
      prevSunday.setDate(prevMonday.getDate() + 6);
      prevStartDate = `${prevMonday.toISOString().split("T")[0]} 00:00:00`;
      prevEndDate = `${prevSunday.toISOString().split("T")[0]} 23:59:59`;
    } else if (periodo === "ano") {
      const year = now.getFullYear();
      startDate = `${year}-01-01 00:00:00`;
      endDate = `${year}-12-31 23:59:59`;

      prevStartDate = `${year - 1}-01-01 00:00:00`;
      prevEndDate = `${year - 1}-12-31 23:59:59`;
    } else {
      // "mes" por defecto
      const year = now.getFullYear();
      const month = now.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      startDate = `${firstDay.toISOString().split("T")[0]} 00:00:00`;
      endDate = `${lastDay.toISOString().split("T")[0]} 23:59:59`;

      const prevFirstDay = new Date(year, month - 1, 1);
      const prevLastDay = new Date(year, month, 0);
      prevStartDate = `${prevFirstDay.toISOString().split("T")[0]} 00:00:00`;
      prevEndDate = `${prevLastDay.toISOString().split("T")[0]} 23:59:59`;
    }

    // Ejecutar consultas en paralelo para máxima velocidad (<40ms)
    const [
      curVentasRows,
      prevVentasRows,
      curClientesRows,
      prevClientesRows,
      categoriasRows,
      tendenciaRows,
      statusRows,
    ] = await Promise.all([
      // 1. Métricas período actual
      queryRows(
        `SELECT 
           COUNT(*) AS total_ordenes,
           IFNULL(SUM(v.monto_total_usd), 0) AS total_usd,
           IFNULL(AVG(v.monto_total_usd), 0) AS ticket_promedio_usd,
           IFNULL(MAX(v.monto_total_usd), 0) AS pico_maximo_usd
         FROM ventas v
         WHERE v.fecha_hora BETWEEN ? AND ? ${branchCondition} AND v.estado != 'Reembolsado'`,
        [startDate, endDate, ...branchParams],
      ),
      // 2. Métricas período anterior (para % incremento)
      queryRows(
        `SELECT 
           COUNT(*) AS total_ordenes,
           IFNULL(SUM(v.monto_total_usd), 0) AS total_usd
         FROM ventas v
         WHERE v.fecha_hora BETWEEN ? AND ? ${branchCondition} AND v.estado != 'Reembolsado'`,
        [prevStartDate, prevEndDate, ...branchParams],
      ),
      // 3. Clientes únicos período actual
      queryRows(
        `SELECT COUNT(DISTINCT id_cliente) AS total_clientes FROM ventas v
         WHERE v.fecha_hora BETWEEN ? AND ? ${branchCondition}`,
        [startDate, endDate, ...branchParams],
      ),
      // 4. Clientes únicos período anterior
      queryRows(
        `SELECT COUNT(DISTINCT id_cliente) AS total_clientes FROM ventas v
         WHERE v.fecha_hora BETWEEN ? AND ? ${branchCondition}`,
        [prevStartDate, prevEndDate, ...branchParams],
      ),
      // 5. Categorías de producto
      queryRows(
        `SELECT 
           vd.tipo_producto AS categoria,
           IFNULL(SUM(vd.monto_total), 0) AS monto_usd,
           IFNULL(SUM(vd.cantidad), 0) AS cantidad
         FROM venta_detalle vd
         INNER JOIN ventas v ON v.id_venta = vd.id_venta
         WHERE v.fecha_hora BETWEEN ? AND ? ${branchCondition} AND v.estado != 'Reembolsado'
         GROUP BY vd.tipo_producto
         ORDER BY monto_usd DESC`,
        [startDate, endDate, ...branchParams],
      ),
      // 6. Tendencia (Timeline)
      queryRows(
        `SELECT 
           strftime(${periodo === "ano" ? "'%m'" : "'%d %m'"}, v.fecha_hora) AS label,
           strftime('%Y-%m-%d', v.fecha_hora) AS fecha_raw,
           IFNULL(SUM(v.monto_total_usd), 0) AS total_usd,
           COUNT(*) AS ordenes
         FROM ventas v
         WHERE v.fecha_hora BETWEEN ? AND ? ${branchCondition} AND v.estado != 'Reembolsado'
         GROUP BY ${periodo === "ano" ? "strftime('%m', v.fecha_hora)" : "DATE(v.fecha_hora)"}
         ORDER BY fecha_raw ASC`,
        [startDate, endDate, ...branchParams],
      ),
      // 7. Estado rápido de órdenes (Pendientes, En cocina, Listas hoy)
      queryRows(
        `SELECT 
           SUM(CASE WHEN v.estado = 'Pendiente' THEN 1 ELSE 0 END) AS pendientes,
           SUM(CASE WHEN v.estado IN ('En preparación', 'En cocina', 'Cocinando') THEN 1 ELSE 0 END) AS en_cocina,
           SUM(CASE WHEN v.estado IN ('Listo', 'Completado') THEN 1 ELSE 0 END) AS completadas
         FROM ventas v
         WHERE DATE(v.fecha_hora) = DATE('now', '-4 hours') ${branchCondition}`,
        [...branchParams],
      ),
    ]);

    const curV = curVentasRows[0] || {};
    const prevV = prevVentasRows[0] || {};
    const curC = curClientesRows[0] || {};
    const prevC = prevClientesRows[0] || {};
    const st = statusRows[0] || {};

    const totalRevenue = Number(curV.total_usd || 0);
    const prevRevenue = Number(prevV.total_usd || 0);
    const totalOrders = Number(curV.total_ordenes || 0);
    const prevOrders = Number(prevV.total_ordenes || 0);
    const totalClients = Number(curC.total_clientes || 0);
    const prevClients = Number(prevC.total_clientes || 0);

    const netProfit = totalRevenue * 0.65;
    const prevNetProfit = prevRevenue * 0.65;

    const calcPct = (curr, prev) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Number((((curr - prev) / prev) * 100).toFixed(1));
    };

    const growthRevenue = calcPct(totalRevenue, prevRevenue);
    const growthOrders = calcPct(totalOrders, prevOrders);
    const growthClients = calcPct(totalClients, prevClients);
    const growthProfit = calcPct(netProfit, prevNetProfit);

    const catColors = {
      Pizza: "#EA2A33", // Rojo Pizzería institucional
      Bebida: "#3B82F6", // Azul módulo ventas
      Helado: "#F59E0B", // Ámbar módulo heladería
      Extra: "#10B981", // Verde módulo productos
      Combo: "#8B5CF6", // Púrpura módulo combos
    };

    const totalCatMonto = categoriasRows.reduce(
      (sum, c) => sum + Number(c.monto_usd),
      0,
    );
    const categoriasFormatted = categoriasRows.map((cat) => {
      const monto = Number(cat.monto_usd);
      const pct =
        totalCatMonto > 0
          ? Number(((monto / totalCatMonto) * 100).toFixed(1))
          : 0;
      return {
        nombre: cat.categoria || "Otros",
        monto_usd: monto,
        cantidad: Number(cat.cantidad),
        porcentaje: pct,
        color: catColors[cat.categoria] || "#8B5CF6",
      };
    });

    return res.json({
      success: true,
      tasa,
      periodo,
      kpis: {
        totalRevenue,
        growthRevenue,
        totalOrders,
        growthOrders,
        totalClients,
        growthClients,
        netProfit,
        growthProfit,
        ticketPromedio: Number(curV.ticket_promedio_usd || 0),
        picoMaximo: Number(curV.pico_maximo_usd || 0),
      },
      categorias: categoriasFormatted,
      tendencia: tendenciaRows.map((t) => ({
        label: t.label,
        ingresos_usd: Number(t.total_usd),
        ordenes: Number(t.ordenes),
      })),
      statusQuick: {
        pendientes: Number(st.pendientes || 0),
        en_cocina: Number(st.en_cocina || 0),
        completadas: Number(st.completadas || 0),
      },
    });
  } catch (error) {
    console.error("Error en dashboard stats:", error);
    return res.status(500).json({
      success: false,
      mensaje: "Error al obtener datos del dashboard",
    });
  }
};
