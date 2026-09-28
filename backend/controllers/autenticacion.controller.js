import crypto from "crypto";
//import pool from "../config/bd.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { env } from "../config/env.js";
import { sendPasswordResetEmail } from "../config/mailer.js";
import db from "../config/turso.js";

dotenv.config();
const TOKEN_EXPIRY_MS = 15 * 60 * 1000;
const GENERIC_MESSAGE = "Enlace de recuperación enviado";

//-------Recuperar Contraseña
export const recuperarPassword = async (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== "string" || !email.trim()) {
    return res.status(400).json({ message: "El correo es obligatorio." });
  }

  const correo = email.trim().toLowerCase();

  try {
    const results = await db.execute({
      sql: "SELECT id_usuario FROM usuarios WHERE email = ? LIMIT 1",
      args: [correo],
    });
    const rows = results.rows || [];
    if (rows.length === 0) {
      return res.status(200).json({ message: GENERIC_MESSAGE });
    }
    const id_usuario = rows[0].id_usuario;

    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenExpires = new Date(Date.now() + TOKEN_EXPIRY_MS).toISOString();

    await db.execute({
      sql: "UPDATE usuarios SET reset_token = ?, token_expires = ? WHERE id_usuario = ?",
      args: [resetToken, tokenExpires, id_usuario],
    });

    const frontendUrl = env("FRONTEND_URL") || "http://localhost:5173";
    const resetLink = `${frontendUrl}/nueva-password?token=${resetToken}`;

    try {
      await sendPasswordResetEmail(correo, resetLink);
    } catch (mailError) {
      console.error(
        "[recuperar-password] Error al enviar correo:",
        mailError.message,
      );
      await db.execute({
        sql: "UPDATE usuarios SET reset_token = '', token_expires = '' WHERE id_usuario = ?",
        args: [id_usuario],
      });
      return res.status(500).json({
        message:
          "No se pudo enviar el correo. Verifica SMTP en .env e intenta de nuevo.",
      });
    }
    res.status(200).json({ message: GENERIC_MESSAGE });
  } catch (e) {
    console.error("Error en recuperar-password:", e);
    res.status(500).json({
      message: "No se pudo procesar la solicitud. Intenta más tarde.",
    });
  }
};

export const validarToken = async (req, res) => {
  const { token } = req.query;

  if (!token || typeof token !== "string") {
    return res.status(400).json({ valid: false, message: "Token requerido." });
  }

  try {
    const results = await db.execute({
      sql: "SELECT token_expires FROM usuarios WHERE reset_token = ? AND reset_token <> '' LIMIT 1",
      args: [token],
    });
    const rows = results.rows || [];
    if (rows.length === 0) {
      return res
        .status(400)
        .json({ valid: false, message: "Enlace inválido o expirado." });
    }
    const expiresAt = new Date(rows[0].token_expires);
    if (isNaN(expiresAt.getTime()) || expiresAt < new Date()) {
      return res
        .status(400)
        .json({ valid: false, message: "Enlace inválido o expirado." });
    }
    res.status(200).json({ valid: true });
  } catch (e) {
    console.error("Error en validar-token:", e);
    res
      .status(500)
      .json({ valid: false, message: "Error al validar el enlace." });
  }
};

export const restablecerPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res
      .status(400)
      .json({ message: "Token y contraseña son obligatorios." });
  }

  if (typeof password !== "string" || password.length < 6) {
    return res
      .status(400)
      .json({ message: "La contraseña debe tener al menos 6 caracteres." });
  }

  try {
    const results = await db.execute({
      sql: "SELECT id_usuario, token_expires FROM usuarios WHERE reset_token = ? AND reset_token <> '' LIMIT 1",
      args: [token],
    });
    const rows = results.rows || [];
    if (rows.length === 0) {
      return res.status(400).json({ message: "Enlace inválido o expirado." });
    }
    const expiresAt = new Date(rows[0].token_expires);
    if (isNaN(expiresAt.getTime()) || expiresAt < new Date()) {
      return res.status(400).json({ message: "Enlace inválido o expirado." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.execute({
      sql: "UPDATE usuarios SET password = ?, reset_token = '', token_expires = '' WHERE id_usuario = ?",
      args: [hashedPassword, rows[0].id_usuario],
    });
    res.status(200).json({
      message:
        "Contraseña actualizada correctamente. Ya puedes iniciar sesión.",
    });
  } catch (e) {
    console.error("Error en restablecer-password:", e);
    res.status(500).json({ message: "No se pudo actualizar la contraseña." });
  }
};

//---------Login
const normalizeRole = (rol) => {
  if (!rol) return "cashier";

  const roleMap = {
    administrador: "admin",
    admin: "admin",
    cajero: "cashier",
    cashier: "cashier",
    cocinero: "chef",
    chef: "chef",
    pizzero: "chef",
    mesero: "mesero",
    waiter: "waiter",
    despachador: "despachador",
    cashierdelivery: "cashierdelivery",
    "caja delivery": "cashierdelivery",
    "cajero delivery": "cashierdelivery",
  };

  const normalized = String(rol).trim().toLowerCase();
  return roleMap[normalized] || normalized;
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const query = `
      SELECT u.*, s.sucursal, s.id_sucursal
      FROM usuarios u
      LEFT JOIN sucursal s ON u.id_sucursal = s.id_sucursal
      WHERE u.email = ?`;
    const results = await db.execute({ sql: query, args: [email] });

    const rows = results.rows || [];
    // Usamos un mensaje genérico para seguridad
    if (rows.length === 0) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const usuario = rows[0];
    const match = await bcrypt.compare(password, usuario.password);

    if (!match) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }
    if (usuario.estado !== "Activo") {
      return res
        .status(403)
        .json({ message: "El usuario no se encuentra activo" });
    }

    // 12 horas de expiración (43200 segundos)
    const token = jwt.sign(
      {
        id: usuario.id_usuario,
        rol: usuario.rol,
        sucursal: usuario.sucursal,
        email: usuario.email,
        id_sucursal: usuario.id_sucursal,
      },
      process.env.JWT_SECRET,
      { expiresIn: "12h" },
    );

    res.cookie("acceso_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 12 * 60 * 60 * 1000,
    });

    const userPayload = {
      id: usuario.id_usuario,
      id_login: usuario.id_usuario,
      email: usuario.email,
      rol: usuario.rol,
      role: normalizeRole(usuario.rol),
      nombre: usuario.nombre_completo || usuario.email,
      sucursal: usuario.sucursal,
      estado: usuario.estado,
      id_sucursal: usuario.id_sucursal,
    };

    return res.status(200).json({
      message: "Login exitoso",
      token,
      user: userPayload,
    });
  } catch (error) {
    console.error("Error en login:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const logout = async (req, res) => {
  res.clearCookie("acceso_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  return res.status(200).json({ message: "Sesión cerrada con éxito" });
};
