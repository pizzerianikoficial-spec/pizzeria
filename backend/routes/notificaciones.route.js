import { Router } from "express";
import {
  obtenerNotificacionPendiente,
  obtenerNotificacionesPendientes,
} from "../controllers/notificaciones.controller.js";

const router = Router();

router.get("/notificaciones-pendientes", obtenerNotificacionesPendientes);
router.get(
  "/notificaciones-pendientes/:id_venta",
  obtenerNotificacionPendiente,
);

export default router;
