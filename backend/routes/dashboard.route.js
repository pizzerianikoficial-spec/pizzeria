import { Router } from "express";
import { obtenerDashboardStats } from "../controllers/dashboard.controller.js";

const router = Router();

router.get("/dashboard/stats", obtenerDashboardStats);

export default router;
