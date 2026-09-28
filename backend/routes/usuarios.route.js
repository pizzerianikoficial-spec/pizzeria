import { Router } from "express";

import {
  buscarDelivery,
  registrarDelivery,
  registrarUsuario,
  obtenerUsuarios,
  eliminarUsuario,
  actualizarUsuario,
  activarUsuario,
} from "../controllers/usuarios.controller.js";
import verificarToken from "../middleware/verificarToken.js";
import esAdmin from "../middleware/esAdmin.js";

const router = Router();

router.get("/buscar-delivery", buscarDelivery);
router.post("/registrar-delivery", registrarDelivery);

router.post("/registrar-usuario", verificarToken, esAdmin, registrarUsuario);
router.get("/usuarios", obtenerUsuarios);
router.put("/actualizar-usuario/:id", verificarToken, esAdmin, actualizarUsuario);
router.put("/eliminar-usuario/:id", verificarToken, esAdmin, eliminarUsuario);
router.put("/activar-usuario/:id", verificarToken, esAdmin, activarUsuario);

export default router;
