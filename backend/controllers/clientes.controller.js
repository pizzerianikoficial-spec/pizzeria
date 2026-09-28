import db from "../config/turso.js";

const sanitizePhone = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : 0;
};

//----------------------Clientes

export const buscarClientes = async (req, res) => {
  const { q } = req.query;
  const searchTerm = q ? q.trim() : "";

  try {
    const result = await db.execute({
      sql: `SELECT c.id_cliente as id, c.cedula, c.nombre as name, c.telefono as phone,
              COUNT(v.id_venta) as orders
       FROM clientes c
       LEFT JOIN ventas v ON c.id_cliente = v.id_cliente
      WHERE c.cedula = ? OR substr(CAST(c.cedula AS TEXT), -4) = ? OR c.nombre LIKE ?
       GROUP BY c.id_cliente`,
      args: [searchTerm, searchTerm, `%${searchTerm}%`],
    });
    const rows = result.rows;

    if (rows.length > 0) {
      res.json({ success: true, cliente: rows[0] });
    } else {
      res.json({ success: false, message: "Cliente no encontrado" });
    }
  } catch (error) {
    console.error("Error buscando cliente:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const buscarORegistrarClienteDelivery = async (req, res) => {
  const digits = String(req.body?.phoneLastDigits || "").replace(/\D/g, "");

  if (digits.length !== 4) {
    return res.status(400).json({
      success: false,
      message: "Se requieren exactamente los últimos 4 dígitos del teléfono.",
    });
  }

  try {
    const existingResult = await db.execute({
      sql: `SELECT c.id_cliente AS id, c.cedula, c.nombre AS name, c.telefono AS phone,
              COUNT(v.id_venta) AS orders
       FROM clientes c
       LEFT JOIN ventas v ON c.id_cliente = v.id_cliente
       WHERE substr(CAST(c.telefono AS TEXT), -4) = ?
       GROUP BY c.id_cliente
       ORDER BY c.id_cliente ASC
       LIMIT 1`,
      args: [digits],
    });
    const existing = existingResult.rows;

    if (existing.length > 0) {
      return res.json({ success: true, cliente: existing[0], created: false });
    }

    const result = await db.execute({
      sql: `INSERT INTO clientes (cedula, nombre, telefono, descripcion)
       VALUES (?, ?, ?, ?)`,
      args: [
        `Delivery-${digits}`,
        "Cliente Delivery",
        Number(digits),
        "eres el mas fuerte por ser satoru gojo o eres satoru gojo porque eres el mas fuerte.",
      ],
    });

    return res.status(201).json({
      success: true,
      created: true,
      cliente: {
        id: Number(result.lastInsertRowid),
        cedula: `DELIVERY-${digits}`,
        name: "Cliente Delivery",
        phone: Number(digits),
        orders: 0,
      },
    });
  } catch (error) {
    console.error("Error buscando o registrando cliente de delivery:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const actualizarAliasCliente = async (req, res) => {
  const { id } = req.params;
  const name = String(req.body?.name || "").trim();

  if (!name) {
    return res.status(400).json({
      success: false,
      message: "El alias del cliente es obligatorio.",
    });
  }

  try {
    const result = await db.execute({
      sql: "UPDATE clientes SET nombre = ? WHERE id_cliente = ?",
      args: [name, id],
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json({
        success: false,
        message: "Cliente no encontrado.",
      });
    }

    res.json({
      success: true,
      cliente: { id: Number(id), name },
    });
  } catch (error) {
    console.error("Error actualizando alias del cliente:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const obtenerClientes = async (req, res) => {
  try {
    const result = await db.execute({
      sql: `SELECT c.id_cliente AS id, c.cedula, c.nombre AS name, c.telefono AS phone, c.descripcion,
              COUNT(v.id_venta) AS orders,
              COALESCE(SUM(v.monto_total_usd), 0) AS total,
              MAX(v.fecha_hora) AS lastVisit
       FROM clientes c
       LEFT JOIN ventas v ON c.id_cliente = v.id_cliente
       GROUP BY c.id_cliente
       ORDER BY c.nombre ASC`,
    });

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error obteniendo clientes:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const registrarClientes = async (req, res) => {
  const { cedula, name, phone, descripcion } = req.body;
  const cedulaTrim = String(cedula || "").trim();

  if (!cedulaTrim || !String(name || "").trim()) {
    return res.status(400).json({
      success: false,
      message: "La cédula y el nombre son obligatorios",
    });
  }

  try {
    const existingResult = await db.execute({
      sql: `SELECT id_cliente FROM clientes WHERE cedula = ?`,
      args: [cedulaTrim],
    });
    const existing = existingResult.rows;

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Ya existe un cliente registrado con esa cédula",
      });
    }

    const result = await db.execute({
      sql: `INSERT INTO clientes (cedula, nombre, telefono, descripcion) VALUES (?, ?, ?, ?)`,
      args: [
        cedulaTrim,
        String(name).trim(),
        sanitizePhone(phone),
        descripcion || "",
      ],
    });

    res.status(201).json({
      success: true,
      cliente: {
        id: Number(result.lastInsertRowid),
        cedula: cedulaTrim,
        name: String(name).trim(),
        phone: sanitizePhone(phone),
        descripcion: descripcion || "",
        orders: 0,
        total: 0,
        lastVisit: null,
      },
    });
  } catch (error) {
    console.error("Error registrando cliente:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const editarCliente = async (req, res) => {
  const { id } = req.params;
  const { cedula, name, phone, descripcion } = req.body;
  const cedulaTrim = String(cedula || "").trim();

  if (!cedulaTrim || !String(name || "").trim()) {
    return res.status(400).json({
      success: false,
      message: "La cédula y el nombre son obligatorios",
    });
  }

  try {
    const existingResult = await db.execute({
      sql: `SELECT id_cliente FROM clientes WHERE cedula = ? AND id_cliente != ?`,
      args: [cedulaTrim, id],
    });
    const existing = existingResult.rows;

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Ya existe otro cliente con esa cédula",
      });
    }

    const result = await db.execute({
      sql: `UPDATE clientes SET cedula = ?, nombre = ?, telefono = ?, descripcion = ? WHERE id_cliente = ?`,
      args: [
        cedulaTrim,
        String(name).trim(),
        sanitizePhone(phone),
        descripcion || "",
        id,
      ],
    });

    if (result.rowsAffected === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Cliente no encontrado" });
    }

    res.json({
      success: true,
      cliente: {
        id,
        cedula: cedulaTrim,
        name: String(name).trim(),
        phone: sanitizePhone(phone),
        descripcion: descripcion || "",
      },
    });
  } catch (error) {
    console.error("Error editando cliente:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
