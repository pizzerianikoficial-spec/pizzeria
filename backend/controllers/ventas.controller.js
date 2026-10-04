import db from "../config/turso.js";
import axios from "axios";
import { emitPusherEvent } from "../config/pusher.js";

const TASA_API_URL = "https://ve.dolarapi.com/v1/dolares/oficial";

const tieneIdProductoValido = (detalle) => {
  const id = Number(detalle?.id_producto_origen);
  return Number.isInteger(id) && id > 0;
};

const validarDetallesNuevos = (detalles) =>
  detalles.every(
    (detalle) => detalle?.id_detalle || tieneIdProductoValido(detalle),
  );

// ---- Procesar venta
export const procesarVenta = async (req, res) => {
  const {
    id_cliente,
    id_usuario,
    id_delivery,
    despacho,
    tasa_cambio,
    monto_total_usd,
    monto_total_bs,
    cantidad_cajas = 0,
    costo_delivery = 0,
    pagos,
    detalles,
  } = req.body;
  const { id_sucursal } = req.user;
  const finalUserId = id_usuario || req.user?.id || 1;

  const deliveryId =
    typeof id_delivery === "object" && id_delivery !== null
      ? Number(id_delivery.id ?? id_delivery.id_delivery) || null
      : Number(id_delivery) || null;

  const clienteId =
    typeof id_cliente === "object" && id_cliente !== null
      ? Number(id_cliente.id ?? id_cliente.id_cliente) || 1
      : Number(id_cliente) || 1;

  if (!Array.isArray(detalles) || !validarDetallesNuevos(detalles)) {
    return res.status(400).json({
      success: false,
      message: "Cada producto debe tener un id_producto_origen válido.",
    });
  }

  let tx;

  try {
    tx = await db.transaction("write");

    const resultVenta = await tx.execute({
      sql: `INSERT INTO ventas 
      (id_cliente, id_usuario, id_delivery, despacho, estado, fecha_hora, tasa_cambio, monto_total_usd, monto_total_bs, cantidad_caja, id_sucursal, costo_delivery) 
      VALUES (?, ?, ?, ?, 'Completado', datetime('now', '-4 hours'), ?, ?, ?, ?, ?, ?)`,
      args: [
        clienteId,
        finalUserId,
        deliveryId,
        despacho,
        tasa_cambio,
        monto_total_usd,
        monto_total_bs,
        Number(cantidad_cajas) || 0,
        id_sucursal,
        Number(costo_delivery) || 0,
      ],
    });

    const id_venta = Number(resultVenta.lastInsertRowid);

    for (const pago of pagos || []) {
      await tx.execute({
        sql: `INSERT INTO ventas_pagos 
        (id_venta, metodo_pago, monto_usd, monto_bs, referencia) 
        VALUES (?, ?, ?, ?, ?)`,
        args: [
          id_venta,
          pago.metodo,
          pago.monto_usd,
          pago.monto_bs,
          pago.referencia || null,
        ],
      });
    }

    for (const item of detalles) {
      let estadoInicial = "Pendiente";

      if (item.tipo_producto === "Bebida" || item.tipo_producto === "Helado") {
        estadoInicial = "Completado";
      }

      const resultDetalle = await tx.execute({
        sql: `INSERT INTO venta_detalle 
        (id_venta, tipo_producto, id_producto_origen, cantidad, monto_total, nota, estado) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id_venta,
          item.tipo_producto,
          item.id_producto_origen,
          item.cantidad,
          item.monto_total,
          item.nota,
          estadoInicial,
        ],
      });

      const id_detalle = Number(resultDetalle.lastInsertRowid);

      if (item.extras && item.extras.length > 0) {
        for (const id_extra of item.extras) {
          await tx.execute({
            sql: `INSERT INTO detalle_venta_extras (id_detalle, id_extra) VALUES (?, ?)`,
            args: [id_detalle, id_extra],
          });
        }
      }
    }

    await tx.commit();

    emitPusherEvent("pizzeria-orders", "pedido_creado", {
      id_venta,
      sucursal_id: id_sucursal,
      tipo_evento: "pedido_creado",
      timestamp: Date.now(),
    });
    emitPusherEvent("pizzeria-sales", "venta_completada", {
      id_venta,
      sucursal_id: id_sucursal,
      tipo_evento: "venta_completada",
      timestamp: Date.now(),
    });

    res.status(201).json({
      success: true,
      message: "Venta procesada exitosamente",
      id_venta: id_venta,
    });
  } catch (error) {
    if (tx) await tx.rollback();
    console.error("Error al procesar la venta:", error);
    res.status(500).json({
      success: false,
      message: "Error procesando la venta",
      error: error.message,
    });
  }
};

// ---- Registra venta pagada que NO entra a cocina hasta pulsar "Mandar al horno"
export const registrarVentaPagadaEnEspera = async (req, res) => {
  const {
    id_cliente,
    id_usuario,
    id_delivery,
    despacho,
    tasa_cambio,
    monto_total_usd,
    monto_total_bs,
    cantidad_cajas = 0,
    costo_delivery = 0,
    pagos = [],
    detalles = [],
  } = req.body;
  const { id_sucursal } = req.user;
  const finalUserId = id_usuario || req.user?.id || 1;

  if (!Array.isArray(detalles) || detalles.length === 0) {
    return res.status(400).json({
      success: false,
      message: "El pedido debe contener al menos un detalle.",
    });
  }

  if (!validarDetallesNuevos(detalles)) {
    return res.status(400).json({
      success: false,
      message: "Cada producto debe tener un id_producto_origen válido.",
    });
  }

  const deliveryId =
    typeof id_delivery === "object" && id_delivery !== null
      ? Number(id_delivery.id ?? id_delivery.id_delivery) || null
      : Number(id_delivery) || null;

  const clienteId =
    typeof id_cliente === "object" && id_cliente !== null
      ? Number(id_cliente.id ?? id_cliente.id_cliente) || 1
      : Number(id_cliente) || 1;

  let tx;

  try {
    tx = await db.transaction("write");

    const resultVenta = await tx.execute({
      sql: `INSERT INTO ventas
       (id_cliente, id_usuario, id_delivery, despacho, estado, fecha_hora, tasa_cambio, monto_total_usd, monto_total_bs, cantidad_caja, id_sucursal, costo_delivery)
      VALUES (?, ?, ?, ?, 'Completado', datetime('now', '-4 hours'), ?, ?, ?, ?, ?, ?)`,
      args: [
        clienteId,
        finalUserId,
        deliveryId,
        despacho,
        tasa_cambio || 0,
        monto_total_usd || 0,
        monto_total_bs || 0,
        Number(cantidad_cajas) || 0,
        id_sucursal,
        Number(costo_delivery) || 0,
      ],
    });

    const id_venta = Number(resultVenta.lastInsertRowid);

    for (const pago of pagos) {
      await tx.execute({
        sql: `INSERT INTO ventas_pagos
         (id_venta, metodo_pago, monto_usd, monto_bs, referencia)
       VALUES (?, ?, ?, ?, ?)`,
        args: [
          id_venta,
          pago.metodo,
          pago.monto_usd || 0,
          pago.monto_bs || 0,
          pago.referencia || null,
        ],
      });
    }

    for (const item of detalles) {
      const estadoInicial =
        item.tipo_producto === "Bebida" || item.tipo_producto === "Helado"
          ? "Completado"
          : "Pendiente";

      const resultDetalle = await tx.execute({
        sql: `INSERT INTO venta_detalle
         (id_venta, tipo_producto, id_producto_origen, cantidad, monto_total, nota, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id_venta,
          item.tipo_producto,
          item.id_producto_origen,
          item.cantidad,
          item.monto_total,
          item.nota || "",
          estadoInicial,
        ],
      });

      if (Array.isArray(item.extras)) {
        for (const id_extra of item.extras) {
          await tx.execute({
            sql: `INSERT INTO detalle_venta_extras (id_detalle, id_extra) VALUES (?, ?)`,
            args: [Number(resultDetalle.lastInsertRowid), id_extra],
          });
        }
      }
    }

    // Marca de espera: el enum de notificaciones.estado solo admite 'Pendiente'
    // y 'Listo', así que la espera al horno no se guarda como estado propio.
    // Lo que la distingue es que la venta ya está 'Completado': mientras su
    // notificación siga en 'Pendiente' la venta no aparece en cocina. Al
    // mandarla al horno la notificación pasa a 'Listo' y se libera.
    await tx.execute({
      sql: `INSERT INTO notificaciones
       (id_venta, id_cliente, id_usuario, monto_restante, fecha_hora, estado)
      VALUES (?, ?, ?, 0, datetime('now', '-4 hours'), 'Pendiente')`,
      args: [id_venta, clienteId, finalUserId],
    });

    await tx.commit();

    // No se emite "pedido_creado": la cocina todavía no debe ver este pedido.
    emitPusherEvent("pizzeria-sales", "venta_completada", {
      id_venta,
      sucursal_id: id_sucursal,
      tipo_evento: "venta_completada",
      en_espera_horno: true,
      timestamp: Date.now(),
    });
    emitPusherEvent("pizzeria-notifications", "notificacion_pendiente_creada", {
      id_venta,
      id_cliente: clienteId,
      id_usuario: finalUserId,
      sucursal_id: id_sucursal,
      tipo_evento: "notificacion_pendiente_creada",
      en_espera_horno: true,
      timestamp: Date.now(),
    });

    return res.status(201).json({
      success: true,
      message: "Venta pagada registrada en espera",
      id_venta,
      en_espera_horno: true,
    });
  } catch (error) {
    if (tx) await tx.rollback();
    console.error("Error al registrar la venta pagada en espera:", error);
    return res.status(500).json({
      success: false,
      message: "Error registrando la venta pagada en espera",
      error: error.message,
    });
  }
};

// ---- Registra Delivery/Pick Up pendiente de cobro
export const registrarPedidoPendiente = async (req, res) => {
  const {
    id_cliente,
    id_usuario,
    id_delivery,
    despacho,
    tasa_cambio,
    monto_total_usd,
    monto_total_bs,
    monto_pendiente,
    cantidad_cajas = 0,
    costo_delivery = 0,
    pagos = [],
    detalles = [],
  } = req.body;
  const { id_sucursal } = req.user;
  if (
    !id_cliente ||
    !id_usuario ||
    !["Delivery", "Pick Up"].includes(despacho)
  ) {
    return res.status(400).json({
      success: false,
      message: "Cliente, usuario y despacho Delivery/Pick Up son obligatorios.",
    });
  }

  if (!Array.isArray(detalles) || detalles.length === 0) {
    return res.status(400).json({
      success: false,
      message: "El pedido debe contener al menos un detalle.",
    });
  }

  if (!validarDetallesNuevos(detalles)) {
    return res.status(400).json({
      success: false,
      message: "Cada producto debe tener un id_producto_origen válido.",
    });
  }

  let tx;

  const deliveryId =
    typeof id_delivery === "object" && id_delivery !== null
      ? Number(id_delivery.id ?? id_delivery.id_delivery) || null
      : Number(id_delivery) || null;

  const clienteId =
    typeof id_cliente === "object" && id_cliente !== null
      ? Number(id_cliente.id ?? id_cliente.id_cliente) || 1
      : Number(id_cliente) || 1;

  try {
    tx = await db.transaction("write");

    const resultVenta = await tx.execute({
      sql: `INSERT INTO ventas
       (id_cliente, id_usuario, id_delivery, despacho, estado, fecha_hora, tasa_cambio, monto_total_usd, monto_total_bs, cantidad_caja, id_sucursal, costo_delivery)
      VALUES (?, ?, ?, ?, 'Pendiente', datetime('now', '-4 hours'), ?, ?, ?, ?, ?, ?)`,
      args: [
        clienteId,
        id_usuario,
        deliveryId,
        despacho,
        tasa_cambio || 0,
        monto_total_usd || 0,
        monto_total_bs || 0,
        Number(cantidad_cajas) || 0,
        id_sucursal,
        Number(costo_delivery) || 0,
      ],
    });

    const id_venta = Number(resultVenta.lastInsertRowid);

    for (const pago of pagos) {
      await tx.execute({
        sql: `INSERT INTO ventas_pagos
         (id_venta, metodo_pago, monto_usd, monto_bs, referencia)
         VALUES (?, ?, ?, ?, ?)`,
        args: [
          id_venta,
          pago.metodo,
          pago.monto_usd || 0,
          pago.monto_bs || 0,
          pago.referencia || null,
        ],
      });
    }

    for (const item of detalles) {
      const estadoInicial =
        item.tipo_producto === "Bebida" || item.tipo_producto === "Helado"
          ? "Completado"
          : "Pendiente";

      const resultDetalle = await tx.execute({
        sql: `INSERT INTO venta_detalle
         (id_venta, tipo_producto, id_producto_origen, cantidad, monto_total, nota, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id_venta,
          item.tipo_producto,
          item.id_producto_origen,
          item.cantidad,
          item.monto_total,
          item.nota || "",
          estadoInicial,
        ],
      });

      if (Array.isArray(item.extras)) {
        for (const id_extra of item.extras) {
          await tx.execute({
            sql: `INSERT INTO detalle_venta_extras (id_detalle, id_extra) VALUES (?, ?)`,
            args: [Number(resultDetalle.lastInsertRowid), id_extra],
          });
        }
      }
    }

    const estadoNotificaciones = "Pendiente";
    await tx.execute({
      sql: `INSERT INTO notificaciones
       (id_venta, id_cliente, id_usuario, monto_restante, fecha_hora, estado)
      VALUES (?, ?, ?, ?, datetime('now', '-4 hours'), ?)`,
      args: [
        id_venta,
        id_cliente,
        id_usuario,
        monto_pendiente || 0,
        estadoNotificaciones,
      ],
    });

    await tx.commit();

    emitPusherEvent("pizzeria-orders", "pedido_creado", {
      id_venta,
      sucursal_id: id_sucursal,
      tipo_evento: "pedido_creado",
      timestamp: Date.now(),
    });
    emitPusherEvent("pizzeria-notifications", "notificacion_pendiente_creada", {
      id_venta,
      id_cliente,
      id_usuario,
      sucursal_id: id_sucursal,
      tipo_evento: "notificacion_pendiente_creada",
      timestamp: Date.now(),
    });

    return res.status(201).json({
      success: true,
      message: "Pedido pendiente registrado exitosamente",
      id_venta,
    });
  } catch (error) {
    if (tx) await tx.rollback();
    console.error("Error al registrar el pedido pendiente:", error);
    return res.status(500).json({
      success: false,
      message: "Error registrando el pedido pendiente",
      error: error.message,
    });
  }
};

// ---- Completar venta pendiente
export const completarVentaPendiente = async (req, res) => {
  const { id_venta } = req.params;
  const {
    id_usuario,
    pagos = [],
    detalles = [],
    monto_total_usd,
    monto_total_bs,
    cantidad_cajas = 0,
    costo_delivery,
  } = req.body;
  if (!Array.isArray(detalles) || !validarDetallesNuevos(detalles)) {
    return res.status(400).json({
      success: false,
      message: "Cada producto nuevo debe tener un id_producto_origen válido.",
    });
  }

  let tx;
  try {
    tx = await db.transaction("write");

    const ventas = await tx.execute({
      sql: "SELECT id_venta FROM ventas WHERE id_venta = ? AND estado = 'Pendiente'",
      args: [id_venta],
    });

    if (!ventas.rows.length) {
      await tx.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Venta pendiente no encontrada." });
    }

    for (const pago of pagos) {
      await tx.execute({
        sql: `INSERT INTO ventas_pagos (id_venta, metodo_pago, monto_usd, monto_bs, referencia)
         VALUES (?, ?, ?, ?, ?)`,
        args: [
          id_venta,
          pago.metodo,
          pago.monto_usd || 0,
          pago.monto_bs || 0,
          pago.referencia || null,
        ],
      });
    }

    for (const detalle of detalles) {
      if (detalle.id_detalle) {
        await tx.execute({
          sql: `UPDATE venta_detalle
           SET cantidad = ?, monto_total = ?, nota = ?
           WHERE id_detalle = ? AND id_venta = ?`,
          args: [
            detalle.cantidad,
            detalle.monto_total,
            detalle.nota || "",
            detalle.id_detalle,
            id_venta,
          ],
        });
        continue;
      }

      const estadoDetalle =
        detalle.tipo_producto === "Bebida" || detalle.tipo_producto === "Helado"
          ? "Completado"
          : "Pendiente";

      const resultDetalle = await tx.execute({
        sql: `INSERT INTO venta_detalle
         (id_venta, tipo_producto, id_producto_origen, cantidad, monto_total, nota, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id_venta,
          detalle.tipo_producto,
          detalle.id_producto_origen,
          detalle.cantidad,
          detalle.monto_total,
          detalle.nota || "",
          estadoDetalle,
        ],
      });

      for (const idExtra of detalle.extras || []) {
        await tx.execute({
          sql: `INSERT INTO detalle_venta_extras (id_detalle, id_extra) VALUES (?, ?)`,
          args: [Number(resultDetalle.lastInsertRowid), idExtra],
        });
      }
    }

    const estadoNotificacionesListo = "Listo";
    await tx.execute({
      sql: `UPDATE ventas
       SET id_usuario = ?, estado = 'Completado', monto_total_usd = ?, monto_total_bs = ?, cantidad_caja = ?, costo_delivery = COALESCE(?, costo_delivery)
       WHERE id_venta = ?`,
      args: [
        id_usuario || 1,
        monto_total_usd || 0,
        monto_total_bs || 0,
        Number(cantidad_cajas) || 0,
        costo_delivery !== undefined ? Number(costo_delivery) : null,
        id_venta,
      ],
    });

    await tx.execute({
      sql: "UPDATE notificaciones SET estado = ? WHERE id_venta = ?",
      args: [estadoNotificacionesListo, id_venta],
    });

    await tx.commit();

    emitPusherEvent("pizzeria-orders", "pedido_actualizado", {
      id_venta,
      sucursal_id: req.user?.id_sucursal || null,
      tipo_evento: "pedido_actualizado",
      timestamp: Date.now(),
    });
    emitPusherEvent(
      "pizzeria-notifications",
      "notificacion_pendiente_resuelta",
      {
        id_venta,
        sucursal_id: req.user?.id_sucursal || null,
        tipo_evento: "notificacion_pendiente_resuelta",
        timestamp: Date.now(),
      },
    );

    return res.json({ success: true, message: "Venta pendiente completada." });
  } catch (error) {
    if (tx) await tx.rollback();
    console.error("Error completando venta pendiente:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---- Editar venta
export const editarVenta = async (req, res) => {
  const {
    id_venta,
    nuevo_despacho,
    tasa_cambio,
    monto_total_usd,
    monto_total_bs,
    cantidad_cajas,
    costo_delivery,
    detalles_actualizados,
    info_pago,
  } = req.body;

  if (!id_venta) {
    return res.status(400).json({
      success: false,
      message: "El id_venta es obligatorio para actualizar el pedido.",
    });
  }

  if (
    Array.isArray(detalles_actualizados) &&
    !validarDetallesNuevos(detalles_actualizados)
  ) {
    return res.status(400).json({
      success: false,
      message: "Cada producto nuevo debe tener un id_producto_origen válido.",
    });
  }

  let tx;
  try {
    tx = await db.transaction("write");

    const updates = [];
    const params = [];

    if (nuevo_despacho) {
      updates.push("despacho = ?");
      params.push(nuevo_despacho);
    }

    if (tasa_cambio != null) {
      updates.push("tasa_cambio = ?");
      params.push(tasa_cambio);
    }

    if (monto_total_usd != null) {
      updates.push("monto_total_usd = ?");
      params.push(monto_total_usd);
    }

    if (monto_total_bs != null) {
      updates.push("monto_total_bs = ?");
      params.push(monto_total_bs);
    }

    if (cantidad_cajas != null) {
      updates.push("cantidad_caja = ?");
      params.push(Number(cantidad_cajas) || 0);
    }

    if (costo_delivery != null) {
      updates.push("costo_delivery = ?");
      params.push(Number(costo_delivery) || 0);
    }

    if (updates.length > 0) {
      params.push(id_venta);
      await tx.execute({
        sql: `UPDATE ventas SET ${updates.join(", ")} WHERE id_venta = ?`,
        args: params,
      });
    }

    if (Array.isArray(detalles_actualizados)) {
      for (const item of detalles_actualizados) {
        if (item.id_detalle) {
          await tx.execute({
            sql: `UPDATE venta_detalle
             SET tipo_producto = ?, id_producto_origen = ?, cantidad = ?, monto_total = ?, nota = ?
             WHERE id_detalle = ?`,
            args: [
              item.tipo_producto,
              item.id_producto_origen,
              item.cantidad,
              item.monto_total,
              item.nota || "",
              item.id_detalle,
            ],
          });

          await tx.execute({
            sql: `DELETE FROM detalle_venta_extras WHERE id_detalle = ?`,
            args: [item.id_detalle],
          });

          if (Array.isArray(item.extras) && item.extras.length > 0) {
            for (const id_extra of item.extras) {
              await tx.execute({
                sql: `INSERT INTO detalle_venta_extras (id_detalle, id_extra) VALUES (?, ?)`,
                args: [item.id_detalle, id_extra],
              });
            }
          }
        } else {
          const resultDetalle = await tx.execute({
            sql: `INSERT INTO venta_detalle
             (id_venta, tipo_producto, id_producto_origen, cantidad, monto_total, nota, estado)
             VALUES (?, ?, ?, ?, ?, ?, 'Pendiente')`,
            args: [
              id_venta,
              item.tipo_producto,
              item.id_producto_origen,
              item.cantidad,
              item.monto_total,
              item.nota || "",
            ],
          });

          const id_detalle = Number(resultDetalle.lastInsertRowid);
          if (Array.isArray(item.extras) && item.extras.length > 0) {
            for (const id_extra of item.extras) {
              await tx.execute({
                sql: `INSERT INTO detalle_venta_extras (id_detalle, id_extra) VALUES (?, ?)`,
                args: [id_detalle, id_extra],
              });
            }
          }
        }
      }
    }

    if (info_pago) {
      await tx.execute({
        sql: `INSERT INTO ventas_pagos
         (id_venta, metodo_pago, monto_usd, monto_bs, referencia)
         VALUES (?, ?, ?, ?, ?)`,
        args: [
          id_venta,
          info_pago.metodo,
          info_pago.monto_usd,
          info_pago.monto_bs || 0,
          info_pago.referencia || null,
        ],
      });
    }

    await tx.commit();

    emitPusherEvent("pizzeria-orders", "pedido_actualizado", {
      id_venta,
      sucursal_id: null,
      tipo_evento: "pedido_actualizado",
      timestamp: Date.now(),
    });

    // Emitir notificación actualizada si existe una notificación asociada a la venta
    (async () => {
      try {
        const notifRows = await db.execute({
          sql: `SELECT id_notificacion, estado, monto_restante, id_sucursal FROM notificaciones WHERE id_venta = ?`,
          args: [id_venta],
        });

        if (notifRows.rows.length > 0) {
          const notificacion = notifRows.rows[0];
          emitPusherEvent(
            "pizzeria-notifications",
            "notificacion_actualizada",
            {
              id_venta,
              id_notificacion: notificacion.id_notificacion,
              estado_notificacion: notificacion.estado,
              monto_restante: notificacion.monto_restante,
              sucursal_id:
                notificacion.id_sucursal || req.user?.id_sucursal || null,
              tipo_evento: "notificacion_actualizada",
              timestamp: Date.now(),
            },
          );
        }
      } catch (err) {
        console.error("Error al emitir notificacion_actualizada:", err);
      }
    })();

    res.status(200).json({
      success: true,
      message: "Pedido actualizado correctamente",
    });
  } catch (error) {
    if (tx) await tx.rollback();
    console.error("Error al actualizar el pedido:", error);
    res.status(500).json({
      success: false,
      message: "Error actualizando el pedido",
      error: error.message,
    });
  }
};

//-----Reembolsar venta
export const reembolsarVenta = async (req, res) => {
  const { id_venta } = req.body;
  const id_usuario = Number(req.user?.id) || null;
  const id_sucursal = Number(req.user?.id_sucursal) || null;

  if (!id_venta) {
    return res.status(400).json({
      success: false,
      message: "El id_venta es obligatorio para procesar el reembolso.",
    });
  }

  let tx;
  try {
    tx = await db.transaction("write");

    // 1. Snapshot del reembolso ANTES de anular los montos (para el cierre del día)
    const ventaRows = await tx.execute({
      sql: `SELECT monto_total_usd, monto_total_bs, tasa_cambio
            FROM ventas
            WHERE id_venta = ? AND estado != 'Reembolsado'`,
      args: [id_venta],
    });

    if (ventaRows.rows.length === 0) {
      await tx.rollback();
      return res.status(404).json({
        success: false,
        message: "Venta no encontrada o ya fue reembolsada.",
      });
    }

    const venta = ventaRows.rows[0];

    const detallesRows = await tx.execute({
      sql: `SELECT
              vd.tipo_producto,
              vd.cantidad,
              vd.monto_total,
              COALESCE(p.nombre, b.nombre, h.nombre, co.nombre) AS nombre_producto
            FROM venta_detalle vd
            LEFT JOIN pizza      p ON p.id_pizza      = vd.id_producto_origen AND vd.tipo_producto = 'Pizza'
            LEFT JOIN bebidas    b ON b.id_bebida     = vd.id_producto_origen AND vd.tipo_producto = 'Bebida'
            LEFT JOIN heladeria  h ON h.id_heladeria  = vd.id_producto_origen AND vd.tipo_producto = 'Helado'
            LEFT JOIN combos    co ON co.id_combo     = vd.id_producto_origen AND vd.tipo_producto = 'combo'
            WHERE vd.id_venta = ?`,
      args: [id_venta],
    });

    const detallesSnapshot = detallesRows.rows.map((d) => ({
      tipo_producto: d.tipo_producto,
      nombre_producto: d.nombre_producto || d.tipo_producto,
      cantidad: Number(d.cantidad || 0),
      precio_unitario:
        Number(d.cantidad || 0) > 0
          ? Number(d.monto_total || 0) / Number(d.cantidad)
          : 0,
      monto_total: Number(d.monto_total || 0),
    }));

    await tx.execute({
      sql: `INSERT INTO reembolsos (
              id_venta, id_usuario, id_sucursal, fecha_hora,
              tasa_cambio, monto_total_usd, monto_total_bs, detalles_json
            ) VALUES (?, ?, ?, datetime('now', '-4 hours'), ?, ?, ?, ?)`,
      args: [
        Number(id_venta),
        id_usuario,
        id_sucursal,
        Number(venta.tasa_cambio) || null,
        Number(venta.monto_total_usd || 0),
        Number(venta.monto_total_bs || 0),
        JSON.stringify(detallesSnapshot),
      ],
    });

    // 2. Anular la venta en el sistema (como antes)
    await tx.execute({
      sql: `UPDATE ventas 
       SET estado = 'Reembolsado', monto_total_usd = 0, monto_total_bs = 0 
       WHERE id_venta = ?`,
      args: [id_venta],
    });

    await tx.execute({
      sql: `UPDATE ventas_pagos 
       SET monto_usd = 0, monto_bs = 0 
       WHERE id_venta = ?`,
      args: [id_venta],
    });

    await tx.execute({
      sql: `UPDATE venta_detalle 
       SET estado = 'Cancelado', monto_total = 0 
       WHERE id_venta = ?`,
      args: [id_venta],
    });

    await tx.commit();

    emitPusherEvent("pizzeria-orders", "pedido_actualizado", {
      id_venta,
      sucursal_id: null,
      tipo_evento: "pedido_actualizado",
      timestamp: Date.now(),
    });

    res.status(200).json({
      success: true,
      message: "Reembolso procesado correctamente",
    });
  } catch (error) {
    if (tx) await tx.rollback();
    console.error("Error al procesar el reembolso:", error);
    res.status(500).json({
      success: false,
      message: "Error al procesar el reembolso",
      error: error.message,
    });
  }
};

// ---- Obtener métodos de pago
export const obtenerMetodosPago = async (req, res) => {
  try {
    const clientes = (req.query.clientes || "")
      .split(",")
      .map((id) => Number(id.trim()))
      .filter((id) => Number.isInteger(id) && id > 0);

    const params = [];
    let filtro = "";
    if (clientes.length) {
      filtro = `WHERE v.id_cliente IN (${clientes.map(() => "?").join(", ")})`;
      params.push(...clientes);
    }

    const result = await db.execute({
      sql: `SELECT vp.metodo_pago AS metodo,
              COUNT(*)              AS cantidad,
              COUNT(DISTINCT vp.id_venta) AS ventas,
              SUM(vp.monto_usd)        AS total_usd,
              SUM(vp.monto_bs)         AS total_bs
       FROM ventas_pagos vp
       INNER JOIN ventas v ON v.id_venta = vp.id_venta
       ${filtro}
       GROUP BY vp.metodo_pago
       ORDER BY cantidad DESC`,
      args: params,
    });

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error al obtener métodos de pago:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- Obtener ventas del día
export const obtenerVentasHoy = async (req, res) => {
  const { id_sucursal } = req.user;
  const { id_usuario, despacho } = req.query;
  try {
    let query = `SELECT 
        v.id_venta,
        v.id_usuario,
        v.monto_total_usd,
        v.monto_total_bs,
        v.costo_delivery,
        v.despacho,
        v.fecha_hora,
        c.nombre AS nombre_cliente,
        c.cedula  AS cedula_cliente,
        (
          SELECT SUM(vd.cantidad)
          FROM venta_detalle vd
          WHERE vd.id_venta = v.id_venta AND vd.tipo_producto = 'Pizza'
        ) AS pizzas_vendidas
      FROM ventas v
      LEFT JOIN clientes c ON c.id_cliente = v.id_cliente
      WHERE DATE(v.fecha_hora) = DATE('now', '-4 hours')
        AND v.estado = 'Completado'
        AND v.id_sucursal = ?`;

    const args = [id_sucursal];
    if (despacho) {
      query += ` AND v.despacho = ?`;
      args.push(despacho);
    }
    if (id_usuario) {
      query += ` AND v.id_usuario = ?`;
      args.push(Number(id_usuario));
    }
    query += ` ORDER BY v.fecha_hora DESC`;

    const result = await db.execute({ sql: query, args });
    const ventas = result.rows;

    const totalRevenue = ventas.reduce(
      (s, v) => s + (v.monto_total_usd || 0),
      0,
    );
    const totalPizzas = ventas.reduce(
      (s, v) => s + (Number(v.pizzas_vendidas) || 0),
      0,
    );
    const avgTicket = ventas.length > 0 ? totalRevenue / ventas.length : 0;

    res.json({
      success: true,
      data: {
        ventas,
        totalRevenue,
        totalPizzas,
        avgTicket,
        totalTransactions: ventas.length,
      },
    });
  } catch (error) {
    console.error("Error al obtener ventas del día:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- Obtener pedidos activos
export const obtenerPedidosActivos = async (req, res) => {
  const { id_sucursal } = req.user;
  const { id_usuario, despacho } = req.query;
  try {
    let query = `SELECT DISTINCT
        v.id_venta,
        v.id_usuario,
        v.fecha_hora,
        v.despacho,
        v.cantidad_caja,
        v.costo_delivery,
        v.monto_total_usd,
        v.monto_total_bs,
        v.estado,
        c.id_cliente,
        c.nombre    AS nombre_cliente,
        c.cedula    AS cedula_cliente,
        c.telefono  AS telefono_cliente
      FROM ventas v
      LEFT JOIN clientes c ON c.id_cliente = v.id_cliente
      WHERE DATE(v.fecha_hora) = DATE('now', '-4 hours')
        AND v.id_sucursal = ?`;

    const args = [id_sucursal];
    if (despacho) {
      query += ` AND v.despacho = ?`;
      args.push(despacho);
    }
    if (id_usuario) {
      query += ` AND v.id_usuario = ?`;
      args.push(Number(id_usuario));
    }

    // La cola de trabajo muestra pedidos con trabajo pendiente de cocina. Cuando
    // el pedido pasa a 'Despacho' (entregado al cliente / al mesero) o 'Mesero'
    // ya salio de la cola, aunque el estado de la venta siga en 'Completado'
    // (que solo significa que la venta fue cobrada).
    query += ` AND EXISTS (
          SELECT 1 FROM venta_detalle vd
          WHERE vd.id_venta = v.id_venta
            AND vd.estado NOT IN ('Completado', 'Cerrado', 'Cancelado', 'Despacho', 'Mesero')
        )
      ORDER BY v.fecha_hora DESC`;

    const result = await db.execute({ sql: query, args });
    const ventas = result.rows;

    const idsVentas = ventas.map((v) => v.id_venta);
    const detallesBatch =
      idsVentas.length === 0
        ? []
        : (
          await db.execute({
            sql: `SELECT 
            vd.id_venta,
            vd.id_detalle,
            vd.tipo_producto,
            vd.id_producto_origen,
            vd.cantidad,
            vd.monto_total,
            vd.nota,
            vd.estado AS estado_detalle,
            COALESCE(p.nombre, b.nombre, h.nombre, co.nombre) AS nombre_producto,
            p.id_categoria_pizza 
          FROM venta_detalle vd
          LEFT JOIN pizza     p  ON p.id_pizza      = vd.id_producto_origen AND vd.tipo_producto = 'Pizza'
          LEFT JOIN bebidas   b  ON b.id_bebida     = vd.id_producto_origen AND vd.tipo_producto = 'Bebida'
          LEFT JOIN heladeria h  ON h.id_heladeria  = vd.id_producto_origen AND vd.tipo_producto = 'Helado'
          LEFT JOIN combos    co ON co.id_combo     = vd.id_producto_origen AND vd.tipo_producto = 'Combo'
          WHERE vd.id_venta IN (${idsVentas.map(() => "?").join(", ")})`,
            args: idsVentas,
          })
        ).rows;

    const idsDetalles = detallesBatch.map((d) => d.id_detalle);
    const extrasBatch =
      idsDetalles.length === 0
        ? []
        : (
          await db.execute({
            sql: `SELECT dve.id_detalle, e.id_extras AS id, e.nombre AS name, e.precio AS price
               FROM detalle_venta_extras dve
               JOIN extras e ON e.id_extras = dve.id_extra
               WHERE dve.id_detalle IN (${idsDetalles.map(() => "?").join(", ")})`,
            args: idsDetalles,
          })
        ).rows;

    const extrasPorDetalle = new Map();
    for (const extra of extrasBatch) {
      if (!extrasPorDetalle.has(extra.id_detalle)) {
        extrasPorDetalle.set(extra.id_detalle, []);
      }
      extrasPorDetalle.get(extra.id_detalle).push(extra);
    }

    const detallesPorVenta = new Map();
    for (const detalle of detallesBatch) {
      if (!detallesPorVenta.has(detalle.id_venta)) {
        detallesPorVenta.set(detalle.id_venta, []);
      }
      detallesPorVenta.get(detalle.id_venta).push(detalle);
    }

    const pedidos = ventas.map((venta) => {
      const detalles = (detallesPorVenta.get(venta.id_venta) || []).map(
        (det) => ({
          ...det,
          extras: extrasPorDetalle.get(det.id_detalle) || [],
        }),
      );
      const telefonoLimpio =
        !venta.telefono_cliente ||
          venta.telefono_cliente === 0 ||
          venta.telefono_cliente === "0"
          ? null
          : venta.telefono_cliente;

      return { ...venta, telefono_cliente: telefonoLimpio, detalles };
    });

    res.json({ success: true, data: pedidos });
  } catch (error) {
    console.error("Error al obtener pedidos activos:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

//-----------Tasa

// ---- Obtener tasa de cambio desde API externa
export const obtenerTasaExterna = async () => {
  const { data } = await axios.get(TASA_API_URL, { timeout: 10000 });
  const tasa = Number(data?.promedio);

  if (!Number.isFinite(tasa) || tasa <= 0) {
    throw new Error("La API externa devolvió una tasa inválida.");
  }

  return tasa;
};

// ---- Actualizar tasa de cambio (con fallback si la API falla)
export const actualizarTasaDesdeApi = async () => {
  try {
    const tasaApi = await obtenerTasaExterna();
    const current = await db.execute({
      sql: "SELECT anclado, tasa_sistema FROM configuracion_tasa WHERE id_config = 1",
    });
    const rows = current.rows;

    if (!rows.length) {
      await db.execute({
        sql: "INSERT INTO configuracion_tasa (id_config, tasa_api, tasa_sistema, anclado, fecha_actualizacion) VALUES (1, ?, ?, 0, datetime('now', '-4 hours'))",
        args: [tasaApi, tasaApi],
      });
    } else if (rows[0].anclado) {
      const tasaSistemaActual = Number(rows[0].tasa_sistema);

      if (tasaApi > tasaSistemaActual) {
        await db.execute({
          sql: "UPDATE configuracion_tasa SET tasa_api = ?, tasa_sistema = ?, fecha_actualizacion = datetime('now', '-4 hours') WHERE id_config = 1",
          args: [tasaApi, tasaApi],
        });
      } else {
        await db.execute({
          sql: "UPDATE configuracion_tasa SET tasa_api = ?, fecha_actualizacion = datetime('now', '-4 hours') WHERE id_config = 1",
          args: [tasaApi],
        });
      }
    } else {
      await db.execute({
        sql: "UPDATE configuracion_tasa SET tasa_api = ?, tasa_sistema = ?, fecha_actualizacion = datetime('now', '-4 hours') WHERE id_config = 1",
        args: [tasaApi, tasaApi],
      });
    }

    return tasaApi;
  } catch (error) {
    console.warn(
      "No se pudo conectar a la API externa de tasas. Se usará el último valor registrado:",
      error.message,
    );
    const registro = await obtenerRegistro();
    return registro?.tasa_sistema || 0;
  }
};

// ---- Obtener registro de la tasa desde la base de datos
export const obtenerRegistro = async () => {
  const result = await db.execute({
    sql: "SELECT id_config, tasa_api, tasa_sistema, anclado, fecha_actualizacion FROM configuracion_tasa WHERE id_config = 1",
  });
  return result.rows[0];
};

// ---- Obtener la tasa para las peticiones de las rutas
export const obtenerTasaDesdeBD = async (_req, res) => {
  try {
    const antiguedad = await db.execute({
      sql: "SELECT (strftime('%s','now') - strftime('%s', fecha_actualizacion)) AS diff_secs, CAST(strftime('%H', datetime('now', '-4 hours')) AS INTEGER) AS hora_local FROM configuracion_tasa WHERE id_config = 1",
    });
    const diffSecs = Number(antiguedad.rows?.[0]?.diff_secs ?? NaN);
    const horaLocal = Number(antiguedad.rows?.[0]?.hora_local ?? NaN);

    const desactualizada = !Number.isFinite(diffSecs) || diffSecs > 2 * 60 * 60;
    const horarioValido = Number.isFinite(horaLocal) && horaLocal >= 8;
    if (horarioValido && desactualizada) {
      await actualizarTasaDesdeApi();
    }

    const data = await obtenerRegistro();
    if (!data) {
      return res.status(404).json({
        success: false,
        message: "La configuración de la tasa no está inicializada.",
      });
    }
    return res.json({ success: true, data });
  } catch (error) {
    console.error("Error obteniendo la tasa:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---- Editar tasa y anclarla
export const editarYAnclarTasa = async (req, res) => {
  const tasaManual = Number(req.body?.tasa_manual);
  if (!Number.isFinite(tasaManual) || tasaManual <= 0) {
    return res.status(400).json({
      success: false,
      message: "tasa_manual debe ser un número mayor que cero.",
    });
  }

  try {
    await db.execute({
      sql: "UPDATE configuracion_tasa SET tasa_sistema = ?, anclado = 1 WHERE id_config = 1",
      args: [tasaManual],
    });
    return res.json({ success: true, data: await obtenerRegistro() });
  } catch (error) {
    console.error("Error anclando la tasa:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---- Desanclar tasa
export const desanclarTasa = async (_req, res) => {
  try {
    await db.execute({
      sql: "UPDATE configuracion_tasa SET tasa_sistema = tasa_api, anclado = 0 WHERE id_config = 1",
    });
    return res.json({ success: true, data: await obtenerRegistro() });
  } catch (error) {
    console.error("Error quitando el anclaje de la tasa:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
