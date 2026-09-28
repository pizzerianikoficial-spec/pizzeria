import { Router } from "express";

import {
  obtenerClientes,
  registrarClientes,
  editarCliente,
  buscarClientes,
  buscarORegistrarClienteDelivery,
  actualizarAliasCliente,
} from "../controllers/clientes.controller.js";
import verificarToken from "../middleware/verificarToken.js";
import esAdmin from "../middleware/esAdmin.js";

const router = Router();

router.get("/buscar-clientes", buscarClientes);
router.post(
  "/buscar-o-registrar-cliente-delivery",
  buscarORegistrarClienteDelivery,
);
router.put("/clientes/:id/alias", actualizarAliasCliente);
router.get("/obtener-clientes", obtenerClientes);
router.post("/registrar-clientes", registrarClientes);
router.put("/editar-cliente/:id", verificarToken, esAdmin, editarCliente);

export default router;
