import db from "../config/turso.js";
import { uploadImageToCloudinary } from "../utils/cloudinary.js";

const queryRows = async (sql, args = []) => {
  const result = await db.execute({ sql, args });
  return result.rows;
};

// ---- Categorías de Pizza (para el filtro del selector de pizzas en combos)
export const obtenerCategoriasPizza = async (req, res) => {
  try {
    const rows = await queryRows(
      "SELECT id_categoria_pizza, categoria FROM categoria_pizza ORDER BY id_categoria_pizza ASC",
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error obteniendo categorías de pizza:", error);
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
};

// ---- Pizzas activas (para el selector dentro del formulario de combo)
export const obtenerPizzasActivas = async (req, res) => {
  try {
    const rows = await queryRows(`
      SELECT p.id_pizza, p.nombre, p.precio, p.url, p.id_categoria_pizza,
            c.categoria AS categoria_nombre
      FROM pizza p
      LEFT JOIN categoria_pizza c ON p.id_categoria_pizza = c.id_categoria_pizza
      WHERE p.estado = 'Activo'
      ORDER BY c.id_categoria_pizza ASC, p.nombre ASC
    `);

    const pizzas = rows.map((p) => ({
      id: p.id_pizza,
      name: p.nombre,
      price: p.precio,
      url: p.url || null,
      id_categoria_pizza: p.id_categoria_pizza,
      categoria_nombre: p.categoria_nombre || "Normal",
    }));

    res.json({ success: true, data: pizzas });
  } catch (error) {
    console.error("Error obteniendo pizzas activas:", error);
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
};

// ---- Bebidas activas (para el selector dentro del formulario de combo)
export const obtenerBebidasActivas = async (req, res) => {
  try {
    const rows = await queryRows(
      "SELECT id_bebida, nombre, precio, url FROM bebidas WHERE estado = 'Activo' ORDER BY nombre ASC",
    );

    const bebidas = rows.map((b) => ({
      id: b.id_bebida,
      name: b.nombre,
      price: b.precio,
      url: b.url || null,
    }));

    res.json({ success: true, data: bebidas });
  } catch (error) {
    console.error("Error obteniendo bebidas activas:", error);
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
};

// ---- Listar combos con su detalle de ítems
export const obtenerCombos = async (req, res) => {
  try {
    // Traer todos los combos
    const combos = await queryRows(
      "SELECT * FROM combos ORDER BY id_combo DESC",
    );

    if (combos.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Traer todos los detalles de todos los combos en una sola query con JOIN
    const detalles = await queryRows(`
        SELECT
          cd.id_combo_detalle,
          cd.id_combo,
          cd.cantidad,
          cd.id_pizza,
          cd.id_bebida,
          p.nombre  AS nombre_pizza,
          p.url     AS url_pizza,
          cp.categoria AS categoria_pizza,
          b.nombre  AS nombre_bebida,
          b.url     AS url_bebida
        FROM combo_detalle cd
        LEFT JOIN pizza p ON cd.id_pizza = p.id_pizza
        LEFT JOIN bebidas b ON cd.id_bebida = b.id_bebida
        LEFT JOIN categoria_pizza cp ON p.id_categoria_pizza = cp.id_categoria_pizza
`);

    // Agrupar detalles por id_combo
    const detallesPorCombo = detalles.reduce((acc, d) => {
      if (!acc[d.id_combo]) acc[d.id_combo] = [];
      const esPizza = d.id_pizza !== null;
      acc[d.id_combo].push({
        id_combo_detalle: d.id_combo_detalle,
        tipo_producto: esPizza ? "Pizza" : "Bebida",
        id_producto_origen: esPizza ? d.id_pizza : d.id_bebida,
        cantidad: d.cantidad,
        nombre_producto: esPizza ? d.nombre_pizza : d.nombre_bebida,
        url_producto: esPizza ? d.url_pizza : d.url_bebida,
        categoria_pizza: esPizza ? d.categoria_pizza : null,
      });
      return acc;
    }, {});

    const result = combos.map((combo) => ({
      id: combo.id_combo,
      name: combo.nombre,
      description: combo.descripcion,
      price: combo.precio,
      estado: combo.estado,
      url: combo.url || null,
      category: "combos",
      items: detallesPorCombo[combo.id_combo] || [],
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    if (
      error.code === "ER_NO_SUCH_TABLE" ||
      (error.code === "SQLITE_ERROR" &&
        error.message?.includes("no such table"))
    ) {
      console.warn(
        "Tabla 'combos' no encontrada en BD. Retornando lista vacía.",
      );
      return res.json({ success: true, data: [] });
    }
    console.error("Error obteniendo combos:", error);
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
};

// ---- Crear un combo con su detalle (transacción SQL)
export const crearCombo = async (req, res) => {
  const { nombre, descripcion, precio, items } = req.body;

  // Parsear items si viene como string (FormData)
  let parsedItems = [];
  try {
    parsedItems = typeof items === "string" ? JSON.parse(items) : items || [];
  } catch {
    return res.status(400).json({
      success: false,
      message: "El campo 'items' tiene un formato inválido.",
    });
  }

  if (!nombre || !precio) {
    return res
      .status(400)
      .json({ success: false, message: "Nombre y precio son obligatorios." });
  }

  if (!parsedItems || parsedItems.length === 0) {
    return res.status(400).json({
      success: false,
      message: "El combo debe tener al menos un ítem.",
    });
  }

  let tx;
  try {
    tx = await db.transaction("write");

    // 1. Subir imagen si existe
    const imageUrl = req.file
      ? await uploadImageToCloudinary(req.file, "combos")
      : null;

    // 2. Insertar en tabla combos
    const result = await tx.execute({
      sql: `INSERT INTO combos (nombre, descripcion, precio, estado, url) VALUES (?, ?, ?, 'Activo', ?)`,
      args: [nombre, descripcion || "", parseFloat(precio), imageUrl],
    });

    const id_combo = Number(result.lastInsertRowid);

    // 3. Insertar cada ítem en combo_detalle
    for (const item of parsedItems) {
      const id_pizza =
        item.tipo_producto === "Pizza" ? item.id_producto_origen : null;
      const id_bebida =
        item.tipo_producto === "Bebida" ? item.id_producto_origen : null;
      await tx.execute({
        sql: `INSERT INTO combo_detalle (id_combo, cantidad, id_pizza, id_bebida) VALUES (?, ?, ?, ?)`,
        args: [id_combo, item.cantidad || 1, id_pizza, id_bebida],
      });
    }

    await tx.commit();

    res.status(201).json({
      success: true,
      message: "Combo registrado exitosamente",
      id: id_combo,
      url: imageUrl,
    });
  } catch (error) {
    if (tx) await tx.rollback();
    console.error("Error creando combo:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- Eliminar un combo y su detalle
export const eliminarCombo = async (req, res) => {
  const { id } = req.params;
  let tx;
  try {
    tx = await db.transaction("write");
    // Eliminar primero el detalle (FK)
    await tx.execute({
      sql: "DELETE FROM combo_detalle WHERE id_combo = ?",
      args: [id],
    });
    // Luego eliminar el combo
    const result = await tx.execute({
      sql: "DELETE FROM combos WHERE id_combo = ?",
      args: [id],
    });
    await tx.commit();

    if (result.rowsAffected === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Combo no encontrado." });
    }

    res.json({ success: true, message: "Combo eliminado correctamente" });
  } catch (error) {
    if (tx) await tx.rollback();
    console.error("Error eliminando combo:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- Actualizar un combo y su detalle
export const actualizarCombo = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, items } = req.body;

  let parsedItems = [];
  try {
    parsedItems = typeof items === "string" ? JSON.parse(items) : items || [];
  } catch {
    return res.status(400).json({
      success: false,
      message: "El campo 'items' tiene un formato inválido.",
    });
  }

  if (!nombre || !precio) {
    return res
      .status(400)
      .json({ success: false, message: "Nombre y precio son obligatorios." });
  }

  if (!parsedItems || parsedItems.length === 0) {
    return res.status(400).json({
      success: false,
      message: "El combo debe tener al menos un ítem.",
    });
  }

  let tx;
  try {
    tx = await db.transaction("write");

    // Obtener URL actual
    const existing = await queryRows(
      "SELECT url FROM combos WHERE id_combo = ?",
      [id],
    );

    if (existing.length === 0) {
      await connection.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Combo no encontrado." });
    }

    let imageUrl = existing[0].url;
    if (req.file) imageUrl = await uploadImageToCloudinary(req.file, "combos");

    // 1. Actualizar registro principal del combo
    await tx.execute({
      sql: `UPDATE combos SET nombre = ?, descripcion = ?, precio = ?, url = ? WHERE id_combo = ?`,
      args: [nombre, descripcion || "", parseFloat(precio), imageUrl, id],
    });

    // 2. Eliminar los ítems del detalle anteriores
    await tx.execute({
      sql: "DELETE FROM combo_detalle WHERE id_combo = ?",
      args: [id],
    });

    // 3. Reinsertar los ítems actualizados
    for (const item of parsedItems) {
      const id_pizza =
        item.tipo_producto === "Pizza" ? item.id_producto_origen : null;
      const id_bebida =
        item.tipo_producto === "Bebida" ? item.id_producto_origen : null;
      await tx.execute({
        sql: `INSERT INTO combo_detalle (id_combo, cantidad, id_pizza, id_bebida) VALUES (?, ?, ?, ?)`,
        args: [id, item.cantidad || 1, id_pizza, id_bebida],
      });
    }

    await tx.commit();

    res.json({
      success: true,
      message: "Combo actualizado correctamente",
      url: imageUrl,
    });
  } catch (error) {
    if (tx) await tx.rollback();
    console.error("Error actualizando combo:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
