import db from "../config/turso.js";
import { uploadImageToCloudinary } from "../utils/cloudinary.js";

// ── Caja (precio del empaque) ─────────────────────────────────────
export const obtenerCaja = async (req, res) => {
  try {
    const result = await db.execute({
      sql: `SELECT id_caja, precio_caja FROM caja LIMIT 1`,
    });
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No hay registro de caja" });
    }
    return res.json({ success: true, caja: result.rows[0] });
  } catch (error) {
    console.error("Error obteniendo caja:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
};

export const actualizarCaja = async (req, res) => {
  const precio_caja = Number(req.body.precio_caja);
  if (!Number.isFinite(precio_caja) || precio_caja < 0) {
    return res
      .status(400)
      .json({ success: false, message: "precio_caja inválido" });
  }
  try {
    const result = await db.execute({
      sql: `SELECT id_caja FROM caja LIMIT 1`,
    });
    const row = result.rows[0];
    if (!row) {
      await db.execute({
        sql: `INSERT INTO caja (precio_caja) VALUES (?)`,
        args: [precio_caja],
      });
    } else {
      await db.execute({
        sql: `UPDATE caja SET precio_caja = ? WHERE id_caja = ?`,
        args: [precio_caja, row.id_caja],
      });
    }
    return res.json({
      success: true,
      message: "Precio de caja actualizado",
      precio_caja,
    });
  } catch (error) {
    console.error("Error actualizando caja:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
};

// ----pizzas
export const obtenerPizzas = async (req, res) => {
  try {
    const result = await db.execute({
      sql: `SELECT p.*, c.categoria AS categoria_nombre
      FROM pizza p 
      LEFT JOIN categoria_pizza c ON p.id_categoria_pizza = c.id_categoria_pizza
      WHERE p.estado = ?
    `,
      args: ["Activo"],
    });
    const rows = result.rows;

    const pizzas = rows.map((pizza) => ({
      id: pizza.id_pizza,
      name: pizza.nombre,
      price: pizza.precio,
      description: pizza.descripcion,
      category: "pizzas",
      size: pizza.categoria_nombre || "Normal",
      pizzaCategory: pizza.categoria_nombre || null,
      url: pizza.url || null,
      estado: pizza.estado || "Activo",
    }));

    res.json({ success: true, data: pizzas });
  } catch (error) {
    console.error("Error obteniendo pizzas:", error);
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
};

export const crearPizza = async (req, res) => {
  const { name, price, description, size } = req.body;
  try {
    let id_categoria_pizza =
      size === "Gigante" ? 3 : size === "Familiar" ? 2 : 1;
    const imageUrl = await uploadImageToCloudinary(req.file, "pizzas");

    const result = await db.execute({
      sql: `INSERT INTO pizza (nombre, precio, descripcion, id_categoria_pizza, estado, url) VALUES (?, ?, ?, ?, 'Activo', ?)`,
      args: [name, price, description, id_categoria_pizza, imageUrl],
    });

    res.status(201).json({
      success: true,
      message: "Pizza registrada",
      id: Number(result.lastInsertRowid),
      url: imageUrl,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const actualizarPizza = async (req, res) => {
  const { id } = req.params;
  const { name, price, description, size } = req.body;
  try {
    let id_categoria_pizza =
      size === "Gigante" ? 3 : size === "Familiar" ? 2 : 1;

    const existingResult = await db.execute({
      sql: "SELECT url FROM pizza WHERE id_pizza = ?",
      args: [id],
    });
    const existing = existingResult.rows;
    let imageUrl = existing.length > 0 ? existing[0].url : null;

    if (req.file) imageUrl = await uploadImageToCloudinary(req.file, "pizzas");

    await db.execute({
      sql: `UPDATE pizza SET nombre = ?, precio = ?, descripcion = ?, id_categoria_pizza = ?, url = ? WHERE id_pizza = ?`,
      args: [name, price, description, id_categoria_pizza, imageUrl, id],
    });

    res.json({
      success: true,
      message: "Pizza actualizada correctamente",
      url: imageUrl,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const eliminarPizza = async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute({
      sql: "UPDATE pizza SET estado = 'Inactivo' WHERE id_pizza = ?",
      args: [id],
    });
    res.json({ success: true, message: "Pizza eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ----bebidasw

export const obtenerBebidas = async (req, res) => {
  try {
    const activo = "Activo";
    const result = await db.execute({
      sql: "SELECT * FROM bebidas WHERE estado = ?",
      args: [activo],
    });
    const rows = result.rows;

    const bebidas = rows.map((bebida) => ({
      id: bebida.id_bebida,
      name: bebida.nombre,
      price: bebida.precio,
      description: bebida.descripcion,
      category: "drinks",
      url: bebida.url || null,
      estado: bebida.estado || "Activo",
    }));

    res.json({ success: true, data: bebidas });
  } catch (error) {
    console.error("Error obteniendo bebidas:", error);
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
};

export const crearBebida = async (req, res) => {
  const { name, price, description } = req.body;
  try {
    const imageUrl = await uploadImageToCloudinary(req.file, "bebidas");
    const result = await db.execute({
      sql: `INSERT INTO bebidas (nombre, precio, descripcion, estado, url) VALUES (?, ?, ?, 'Activo', ?)`,
      args: [name, price, description, imageUrl],
    });
    res.status(201).json({
      success: true,
      message: "Bebida registrada",
      id: Number(result.lastInsertRowid),
      url: imageUrl,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const actualizarBebida = async (req, res) => {
  const { id } = req.params;
  const { name, price, description } = req.body;
  try {
    const existingResult = await db.execute({
      sql: "SELECT url FROM bebidas WHERE id_bebida = ?",
      args: [id],
    });
    const existing = existingResult.rows;
    let imageUrl = existing.length > 0 ? existing[0].url : null;

    if (req.file) imageUrl = await uploadImageToCloudinary(req.file, "bebidas");

    await db.execute({
      sql: `UPDATE bebidas SET nombre = ?, precio = ?, descripcion = ?, url = ? WHERE id_bebida = ?`,
      args: [name, price, description, imageUrl, id],
    });
    res.json({
      success: true,
      message: "Bebida actualizada correctamente",
      url: imageUrl,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const eliminarBebida = async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute({
      sql: "UPDATE bebidas SET estado = 'Inactivo' WHERE id_bebida = ?",
      args: [id],
    });
    res.json({ success: true, message: "Bebida eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -----helados

export const obtenerHelados = async (req, res) => {
  try {
    const result = await db.execute({
      sql: "SELECT * FROM heladeria WHERE estado = ?",
      args: ["Activo"],
    });
    const rows = result.rows;

    const helados = rows.map((helado) => ({
      id: helado.id_heladeria, //
      name: helado.nombre,
      price: helado.precio,
      description: helado.descripcion,
      category: "icecream",
      url: helado.url || null,
      estado: helado.estado || "Activo",
    }));

    res.json({ success: true, data: helados });
  } catch (error) {
    console.error("Error obteniendo helados:", error);
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
};

export const crearHelado = async (req, res) => {
  const { name, price, description } = req.body;
  try {
    const imageUrl = await uploadImageToCloudinary(req.file, "helados");
    const result = await db.execute({
      sql: `INSERT INTO heladeria (nombre, precio, descripcion, estado, url) VALUES (?, ?, ?, 'Activo', ?)`,
      args: [name, price, description, imageUrl],
    });
    res.status(201).json({
      success: true,
      message: "Helado registrado",
      id: Number(result.lastInsertRowid),
      url: imageUrl,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const actualizarHelado = async (req, res) => {
  const { id } = req.params;
  const { name, price, description } = req.body;
  try {
    const existingResult = await db.execute({
      sql: "SELECT url FROM heladeria WHERE id_heladeria = ?",
      args: [id],
    });
    const existing = existingResult.rows;
    let imageUrl = existing.length > 0 ? existing[0].url : null;

    if (req.file) imageUrl = await uploadImageToCloudinary(req.file, "helados");

    await db.execute({
      sql: `UPDATE heladeria SET nombre = ?, precio = ?, descripcion = ?, url = ? WHERE id_heladeria = ?`,
      args: [name, price, description, imageUrl, id],
    });
    res.json({
      success: true,
      message: "Helado actualizado correctamente",
      url: imageUrl,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const eliminarHelado = async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute({
      sql: "UPDATE heladeria SET estado = 'Inactivo' WHERE id_heladeria = ?",
      args: [id],
    });
    res.json({ success: true, message: "Helado eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -----extras

export const obtenerExtras = async (req, res) => {
  try {
    const result = await db.execute({
      sql: `SELECT e.*, c.categoria AS categoria_nombre
      FROM extras e
      LEFT JOIN categoria_pizza c ON e.id_categoria_pizza = c.id_categoria_pizza
      WHERE e.estado = ?
    `,
      args: ["Activo"],
    });
    const rows = result.rows;

    const extras = rows.map((extra) => ({
      id: extra.id_extras,
      id_categoria_pizza: extra.id_categoria_pizza,
      name: extra.nombre,
      price: extra.precio,
      category: "extras",
      size: extra.categoria_nombre || "Normal",
      extraCategory: extra.categoria_nombre || null,
      estado: extra.estado || "Activo",
    }));

    res.json({ success: true, data: extras });
  } catch (error) {
    console.error("Error obteniendo extras:", error);
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
};

export const crearExtra = async (req, res) => {
  const { name, price, size } = req.body;
  try {
    let id_categoria_pizza =
      size === "Gigante" ? 3 : size === "Familiar" ? 2 : 1;
    const result = await db.execute({
      sql: `INSERT INTO extras (nombre, precio, id_categoria_pizza, estado) VALUES (?, ?, ?, 'Activo')`,
      args: [name, price, id_categoria_pizza],
    });
    res.status(201).json({
      success: true,
      message: "Extra registrado",
      id: Number(result.lastInsertRowid),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const actualizarExtra = async (req, res) => {
  const { id } = req.params;
  const { name, price, size } = req.body;
  try {
    let id_categoria_pizza =
      size === "Gigante" ? 3 : size === "Familiar" ? 2 : 1;
    await db.execute({
      sql: `UPDATE extras SET nombre = ?, precio = ?, id_categoria_pizza = ? WHERE id_extras = ?`,
      args: [name, price, id_categoria_pizza, id],
    });
    res.status(200).json({ success: true, message: "Extra actualizado" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const eliminarExtra = async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute({
      sql: "UPDATE extras SET estado = 'Inactivo' WHERE id_extras = ?",
      args: [id],
    });
    res.json({ success: true, message: "Extra eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
