import { Router } from "express";
import {
  recuperarPassword,
  validarToken,
  restablecerPassword,
  login,
  logout,
} from "../controllers/autenticacion.controller.js";

const router = Router();

router.post("/recuperar-password", recuperarPassword);
router.get("/validar-token", validarToken);
router.post("/restablecer-password", restablecerPassword);

router.post("/login", login);
router.post("/logout", logout);

export default router;
