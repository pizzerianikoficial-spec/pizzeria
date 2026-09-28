import bcrypt from "bcrypt";
//import pool from "../config/bd.js";
import db from "../config/turso.js";

//----------------------Delivery

export const buscarDelivery = async (req, res) => {
  const { q } = req.query;
  const searchTerm = q ? q.trim() : "";

  try {
    const result = await db.execute({
      sql: `SELECT id_delivery as id, nombre as name, digitos as phone 
       FROM delivery 
       WHERE digitos = ? OR nombre LIKE ?`,
      args: [searchTerm, `%${searchTerm}%`],
    });

    if (result.rows.length > 0) {
      res.json({ success: true, delivery: result.rows[0] });
    } else {
      res.json({ success: false, message: "Delivery no encontrado" });
    }
  } catch (error) {
    console.error("Error buscando delivery:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const registrarDelivery = async (req, res) => {
  try {
    const digits = String(req.body?.phone || "").replace(/\D/g, "");
    const name = String(req.body?.name || "").trim();

    if (digits.length !== 4) {
      return res.status(400).json({
        success: false,
        message: "Se requieren exactamente los últimos 4 dígitos del teléfono.",
      });
    }

    const existing = await db.execute({
      sql: "SELECT id_delivery as id, nombre as name, digitos as phone FROM delivery WHERE digitos = ? LIMIT 1",
      args: [digits],
    });

    if (existing.rows.length > 0) {
      return res.json({
        success: true,
        created: false,
        delivery: existing[0],
      });
    }

    const deliveryName = name || `Delivery-${digits}`;
    const result = await db.execute({
      sql: "INSERT INTO delivery (digitos, nombre) VALUES (?, ?)",
      args: [digits, deliveryName],
    });

    res.status(201).json({
      success: true,
      message: "Delivery registrado con éxito",
      created: true,
      delivery: {
        id: result.insertId,
        name: deliveryName,
        phone: digits,
      },
    });
  } catch (error) {
    console.error("Error al registrar el nuevo delivery:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor al guardar el repartidor.",
    });
  }
};

//-------------------------Usuarios
export const registrarUsuario = async (req, res) => {
  try {
    const { name, nombre_completo, email, password, id_sucursal, rol } =
      req.body;

    const nameTrim = String(name || nombre_completo || "").trim();
    const emailTrim = String(email || "")
      .trim()
      .toLowerCase();
    const passwordTrim = String(password || "").trim();

    if (!nameTrim || !emailTrim || !passwordTrim) {
      return res.status(400).json({
        success: false,
        message: "El nombre, email y la contraseña son obligatorios.",
      });
    }

    if (passwordTrim.length < 6) {
      return res.status(400).json({
        success: false,
        message: "La contraseña debe tener al menos 6 caracteres.",
      });
    }

    if (!id_sucursal && id_sucursal !== 0) {
      return res.status(400).json({
        success: false,
        message: "La sucursal es obligatoria.",
      });
    }

    const results = await db.execute({
      sql: "SELECT u.id_usuario, s.id_sucursal FROM usuarios u LEFT JOIN sucursal s ON u.id_sucursal = s.id_sucursal WHERE u.email = ? AND s.id_sucursal = ? LIMIT 1",
      args: [emailTrim, id_sucursal],
    });
    const existingUser = results.rows || [];
    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Ya existe un usuario con ese correo.",
      });
    }

    const passwordHash = await bcrypt.hash(passwordTrim, 10);

    const estadoActivo = "Activo";
    const result = await db.execute({
      sql: "INSERT INTO usuarios (nombre_completo, email, password, id_sucursal, rol, estado) VALUES (?, ?, ?, ?, ?, ?)",
      args: [
        nameTrim,
        emailTrim,
        passwordHash,
        Number(id_sucursal),
        rol,
        estadoActivo,
      ],
    });

    res.status(201).json({
      success: true,
      message: "Usuario registrado correctamente.",
      usuario: {
        id_usuario: result.insertId,
        nombre_completo: nameTrim,
        email: emailTrim,
        id_sucursal: Number(id_sucursal),
        rol,
        estado: estadoActivo,
      },
    });
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    res.status(500).json({
      success: false,
      message: "No se pudo registrar el usuario.",
      error: error.message,
    });
  }
};

export const obtenerUsuarios = async (req, res) => {
  try {
    const result = await db.execute({
      sql: `
      SELECT 
        id_usuario AS id, 
        nombre_completo AS name, 
        email, 
        rol AS role, 
        id_sucursal AS branchId,
        estado
      FROM usuarios
    `,
    });
    const rows = result.rows || [];
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error en servidor" });
  }
};

export const eliminarUsuario = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.execute({
      sql: "UPDATE usuarios SET estado = 'Inactivo' WHERE id_usuario = ?",
      args: [id],
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    res.json({
      success: true,
      message: "Usuario inactivado correctamente",
    });
  } catch (error) {
    console.error("Error al inactivar usuario:", error);
    res.status(500).json({
      success: false,
      message: "Ocurrió un error al intentar eliminar el usuario",
    });
  }
};

export const activarUsuario = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.execute({
      sql: "UPDATE usuarios SET estado = 'Activo' WHERE id_usuario = ?",
      args: [id],
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    res.json({
      success: true,
      message: "Usuario activado correctamente",
    });
  } catch (error) {
    console.error("Error al activar usuario:", error);
    res.status(500).json({
      success: false,
      message: "Ocurrió un error al intentar activar el usuario",
    });
  }
};

export const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_completo, email, rol, id_sucursal, password } = req.body;

    const nameTrim = String(nombre_completo || "").trim();
    const emailTrim = String(email || "")
      .trim()
      .toLowerCase();

    if (
      !nameTrim ||
      !emailTrim ||
      !rol ||
      (!id_sucursal && id_sucursal !== 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "El nombre, email, rol y sucursal son obligatorios.",
      });
    }

    // Validar unicidad del correo electrónico
    const existingUser = await db.execute({
      sql: "SELECT id_usuario FROM usuarios WHERE email = ? AND id_usuario != ? LIMIT 1",
      args: [emailTrim, id],
    });

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Ya existe otro usuario con ese correo.",
      });
    }

    let queryParams = [nameTrim, emailTrim, rol, Number(id_sucursal)];
    let queryStr =
      "UPDATE usuarios SET nombre_completo = ?, email = ?, rol = ?, id_sucursal = ?";

    // Actualizar contraseña si se provee una nueva
    if (password && password.trim() !== "") {
      const passwordTrim = password.trim();
      if (passwordTrim.length < 6) {
        return res.status(400).json({
          success: false,
          message: "La contraseña debe tener al menos 6 caracteres.",
        });
      }
      const passwordHash = await bcrypt.hash(passwordTrim, 10);
      queryStr += ", password = ?";
      queryParams.push(passwordHash);
    }

    queryStr += " WHERE id_usuario = ?";
    queryParams.push(id);

    const result = await db.execute({
      sql: queryStr,
      args: queryParams,
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado.",
      });
    }

    res.json({
      success: true,
      message: "Usuario actualizado exitosamente.",
      usuario: {
        id_usuario: Number(id),
        nombre_completo: nameTrim,
        email: emailTrim,
        rol,
        id_sucursal: Number(id_sucursal),
      },
    });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({
      success: false,
      message: "No se pudo actualizar el usuario.",
      error: error.message,
    });
  }
};
