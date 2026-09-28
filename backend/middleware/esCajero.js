export default function esCajero(req, res, next) {
  const rol = String(req.user?.rol || "").toLowerCase().trim();
  if (
    rol !== "cashier" &&
    rol !== "cashierdelivery" &&
    rol !== "caja delivery" &&
    rol !== "cajero delivery"
  ) {
    return res
      .status(403)
      .json({ message: "Acceso denegado. Requiere ser Cajero." });
  }
  next();
}
