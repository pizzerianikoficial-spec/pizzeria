import { pusher } from "../config/pusher.js";

const normalizePusherRole = (role) => {
  if (!role) return null;

  const roleMap = {
    administrador: "admin",
    admin: "admin",
    cajero: "cashier",
    cashier: "cashier",
    cocinero: "chef",
    chef: "chef",
    pizzero: "chef",
    mesero: "mesero",
    waiter: "waiter",
    despachador: "despachador",
    cashierdelivery: "cashierdelivery",
    "caja delivery": "cashierdelivery",
    "cajero delivery": "cashierdelivery",
  };

  const normalized = String(role).trim().toLowerCase();
  return roleMap[normalized] || normalized;
};

const CHANNEL_ROLE_ACCESS = {
  "private-pizzeria-kitchen": [
    "admin",
    "chef",
    "cashier",
    "cashierdelivery",
    "caja delivery",
    "cajero delivery",
  ],
  "private-pizzeria-orders": [
    "admin",
    "cashier",
    "cashierdelivery",
    "caja delivery",
    "cajero delivery",
    "chef",
    "mesero",
    "despachador",
    "waiter",
  ],
  "private-pizzeria-notifications": [
    "admin",
    "cashier",
    "cashierdelivery",
    "caja delivery",
    "cajero delivery",
  ],
  "private-pizzeria-sales": [
    "admin",
    "cashier",
    "cashierdelivery",
    "caja delivery",
    "cajero delivery",
  ],
};

export const autorizarPusher = async (req, res) => {
  const { socket_id, channel_name } = req.body || {};

  if (!socket_id || !channel_name) {
    return res
      .status(400)
      .json({ error: "socket_id y channel_name son requeridos." });
  }

  const normalizedChannel = channel_name.startsWith("private-")
    ? channel_name
    : `private-${channel_name}`;

  const allowedRoles = CHANNEL_ROLE_ACCESS[normalizedChannel];

  if (!allowedRoles) {
    return res.status(403).json({ error: "Canal no autorizado." });
  }

  const userRole = normalizePusherRole(req.user?.rol || req.user?.role);

  if (!userRole || !allowedRoles.includes(userRole)) {
    return res
      .status(403)
      .json({ error: "Usuario sin permisos para este canal." });
  }

  if (!pusher) {
    return res.status(500).json({ error: "Pusher no configurado." });
  }

  const auth = pusher.authorizeChannel(socket_id, normalizedChannel, {
    user_id: String(
      req.user?.id ?? req.user?.id_usuario ?? req.user?.email ?? "anonymous",
    ),
    user_info: {
      id: req.user?.id ?? req.user?.id_usuario ?? null,
      email: req.user?.email ?? null,
      role: userRole,
      name: req.user?.nombre ?? req.user?.email ?? null,
    },
  });

  return res.json(auth);
};
