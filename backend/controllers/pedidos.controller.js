import db from "../config/turso.js";
import { emitPusherEvent } from "../config/pusher.js";

const queryRows = async (sql, args = []) => {
  const result = await db.execute({ sql, args });
  return result.rows;
};

const executeCommand = (sql, args = []) => db.execute({ sql, args });

const obtenerDetallesCocinaBatch = async (ventas, estado) => {
  const idsVentas = ventas.map((v) => v.id_venta);
  if (idsVentas.length === 0) return [];

  const marcas = idsVentas.map(() => "?").join(", ");
  return queryRows(
    `
      SELECT
        vd.id_venta,
        vd.id_detalle,
        vd.cantidad,
        vd.nota,
        vd.tipo_producto,
        vd.estado AS estado_detalle,
        p.nombre AS nombre_producto,
        cp.categoria AS categoria_pizza,
        NULL AS combo_descripcion
      FROM venta_detalle vd
      INNER JOIN pizza p ON p.id_pizza = vd.id_producto_origen
      LEFT JOIN categoria_pizza cp ON cp.id_categoria_pizza = p.id_categoria_pizza
      WHERE vd.id_venta IN (${marcas})
        AND vd.estado = ?
        AND vd.tipo_producto = 'Pizza'

      UNION ALL

      SELECT
        vd.id_venta,
        vd.id_detalle,
        vd.cantidad,
        vd.nota,
        'Combo' AS tipo_producto,
        vd.estado AS estado_detalle,
        c.nombre AS nombre_producto,
        NULL AS categoria_pizza,
        c.descripcion AS combo_descripcion
      FROM venta_detalle vd
      INNER JOIN combos c ON c.id_combo = vd.id_producto_origen
      WHERE vd.id_venta IN (${marcas})
        AND vd.estado = ?
        AND vd.tipo_producto = 'Combo'

      ORDER BY id_detalle ASC
    `,
    [...idsVentas, estado, ...idsVentas, estado],
  );
};

const consultarExtrasBatch = async (detalles) => {
  const idsDetalles = detalles.map((d) => d.id_detalle);
  if (idsDetalles.length === 0) return new Map();

  const marcas = idsDetalles.map(() => "?").join(", ");
  const filas = await queryRows(
    `SELECT dve.id_detalle, e.id_extras AS id, e.nombre AS name, e.precio AS price
     FROM detalle_venta_extras dve
     JOIN extras e ON e.id_extras = dve.id_extra
     WHERE dve.id_detalle IN (${marcas})
     ORDER BY dve.id_detalle ASC`,
    idsDetalles,
  );

  const porDetalle = new Map();
  for (const fila of filas) {
    if (!porDetalle.has(fila.id_detalle)) {
      porDetalle.set(fila.id_detalle, []);
    }
    porDetalle.get(fila.id_detalle).push({
      id: fila.id,
      name: fila.name,
      price: fila.price,
    });
  }
  return porDetalle;
};

const agruparDetallesPorVenta = (detalles) => {
  const porVenta = new Map();
  for (const detalle of detalles) {
    if (!porVenta.has(detalle.id_venta)) {
      porVenta.set(detalle.id_venta, []);
    }
    porVenta.get(detalle.id_venta).push(detalle);
  }
  return porVenta;
};

const armarPedidosConExtras = async (ventas, estado) => {
  const detalles = await obtenerDetallesCocinaBatch(ventas, estado);
  const extrasPorDetalle = await consultarExtrasBatch(detalles);
  const detallesPorVenta = agruparDetallesPorVenta(detalles);

  return ventas.map((venta) => {
    const detallesVenta = (detallesPorVenta.get(venta.id_venta) || []).map(
      (detalle) => ({
        ...detalle,
        extras: extrasPorDetalle.get(detalle.id_detalle) || [],
      }),
    );

    const telefonoLimpio =
      !venta.telefono_cliente ||
      venta.telefono_cliente === 0 ||
      venta.telefono_cliente === "0"
        ? null
        : venta.telefono_cliente;

    return {
      ...venta,
      telefono_cliente: telefonoLimpio,
      codigo_orden: `ORD-${String(venta.id_venta).padStart(3, "0")}`,
      detalles: detallesVenta,
    };
  });
};

//--------------------------Pedidos

export const obtenerPedidosCocina = async (req, res) => {
  try {
    const { id_sucursal } = req.user;
    const ventas = await queryRows(
      `SELECT DISTINCT
        v.id_venta,
        v.cantidad_caja,
        v.fecha_hora,
        v.despacho,
        c.nombre AS nombre_cliente,
        c.telefono AS telefono_cliente,
        d.digitos AS digitos_delivery
      FROM ventas v
      LEFT JOIN clientes c ON c.id_cliente = v.id_cliente
      LEFT JOIN delivery d ON d.id_delivery = v.id_delivery
      WHERE DATE(v.fecha_hora) = DATE('now', '-4 hours')
        AND (v.id_sucursal = ? OR v.id_sucursal IS NULL)
        AND NOT EXISTS (
          SELECT 1 FROM notificaciones n
          WHERE n.id_venta = v.id_venta
            AND n.estado = 'EnEspera'
        )
        AND EXISTS (
          SELECT 1 FROM venta_detalle vd
          WHERE vd.id_venta = v.id_venta
            AND vd.estado = 'Pendiente'
            AND vd.tipo_producto IN ('Pizza', 'Combo')
        )
      ORDER BY v.fecha_hora ASC`,
      [id_sucursal],
    );

    const pedidosCocina = await armarPedidosConExtras(ventas, "Pendiente");

    res.json({ success: true, data: pedidosCocina });
  } catch (error) {
    console.error("Error al obtener pedidos de cocina:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const obtenerPedidosHorno = async (req, res) => {
  try {
    const { id_sucursal } = req.user;
    const ventas = await queryRows(
      `SELECT DISTINCT
        v.id_venta,
        v.cantidad_caja,
        v.fecha_hora,
        v.despacho,
        c.nombre AS nombre_cliente,
        c.telefono AS telefono_cliente,
        d.digitos AS digitos_delivery
      FROM ventas v
      LEFT JOIN clientes c ON c.id_cliente = v.id_cliente
      LEFT JOIN delivery d ON d.id_delivery = v.id_delivery
      WHERE DATE(v.fecha_hora) = DATE('now', '-4 hours')
        AND (v.id_sucursal = ? OR v.id_sucursal IS NULL)
        AND EXISTS (
          SELECT 1 FROM venta_detalle vd
          WHERE vd.id_venta = v.id_venta
            AND vd.estado = 'Horno'
            AND vd.tipo_producto IN ('Pizza', 'Combo')
        )
      ORDER BY v.fecha_hora ASC`,
      [id_sucursal],
    );

    const pedidosHorno = await armarPedidosConExtras(ventas, "Horno");

    res.json({ success: true, data: pedidosHorno });
  } catch (error) {
    console.error("Error al obtener pedidos de horno:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const obtenerPedidosDespacho = async (req, res) => {
  try {
    const { id_sucursal } = req.user;
    const ventas = await queryRows(
      `SELECT DISTINCT
        v.id_venta,
        v.cantidad_caja,
        v.fecha_hora,
        v.despacho,
        c.nombre AS nombre_cliente,
        c.telefono AS telefono_cliente,
        d.digitos AS digitos_delivery
      FROM ventas v
      LEFT JOIN clientes c ON c.id_cliente = v.id_cliente
      LEFT JOIN delivery d ON d.id_delivery = v.id_delivery
      WHERE DATE(v.fecha_hora) = DATE('now', '-4 hours')
        AND (v.id_sucursal = ? OR v.id_sucursal IS NULL)
        AND EXISTS (
          SELECT 1 FROM venta_detalle vd
          WHERE vd.id_venta = v.id_venta
            AND vd.estado = 'Despacho'
            AND vd.tipo_producto IN ('Pizza', 'Combo')
        )
      ORDER BY v.fecha_hora ASC`,
      [id_sucursal],
    );

    const pedidosCompletado = await armarPedidosConExtras(ventas, "Despacho");

    res.json({ success: true, data: pedidosCompletado });
  } catch (error) {
    console.error("Error al obtener pedidos de horno:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const obtenerPedidosMesero = async (req, res) => {
  try {
    const { id_sucursal } = req.user;
    const ventas = await queryRows(
      `SELECT DISTINCT
        v.id_venta,
        v.cantidad_caja,
        v.fecha_hora,
        v.despacho,
        c.nombre AS nombre_cliente,
        c.telefono AS telefono_cliente
      FROM ventas v
      LEFT JOIN clientes c ON c.id_cliente = v.id_cliente
      WHERE DATE(v.fecha_hora) = DATE('now', '-4 hours')
        AND (v.id_sucursal = ? OR v.id_sucursal IS NULL)
        AND EXISTS (
          SELECT 1 FROM venta_detalle vd
          WHERE vd.id_venta = v.id_venta
            AND vd.estado = 'Despacho'
            AND vd.tipo_producto IN ('Pizza', 'Combo')
        )
      ORDER BY v.fecha_hora ASC`,
      [id_sucursal],
    );

    const pedidosMesero = await armarPedidosConExtras(ventas, "Despacho");

    res.json({ success: true, data: pedidosMesero });
  } catch (error) {
    console.error("Error al obtener pedidos del mesero:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const obtenerPedidosPendiente = async (req, res) => {
  try {
    const { id_sucursal } = req.user;
    const ventas = await queryRows(
      `SELECT DISTINCT
        v.id_venta,
        v.cantidad_caja,
        v.fecha_hora,
        v.despacho,
        c.nombre AS nombre_cliente,
        c.telefono AS telefono_cliente,
        d.digitos AS digitos_delivery
      FROM ventas v
      LEFT JOIN clientes c ON c.id_cliente = v.id_cliente
      LEFT JOIN delivery d ON d.id_delivery = v.id_delivery
      WHERE DATE(v.fecha_hora) = DATE('now', '-4 hours')
        AND (v.id_sucursal = ? OR v.id_sucursal IS NULL)
        AND EXISTS (
          SELECT 1 FROM venta_detalle vd
          WHERE vd.id_venta = v.id_venta
            AND vd.estado = 'pDespacho'
            AND vd.tipo_producto IN ('Pizza', 'Combo')
        )
      ORDER BY v.fecha_hora ASC`,
      [id_sucursal],
    );

    const pedidosPendiente = await armarPedidosConExtras(ventas, "pDespacho");

    res.json({ success: true, data: pedidosPendiente });
  } catch (error) {
    console.error("Error al obtener pedidos de horno:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const obtenerContadorCajero = async (req, res) => {
  const { id_sucursal } = req.user;
  try {
    let query = `SELECT COUNT(vd.id_detalle) AS total
       FROM venta_detalle vd
       JOIN ventas v ON vd.id_venta = v.id_venta
       WHERE vd.estado NOT IN ('Completado', 'Cerrado', 'Cancelado', 'Despacho', 'Mesero') AND v.estado != 'Reembolsado'
         AND DATE(v.fecha_hora) = DATE('now', '-4 hours')
         AND v.id_sucursal = ?`;
    let paparemericano = [id_sucursal];
    const result = await queryRows(query, paparemericano);

    res.json({
      success: true,
      total: result[0].total,
    });
  } catch (error) {
    console.error("Error al obtener pedidos del cajero:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const actualizarEstadoPedido = async (req, res) => {
  const { id_venta } = req.params;
  const { id_sucursal } = req.user;
  const { status } = req.body;

  let nuevoEstado = "";
  let estadoAnterior = "";

  if (status === "preparing") {
    nuevoEstado = "Horno";
    estadoAnterior = "Pendiente";
  } else if (status === "ready") {
    nuevoEstado = "pDespacho";
    estadoAnterior = "Horno";
  } else if (status === "delivered") {
    nuevoEstado = "Despacho";
    estadoAnterior = "Horno";
  } else if (status === "waiter_pending") {
    nuevoEstado = "Mesero";
    estadoAnterior = "Despacho";
  } else if (status === "completed") {
    nuevoEstado = "Completado";
    estadoAnterior = "Despacho";
  } else if (status === "pending") {
    nuevoEstado = "Pendiente";
    estadoAnterior = "Horno";
  } else {
    return res.status(400).json({
      success: false,
      message: "Estado de pedido no válido.",
    });
  }

  try {
    const esEstadoFinal =
      nuevoEstado === "Completado" || nuevoEstado === "Cerrado";

    const result = await executeCommand(
      `UPDATE venta_detalle
       SET estado = ?
       WHERE id_venta = ?
         ${esEstadoFinal ? "" : "AND tipo_producto IN ('Pizza', 'Combo')"}
         AND EXISTS (
           SELECT 1 FROM ventas v
           WHERE v.id_venta = venta_detalle.id_venta
             AND v.id_sucursal = ?
         )`,
      [nuevoEstado, id_venta, id_sucursal],
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({
        success: false,
        message: "No se encontraron detalles para este pedido.",
      });
    }

    emitPusherEvent("pizzeria-kitchen", "pedido_estado_cambiado", {
      id_venta,
      estado: nuevoEstado,
      tipo_evento: "pedido_estado_cambiado",
      timestamp: Date.now(),
    });

    emitPusherEvent("pizzeria-orders", "pedido_actualizado", {
      id_venta,
      estado: nuevoEstado,
      tipo_evento: "pedido_actualizado",
      timestamp: Date.now(),
    });

    res.json({
      success: true,
      message: `Pedido actualizado a '${nuevoEstado}' exitosamente.`,
    });
  } catch (error) {
    console.error("Error al actualizar el pedido:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

//-----------------------------Entregas

export const obtenerEntregas = async (req, res) => {
  const id_sucursal = req.user?.id_sucursal || 1;
  try {
    let query = `SELECT DISTINCT
        v.id_venta,
        v.cantidad_caja,
        v.fecha_hora,
        v.despacho,
        v.monto_total_usd,
        v.estado,
        c.nombre AS nombre_cliente,
        c.telefono AS telefono_cliente,
        c.descripcion AS direccion_cliente
      FROM ventas v
      LEFT JOIN clientes c ON c.id_cliente = v.id_cliente
      WHERE v.despacho IN ('Delivery', 'Pick Up', 'Local', 'Llevar')
        AND DATE(v.fecha_hora) = DATE('now', '-4 hours')
        AND v.estado != 'Reembolsado'
        AND (v.id_sucursal = ? OR v.id_sucursal IS NULL)
      ORDER BY v.fecha_hora ASC`;

    let paparamericano = [id_sucursal];
    const ventas = await queryRows(query, paparamericano);

    const idsVentas = ventas.map((v) => v.id_venta);
    const detallesBatch =
      idsVentas.length === 0
        ? []
        : await queryRows(
            `SELECT
              vd.id_venta,
              vd.id_detalle,
              vd.cantidad,
              vd.tipo_producto,
              vd.estado AS estado_detalle,
              CASE 
                WHEN vd.tipo_producto = 'Pizza' THEN p.nombre
                WHEN vd.tipo_producto = 'Bebida' THEN b.nombre
                WHEN vd.tipo_producto = 'Helado' THEN h.nombre
              END AS nombre_producto
            FROM venta_detalle vd
            LEFT JOIN pizza p ON vd.tipo_producto = 'Pizza' AND p.id_pizza = vd.id_producto_origen
            LEFT JOIN bebidas b ON vd.tipo_producto = 'Bebida' AND b.id_bebida = vd.id_producto_origen
            LEFT JOIN heladeria h ON vd.tipo_producto = 'Helado' AND h.id_heladeria = vd.id_producto_origen
            WHERE vd.id_venta IN (${idsVentas.map(() => "?").join(", ")})`,
            idsVentas,
          );
    const detallesPorVenta = agruparDetallesPorVenta(detallesBatch);

    const ordenes = ventas.map((venta) => {
      const detalles = detallesPorVenta.get(venta.id_venta) || [];

      const items = detalles.map((det) => ({
        name: det.nombre_producto || det.tipo_producto,
        quantity: det.cantidad,
        type: det.tipo_producto,
        status: det.estado_detalle,
      }));

      const estaCerrada =
        detalles.length > 0 &&
        detalles.every((det) => det.estado_detalle === "Cerrado");

      if (estaCerrada) return null;

      // La orden solo está lista para entregar cuando TODOS los ítems están en estado "Despacho"
      const todosEnDespacho =
        detalles.length > 0 &&
        detalles.every((det) => det.estado_detalle === "Despacho");

      const estaEntregada =
        detalles.length > 0 &&
        detalles.every(
          (det) =>
            det.estado_detalle === "Completado" ||
            det.estado_detalle === "Cerrado",
        );

      return {
        id: venta.id_venta,
        boxes: Number(venta.cantidad_caja) || 0,
        type:
          venta.despacho === "Delivery"
            ? "delivery"
            : venta.despacho === "Pick Up"
              ? "pickup"
              : venta.despacho === "Local"
                ? "local"
                : "llevar",
        customerName: venta.nombre_cliente || "Desconocido",
        address: venta.direccion_cliente || "",
        phone: venta.telefono_cliente || "",
        items: items,
        total: venta.monto_total_usd,
        orderedAt: venta.fecha_hora,
        status: estaEntregada
          ? "delivered"
          : todosEnDespacho
            ? "ready"
            : "preparing",
      };
    });

    const ordenesFiltradas = ordenes.filter((o) => o !== null);

    res.json(ordenesFiltradas);
  } catch (error) {
    console.error("Error fetching entregas:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const actualizarEntrega = async (req, res) => {
  const { id_venta } = req.params;
  const { id_sucursal } = req.user;

  try {
    const result = await executeCommand(
      `UPDATE venta_detalle
       SET estado = 'Completado' 
       WHERE id_venta = ?
         AND EXISTS (
           SELECT 1 FROM ventas v
           WHERE v.id_venta = venta_detalle.id_venta
             AND v.id_sucursal = ?
         )`,
      [id_venta, id_sucursal],
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({
        success: false,
        message: "No se encontraron detalles para este pedido.",
      });
    }

    emitPusherEvent("pizzeria-orders", "pedido_actualizado", {
      id_venta,
      estado: "Completado",
      tipo_evento: "pedido_actualizado",
      timestamp: Date.now(),
    });

    emitPusherEvent("pizzeria-kitchen", "pedido_estado_cambiado", {
      id_venta,
      estado: "Completado",
      tipo_evento: "pedido_estado_cambiado",
      timestamp: Date.now(),
    });

    res.json({
      success: true,
      message: "Pedido entregado exitosamente.",
    });
  } catch (error) {
    console.error("Error al completar el pedido:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
