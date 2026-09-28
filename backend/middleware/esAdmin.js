export default function esAdmin(req, res, next) {
  if (req.user.rol !== "admin") {
    return res
      .status(403)
      .json({ message: "Acceso denegado. Requiere ser Administrador." });
  }
  next();
}
