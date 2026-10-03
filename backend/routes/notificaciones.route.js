import { Router } from "express";
import {
  obtenerNotificacionPendiente,
  obtenerNotificacionesPendientes,
  mandarNotificacionAlHorno,
} from "../controllers/notificaciones.controller.js";
import verificarToken from "../middleware/verificarToken.js";

const router = Router();

router.get("/notificaciones-pendientes", obtenerNotificacionesPendientes);
router.get(
  "/notificaciones-pendientes/:id_venta",
  obtenerNotificacionPendiente,
);
router.post(
  "/notificaciones-pendientes/:id_venta/mandar-al-horno",
  verificarToken,
  mandarNotificacionAlHorno,
);

export default router;
