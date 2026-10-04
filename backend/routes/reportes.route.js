import { Router } from "express";
import {
  obtenerSucursalesReporte,
  obtenerResumenReporte,
  obtenerPagosReporte,
  obtenerTendenciaReporte,
  obtenerTopProductosReporte,
  obtenerDespachosReporte,
} from "../controllers/reportes.controller.js";

const router = Router();

router.get("/reportes/sucursales", obtenerSucursalesReporte);
router.get("/reportes/resumen", obtenerResumenReporte);
router.get("/reportes/pagos", obtenerPagosReporte);
router.get("/reportes/tendencia", obtenerTendenciaReporte);
router.get("/reportes/top-productos", obtenerTopProductosReporte);
router.get("/reportes/despachos", obtenerDespachosReporte);

export default router;
