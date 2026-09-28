import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const verificarToken = (req, res, next) => {
  const token = req.cookies.acceso_token;

  if (!token) {
    return res.status(401).json({ message: "No autorizado, sesión expirada" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Error al verificar token:", error.message);
    return res.status(401).json({ message: "Token inválido" });
  }
};

export default verificarToken;
