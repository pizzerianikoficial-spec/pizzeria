import "./config/env.js";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import productos from "./routes/productos.route.js";
import ventas from "./routes/ventas.route.js";
import pedidos from "./routes/pedidos.route.js";
import usuarios from "./routes/usuarios.route.js";
import { getTransporter } from "./config/mailer.js";
import autenticacion from "./routes/autenticacion.route.js";
import cierre from "./routes/cierre.route.js";
import clientes from "./routes/clientes.route.js";
import notificaciones from "./routes/notificaciones.route.js";
import sucursales from "./routes/sucursal.route.js";
import pusherRoutes from "./routes/pusher.route.js";
import reportes from "./routes/reportes.route.js";
import combos from "./routes/combos.route.js";
import dashboardRoutes from "./routes/dashboard.route.js";

if (!process.env.JWT_SECRET) {
  console.error(
    "[app] Falta JWT_SECRET en las variables de entorno. Plantéalo en Vercel antes de publicar.",
  );
  throw new Error(
    "Configuración incompleta: JWT_SECRET es obligatoria para firmar sesiones.",
  );
}

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Disposition"],
  }),
);
app.use(express.json({ limit: "4mb" }));
app.use(express.urlencoded({ extended: true, limit: "4mb" }));
app.use(cookieParser());

// Rutas
app.use("/api", productos);
app.use("/api", ventas);
app.use("/api", usuarios);
app.use("/api", pedidos);
app.use("/api", autenticacion);
app.use("/api", cierre);
app.use("/api", clientes);
app.use("/api", notificaciones);
app.use("/api", sucursales);
app.use("/api", pusherRoutes);
app.use("/api", reportes);
app.use("/api", combos);
app.use("/api", dashboardRoutes);

// 404 para /api
app.use("/api", (req, res) =>
  res.status(404).json({ message: "Ruta no encontrada" }),
);

// Manejo central de errores (body demasiado grande, multer, etc.)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err && err.type === "entity.too.large") {
    return res.status(413).json({
      message: "La solicitud excede el tamaño máximo permitido (4 MB).",
    });
  }
  if (err && err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      message: "La imagen excede el tamaño máximo permitido (4 MB).",
    });
  }
  console.error("Error no controlado:", err);
  return res.status(500).json({ message: "Error interno del servidor" });
});

if (process.env.VERCEL !== "1") {
  const port = Number(process.env.PORT) || 3001;
  app.listen(port, () => {
    console.log("Escuchandoo, oh oh");
  });
}

export default app;