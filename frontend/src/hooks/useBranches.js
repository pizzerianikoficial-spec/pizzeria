import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useApp } from "../context/AppContext";

const API_BASE = "http://localhost:3001/api";

/**
 * Sucursales de la pizzería, cargadas de forma diferida.
 */
export function useBranches() {
  const { currentUser } = useApp();
  return useQuery({
    queryKey: ["branches"],
    staleTime: 60_000,
    enabled: !!currentUser,
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE}/sucursales`);
      const rows = data?.success ? data.data || [] : [];
      return rows.map((branch) => ({
        id: branch.id_sucursal ?? branch.id,
        name: branch.sucursal ?? branch.name,
        address: branch.direccion ?? branch.address,
        userCount: Number(branch.userCount ?? 0),
      }));
    },
  });
}

const normalizeRole = (role) => {
  if (!role) return "cashier";

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

/**
 * Personal (usuarios) cargado de forma diferida, con roles normalizados.
 */
export function useStaff() {
  const { currentUser } = useApp();
  return useQuery({
    queryKey: ["staff"],
    staleTime: 60_000,
    enabled: !!currentUser,
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE}/usuarios`);
      const rows = data?.success ? data.data || [] : [];
      return rows.map((user) => ({
        id: user.id_usuario ?? user.id,
        name: user.nombre_completo ?? user.name,
        email: user.email,
        branchId: user.id_sucursal ?? user.branchId,
        role: normalizeRole(user.role ?? user.rol),
        estado: user.estado ?? "Activo",
      }));
    },
  });
}
