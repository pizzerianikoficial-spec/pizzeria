import db from "../config/turso.js";

const consultarNotificacionesPendientesBD = async () => {
  const result = await db.execute({
    sql: `SELECT n.id_notificacion, n.id_venta, n.id_cliente,
            n.monto_restante, n.fecha_hora,
            c.nombre AS nombre_cliente, c.cedula AS cedula_cliente,
            c.telefono AS telefono_cliente,
            v.despacho, d.nombre AS nombre_delivery, d.digitos AS digitos_delivery,
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
     WHERE v.estado = 'Pendiente' AND n.estado = 'Pendiente'
      AND DATE(n.fecha_hora) = DATE('now', '-4 hours')
     GROUP BY n.id_notificacion, n.id_venta, n.id_cliente,
              n.monto_restante, n.fecha_hora, c.nombre, c.cedula,
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
