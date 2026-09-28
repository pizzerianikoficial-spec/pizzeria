import { Router } from "express";
import {
  obtenerSucursalesReporte,
  obtenerResumenReporte,
  obtenerPagosReporte,
  obtenerTendenciaReporte,
  obtenerTopProductosReporte,
} from "../controllers/reportes.controller.js";

const router = Router();

router.get("/reportes/sucursales", obtenerSucursalesReporte);
router.get("/reportes/resumen", obtenerResumenReporte);
router.get("/reportes/pagos", obtenerPagosReporte);
router.get("/reportes/tendencia", obtenerTendenciaReporte);
router.get("/reportes/top-productos", obtenerTopProductosReporte);

export default router;
