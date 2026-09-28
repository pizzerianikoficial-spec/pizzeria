import db from "../config/turso.js";

//----------------------Sucursales
export const registrarSucursal = async (req, res) => {
  try {
    const { name, direccion } = req.body;
    const nameTrim = String(name || "").trim();
    const direccionTrim = String(direccion || "").trim();

    if (!nameTrim) {
      return res.status(400).json({
        success: false,
        message: "El nombre de la sucursal es obligatorio.",
      });
    }

    const existeSucursal = await db.execute({
      sql: "SELECT id_sucursal FROM sucursal WHERE sucursal = ? LIMIT 1",
      args: [nameTrim],
    });

    if (existeSucursal.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Ya existe una sucursal con ese nombre.",
      });
    }

    const estadoActivo = "Activo";

    const sucursalCreada = await db.execute({
      sql: "INSERT INTO sucursal (sucursal, direccion, estado) VALUES (?,?,?)",
      args: [nameTrim, direccionTrim, estadoActivo],
    });

    res.status(201).json({
      success: true,
      message: "La sucursal ha sido creada exitosamente!",
      sucursal: {
        id_sucursal: sucursalCreada.insertId,
        sucursal: nameTrim,
        direccion: direccionTrim,
        estado: estadoActivo,
      },
    });
  } catch (error) {
    console.error("Error al registrar una sucursal", error);
    res.status(500).json({
      success: false,
      message: "No se pudo registrar la sucursal.",
      error: error.message,
    });
  }
};

export const obtenerSucursal = async (req, res) => {
  try {
    const results = await db.execute({
      sql: `
      SELECT 
        s.id_sucursal AS id, 
        s.sucursal AS name, 
        s.direccion AS address,
        COUNT(u.id_usuario) AS userCount
      FROM sucursal s
      LEFT JOIN usuarios u ON u.id_sucursal = s.id_sucursal AND u.estado = 'Activo'
      WHERE s.estado = 'Activo'
      GROUP BY s.id_sucursal
    `,
    });

    res.json({ success: true, data: results.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error en servidor" });
  }
};

export const actualizarSucursal = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, direccion } = req.body;
    const nameTrim = String(name || "").trim();
    const direccionTrim = String(direccion || "").trim();

    if (!nameTrim) {
      return res.status(400).json({
        success: false,
        message: "El nombre de la sucursal es obligatorio.",
      });
    }

    // Verificar si existe otra sucursal con el mismo nombre
    const existeSucursal = await db.execute({
      sql: "SELECT id_sucursal FROM sucursal WHERE sucursal = ? AND id_sucursal != ? LIMIT 1",
      args: [nameTrim, id],
    });

    if (existeSucursal.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Ya existe otra sucursal con ese nombre.",
      });
    }

    const result = await db.execute({
      sql: "UPDATE sucursal SET sucursal = ?, direccion = ? WHERE id_sucursal = ?",
      args: [nameTrim, direccionTrim, id],
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json({
        success: false,
        message: "Sucursal no encontrada.",
      });
    }

    res.json({
      success: true,
      message: "Sucursal actualizada exitosamente.",
      sucursal: {
        id_sucursal: Number(id),
        sucursal: nameTrim,
        direccion: direccionTrim,
      },
    });
  } catch (error) {
    console.error("Error al actualizar la sucursal", error);
    res.status(500).json({
      success: false,
      message: "No se pudo actualizar la sucursal.",
      error: error.message,
    });
  }
};

export const eliminarSucursal = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si hay usuarios registrados en esta sucursal
    const usuarios = await db.execute({
      sql: "SELECT COUNT(*) AS total FROM usuarios WHERE id_sucursal = ? AND estado = 'Activo'",
      args: [id],
    });

    if (usuarios.rows[0].total > 0) {
      return res.status(409).json({
        success: false,
        message: `No se puede eliminar esta sucursal porque tiene ${usuarios.rows[0].total} usuario(s) activo(s) asignado(s).`,
      });
    }

    const result = await db.execute({
      sql: "DELETE FROM sucursal WHERE id_sucursal = ?",
      args: [id],
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json({
        success: false,
        message: "Sucursal no encontrada.",
      });
    }

    res.json({
      success: true,
      message: "Sucursal eliminada exitosamente.",
    });
  } catch (error) {
    console.error("Error al eliminar la sucursal", error);
    res.status(500).json({
      success: false,
      message: "No se pudo eliminar la sucursal.",
      error: error.message,
    });
  }
};
