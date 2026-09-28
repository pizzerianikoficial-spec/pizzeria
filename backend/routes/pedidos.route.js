import { Router } from "express";
import {
  obtenerPedidosCocina,
  obtenerPedidosHorno,
  obtenerPedidosDespacho,
  obtenerPedidosMesero,
  obtenerPedidosPendiente,
  obtenerContadorCajero,
  actualizarEstadoPedido,
  obtenerEntregas,
  actualizarEntrega,
} from "../controllers/pedidos.controller.js";
import verificarToken from "../middleware/verificarToken.js";
import esCajero from "../middleware/esCajero.js";

const router = Router();

router.get("/obtener-pedidos-cocina", verificarToken, obtenerPedidosCocina);
router.get("/obtener-pedidos-horno", verificarToken, obtenerPedidosHorno);
router.get("/obtener-pedidos-despacho", verificarToken, obtenerPedidosDespacho);
router.get("/obtener-pedidos-mesero", verificarToken, obtenerPedidosMesero);
router.get("/obtener-pedidos-pendiente", verificarToken, obtenerPedidosPendiente);
router.get("/obtener-contador-cajero", verificarToken, obtenerContadorCajero);
router.put(
  "/actualizar-estado-pedido/:id_venta",
  verificarToken,
  actualizarEstadoPedido,
);
router.get("/entregas", verificarToken, obtenerEntregas);
router.put(
  "/entregas/:id_venta/completar",
  verificarToken,
  esCajero,
  actualizarEntrega,
);

export default router;
