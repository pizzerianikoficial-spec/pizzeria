export const PIZZAS_EXTRAS_GRATIS = ["4 estaciones", "pizza gigante"];

const normalizar = (nombre) =>
  String(nombre || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

export const tieneExtrasGratis = (nombreProducto) =>
  PIZZAS_EXTRAS_GRATIS.includes(normalizar(nombreProducto));
