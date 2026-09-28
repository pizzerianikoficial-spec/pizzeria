import { Router } from "express";
import { upload } from "../middleware/upload.middleware.js";
import {
  obtenerCategoriasPizza,
  obtenerPizzasActivas,
  obtenerBebidasActivas,
  obtenerCombos,
  crearCombo,
  actualizarCombo,
  eliminarCombo,
} from "../controllers/combos.controller.js";
import verificarToken from "../middleware/verificarToken.js";
import esAdmin from "../middleware/esAdmin.js";

const router = Router();

// ── Recursos auxiliares para el formulario de combo ─────────────────────
router.get("/categorias-pizza", obtenerCategoriasPizza);
router.get("/pizzas/activas", obtenerPizzasActivas);
router.get("/bebidas/activas", obtenerBebidasActivas);

// ── CRUD de Combos ───────────────────────────────────────────────────────
router.get("/combos", obtenerCombos);

router.post(
  "/combos",
  upload.single("imagen"),
  verificarToken,
  esAdmin,
  crearCombo,
);

router.put(
  "/combos/:id",
  upload.single("imagen"),
  verificarToken,
  esAdmin,
  actualizarCombo,
);

router.delete(
  "/combos/:id",
  verificarToken,
  esAdmin,
  eliminarCombo,
);

export default router;
