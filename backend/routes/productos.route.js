import { Router } from "express";
import { upload } from "../middleware/upload.middleware.js";
import {
  obtenerPizzas,
  crearPizza,
  actualizarPizza,
  eliminarPizza,
  obtenerBebidas,
  crearBebida,
  actualizarBebida,
  eliminarBebida,
  obtenerHelados,
  crearHelado,
  actualizarHelado,
  eliminarHelado,
  obtenerExtras,
  crearExtra,
  actualizarExtra,
  eliminarExtra,
  obtenerCaja,
  actualizarCaja,
} from "../controllers/productos.controller.js";
import verificarToken from "../middleware/verificarToken.js";
import esAdmin from "../middleware/esAdmin.js";

const router = Router();

// Rutas de Pizzas
router.get("/pizzas", obtenerPizzas);
router.post(
  "/pizzas",
  upload.single("imagen"),
  verificarToken,
  esAdmin,
  crearPizza,
);
router.put(
  "/pizzas/:id",
  upload.single("imagen"),
  verificarToken,
  esAdmin,
  actualizarPizza,
);
router.put("/pizzas/:id/eliminar", verificarToken, esAdmin, eliminarPizza);

// Rutas de Bebidas
router.get("/bebidas", obtenerBebidas);
router.post(
  "/bebidas",
  upload.single("imagen"),
  verificarToken,
  esAdmin,
  crearBebida,
);
router.put(
  "/bebidas/:id",
  upload.single("imagen"),
  verificarToken,
  esAdmin,
  actualizarBebida,
);
router.put("/bebidas/:id/eliminar", verificarToken, esAdmin, eliminarBebida);

// Rutas de Heladería
router.get("/heladeria", obtenerHelados);
router.post("/heladeria", upload.single("imagen"), verificarToken, crearHelado);
router.put(
  "/heladeria/:id",
  upload.single("imagen"),
  verificarToken,
  esAdmin,
  actualizarHelado,
);
router.put("/heladeria/:id/eliminar", verificarToken, esAdmin, eliminarHelado);

// Rutas de Extras
router.get("/extras", obtenerExtras);
router.post("/extras", upload.none(), verificarToken, esAdmin, crearExtra);
router.put(
  "/extras/:id",
  upload.none(),
  verificarToken,
  esAdmin,
  actualizarExtra,
);
router.put("/extras/:id/eliminar", verificarToken, esAdmin, eliminarExtra);

// Rutas de Caja (empaque)
router.get("/caja", verificarToken, obtenerCaja);
router.put("/caja", verificarToken, esAdmin, actualizarCaja);

export default router;
