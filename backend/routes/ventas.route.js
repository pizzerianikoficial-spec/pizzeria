import { Router } from "express";
import {
  procesarVenta,
  registrarPedidoPendiente,
  completarVentaPendiente,
  editarVenta,
  obtenerMetodosPago,
  obtenerVentasHoy,
  obtenerPedidosActivos,
  obtenerTasaExterna,
  actualizarTasaDesdeApi,
  obtenerRegistro,
  obtenerTasaDesdeBD,
  editarYAnclarTasa,
  desanclarTasa,
  reembolsarVenta,
} from "../controllers/ventas.controller.js";
import verificarToken from "../middleware/verificarToken.js";
import esAdmin from "../middleware/esAdmin.js";

const router = Router();

router.post("/procesar-venta", verificarToken, procesarVenta);
router.post(
  "/registrar-pedido-pendiente",
  verificarToken,
  registrarPedidoPendiente,
);

router.post("/completar-venta-pendiente/:id_venta", completarVentaPendiente);
router.put("/editar-venta", editarVenta);
router.put("/reembolsar-venta", verificarToken, reembolsarVenta);
router.get("/metodos-pagos", obtenerMetodosPago);

router.get("/obtener-ventas-hoy", verificarToken, obtenerVentasHoy);
router.get("/obtener-pedidos-activos", verificarToken, obtenerPedidosActivos);
router.get("/tasa", obtenerTasaDesdeBD);
router.put("/tasa/anclar", verificarToken, esAdmin, editarYAnclarTasa);
router.put("/tasa/desanclar", verificarToken, esAdmin, desanclarTasa);

export default router;
