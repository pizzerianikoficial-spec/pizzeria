import express from "express";
import pool from "./config/bd.js";
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

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Disposition"],
  }),
);
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));
app.use(cookieParser());

// Rutitas
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

app.listen(3001, () => {
  console.log("Escuchandoo, oh oh");
});
