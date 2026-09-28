import { Router } from "express";
import { autorizarPusher } from "../controllers/pusher.controller.js";
import verificarToken from "../middleware/verificarToken.js";

const router = Router();
router.post("/pusher/auth", verificarToken, autorizarPusher);
export default router;
