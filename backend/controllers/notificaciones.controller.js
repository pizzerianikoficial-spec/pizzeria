import db from "../config/turso.js";
import { emitPusherEvent } from "../config/pusher.js";

const consultarNotificacionesPendientesBD = async () => {
  const result = await db.execute({
    sql: `SELECT n.id_notificacion, n.id_venta, n.id_cliente,
            n.monto_restante, n.estado AS estado_notificacion, n.fecha_hora,
            c.nombre AS nombre_cliente, c.cedula AS cedula_cliente,
            c.telefono AS telefono_cliente,
            v.despacho, d.nombre AS nombre_delivery, d.digitos AS digitos_delivery,
            CASE WHEN n.estado = 'EnEspera' THEN 1 ELSE 0 END AS en_espera_horno,
            COALESCE(SUM(vd.cantidad), 0) AS cantidad_items,
            GROUP_CONCAT(
              vd.cantidad || 'x ' || COALESCE(p.nombre, b.nombre, h.nombre, vd.tipo_producto),
              ', '
            ) AS resumen_items
     FROM notificaciones n
     INNER JOIN ventas v ON v.id_venta = n.id_venta
     LEFT JOIN clientes c ON c.id_cliente = n.id_cliente
     LEFT JOIN delivery d ON d.id_delivery = v.id_delivery
     LEFT JOIN venta_detalle vd ON vd.id_venta = v.id_venta
     LEFT JOIN pizza p ON p.id_pizza = vd.id_producto_origen AND vd.tipo_producto = 'Pizza'
     LEFT JOIN bebidas b ON b.id_bebida = vd.id_producto_origen AND vd.tipo_producto = 'Bebida'
     LEFT JOIN heladeria h ON h.id_heladeria = vd.id_producto_origen AND vd.tipo_producto = 'Helado'
     WHERE (
         (v.estado = 'Pendiente' AND n.estado = 'Pendiente')
         OR (v.estado = 'Completado' AND n.estado = 'EnEspera')
       )
       AND DATE(n.fecha_hora) = DATE('now', '-4 hours')
     GROUP BY n.id_notificacion, n.id_venta, n.id_cliente,
              n.monto_restante, n.estado, n.fecha_hora, c.nombre, c.cedula,
              c.telefono, v.despacho, d.nombre, d.digitos
      ORDER BY n.fecha_hora DESC`,
  });
  return result.rows;
};

export const obtenerNotificacionesPendientes = async (_req, res) => {
  try {
    const data = await consultarNotificacionesPendientesBD();
    return res.json({ success: true, data });
  } catch (error) {
    console.error("Error obteniendo notificaciones pendientes:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---- Obtener notificación pendiente individual
export const obtenerNotificacionPendiente = async (req, res) => {
  try {
    const ventasResult = await db.execute({
      sql: `SELECT n.id_notificacion, n.id_venta, n.id_cliente, n.monto_restante,
              v.monto_total_usd, v.monto_total_bs, v.tasa_cambio, v.despacho,
              v.id_delivery, c.id_cliente AS cliente_id, c.nombre AS nombre_cliente,
              c.cedula AS cedula_cliente, c.telefono AS telefono_cliente
       FROM notificaciones n
       INNER JOIN ventas v ON v.id_venta = n.id_venta AND v.estado = 'Pendiente'
       LEFT JOIN clientes c ON c.id_cliente = n.id_cliente
       WHERE n.id_venta = ? AND n.estado = 'Pendiente'
         AND DATE(n.fecha_hora) = DATE('now', '-4 hours')`,
      args: [req.params.id_venta],
    });
    const ventas = ventasResult.rows;

    if (!ventas.length) {
      return res
        .status(404)
        .json({ success: false, message: "Notificación no encontrada." });
    }

    const detallesResult = await db.execute({
      sql: `SELECT vd.id_detalle, vd.tipo_producto, vd.id_producto_origen,
              vd.cantidad, vd.monto_total, vd.nota,
              COALESCE(p.nombre, b.nombre, h.nombre, vd.tipo_producto) AS nombre_producto,
              p.id_categoria_pizza
       FROM venta_detalle vd
       LEFT JOIN pizza p ON p.id_pizza = vd.id_producto_origen AND vd.tipo_producto = 'Pizza'
       LEFT JOIN bebidas b ON b.id_bebida = vd.id_producto_origen AND vd.tipo_producto = 'Bebida'
       LEFT JOIN heladeria h ON h.id_heladeria = vd.id_producto_origen AND vd.tipo_producto = 'Helado'
       WHERE vd.id_venta = ?`,
      args: [req.params.id_venta],
    });
    const detalles = detallesResult.rows;

    const pagosResult = await db.execute({
      sql: `SELECT metodo_pago AS metodo, monto_usd, monto_bs, referencia
       FROM ventas_pagos WHERE id_venta = ? ORDER BY id_pago`,
      args: [req.params.id_venta],
    });
    const pagos = pagosResult.rows;

    const detallesConExtras = await Promise.all(
      detalles.map(async (detalle) => {
        const extrasResult = await db.execute({
          sql: `SELECT e.id_extras AS id, e.nombre AS name, e.precio AS price
           FROM detalle_venta_extras dve
           INNER JOIN extras e ON e.id_extras = dve.id_extra
           WHERE dve.id_detalle = ?`,
          args: [detalle.id_detalle],
        });
        return { ...detalle, extras: extrasResult.rows };
      }),
    );

    return res.json({
      success: true,
      data: { venta: ventas[0], detalles: detallesConExtras, pagos },
    });
  } catch (error) {
    console.error("Error obteniendo la notificación pendiente:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---- Liberar una venta pagada en espera hacia la cola de cocina
export const mandarNotificacionAlHorno = async (req, res) => {
  const { id_venta } = req.params;
  const sucursal_id = req.user?.id_sucursal || null;

  let tx;
  try {
    tx = await db.transaction("write");

    const notificacion = await tx.execute({
      sql: `SELECT n.id_notificacion, n.estado AS estado_notificacion,
              v.estado AS estado_venta
       FROM notificaciones n
       INNER JOIN ventas v ON v.id_venta = n.id_venta
       WHERE n.id_venta = ? AND n.estado = 'EnEspera'`,
      args: [id_venta],
    });

    if (!notificacion.rows.length) {
      await tx.rollback();
      return res.status(404).json({
        success: false,
        message: "No hay ninguna venta en espera para enviar al horno.",
      });
    }

    const pendientes = await tx.execute({
      sql: `SELECT COUNT(*) AS total
       FROM venta_detalle
       WHERE id_venta = ? AND estado = 'Pendiente'`,
      args: [id_venta],
    });

    if (Number(pendientes.rows?.[0]?.total || 0) === 0) {
      await tx.rollback();
      return res.status(409).json({
        success: false,
        message: "El pedido ya no tiene productos pendientes en cocina.",
      });
    }

    // Al pasar a "Listo" se libera el bloqueo y la venta entra a la cola de cocina
    await tx.execute({
      sql: `UPDATE notificaciones SET estado = 'Listo' WHERE id_venta = ? AND estado = 'EnEspera'`,
      args: [id_venta],
    });

    await tx.commit();

    emitPusherEvent("pizzeria-orders", "pedido_creado", {
      id_venta,
      sucursal_id,
      tipo_evento: "pedido_creado",
      timestamp: Date.now(),
    });
    emitPusherEvent("pizzeria-kitchen", "pedido_estado_cambiado", {
      id_venta,
      estado: "Pendiente",
      tipo_evento: "pedido_estado_cambiado",
      timestamp: Date.now(),
    });
    emitPusherEvent(
      "pizzeria-notifications",
      "notificacion_pendiente_resuelta",
      {
        id_venta,
        sucursal_id,
        tipo_evento: "notificacion_pendiente_resuelta",
        timestamp: Date.now(),
      },
    );

    return res.json({
      success: true,
      message: "Pedido enviado al horno.",
      id_venta: Number(id_venta),
    });
  } catch (error) {
    if (tx) await tx.rollback();
    console.error("Error al enviar la venta al horno:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
