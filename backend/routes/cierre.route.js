import { Router } from "express";
import {
  cerrarCaja,
  obtenerResumenDia,
  verificarPedidosPendientes,
  verificarCierrePendiente,
  obtenerHistorialCierres,
  obtenerCajeros,
  actualizarPinCajero,
  enviarCierreEmail,
} from "../controllers/cierre.controller.js";
import verificarToken from "../middleware/verificarToken.js";
import esAdmin from "../middleware/esAdmin.js";
import esCajero from "../middleware/esCajero.js";

const router = Router();

router.get("/cierre/resumen-dia", verificarToken, obtenerResumenDia);
router.get(
  "/cierre/pedidos-pendientes",
  verificarToken,
  verificarPedidosPendientes,
);
router.get("/cierre/pendiente", verificarToken, verificarCierrePendiente);
router.get("/cierre/historial", obtenerHistorialCierres);
router.get("/cierre/cajeros", obtenerCajeros);
router.put("/cierre/cajero-pin", verificarToken, esAdmin, actualizarPinCajero);
router.post("/cierre-caja", verificarToken, esCajero, cerrarCaja);
router.post("/cierre/enviar-email", verificarToken, esCajero, enviarCierreEmail);

export default router;
