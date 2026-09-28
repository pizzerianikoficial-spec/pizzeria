import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
//import { FiLock } from "react-icons/fi";
//import { CloseButton } from "../components/ui/button-close";
import axios from "axios";
import {toast} from "react-hot-toast";
import logoImg from "../assets/login/logo.png";
import {Lock, Eye, EyeOff} from "lucide-react";

const API_URL = "http://localhost:3001/api";

export default function NuevaPasswordScreen() {
const navigate = useNavigate();
const [searchParams] = useSearchParams();
const token = searchParams.get("token");

const [password, setPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [tokenValid, setTokenValid] = useState(null);
const [loading, setLoading] = useState(false);
const [message, setMessage] = useState("");
const [error, setError] = useState("");
const [showPassword, setShowPassword] = useState(false);

useEffect(() => {
    if (!token) {
    setTokenValid(false);
    setError("Enlace inválido. Solicita un nuevo correo de recuperación.");
    return;
    }

    const validarToken = async () => {
    try {
        const response = await axios.get(`${API_URL}/validar-token`, {
        params: { token },
        });
        setTokenValid(response.data.valid === true);
    } catch {
        setTokenValid(false);
        setError("Enlace inválido o expirado. Solicita un nuevo correo.");
    }
    };

    validarToken();
}, [token]);

const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
    toast.error("Las contraseñas no coinciden.");
    setError("Las contraseñas no coinciden.");
    return;
    }

    if (password.length < 6) {
    toast.error("La contraseña debe tener al menos 6 caracteres.");
    setError("La contraseña debe tener al menos 6 caracteres.");
    return;
    }

    setLoading(true);

    const peticionRestablecer = axios.post(`${API_URL}/restablecer-password`, {
    token,
    password,
    });
    toast.promise(peticionRestablecer, {
    loading: "Actualizando contraseña...",
    success: (response) => {
        setLoading(false);
        setPassword("");
        setConfirmPassword("");
        setTimeout(() => navigate("/login"), 2500);

        return response.data.message || "Contraseña actualizada con éxito.";
    },
    error: (err) => {
        setLoading(false);
        return (
        err.response?.data?.message ||
        "No se pudo actualizar la contraseña. Intenta de nuevo."
        );
    },
    });
};

const handleClose = () => {
    navigate("/login");
};

if (tokenValid === null) {
    return (
    <div className="flex min-h-screen w-full items-center justify-center bg-pizza-gray-2 p-6">
        <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-card border-t-4 border-pizza-red border-x border-b border-pizza-gray-3 p-6 md:p-8 w-full text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-pizza-gray-3 border-t-pizza-red" />

            <h2 className="text-lg font-bold text-pizza-dark">
            Validando enlace...
            </h2>
        </div>
        </div>
    </div>
    );
}

return (
    <div className="flex min-h-screen w-full items-center justify-center bg-pizza-gray-2 p-1">
        <div className="w-full max-w-md flex flex-col items-center">
        <div className="flex flex-col items-center w-full px-4 mb-2">
        <img
            src={logoImg}
            alt="Pizza Logo"
            className="w-40 h-40 md:w-56 md:h-56 object-contain select-none"
        />
        </div>
        <div className="bg-white rounded-2xl shadow-card border-t-4 border-pizza-red border-x border-b border-pizza-gray-3 p-6 md:p-8 w-full">
            <div className="text-center mb-10 flex flex-col items-center">
            <h1 className="text-2xl font-bold text-pizza-dark text-center mb-1">
                Nueva contraseña
            </h1>
            <p className="text-pizza-muted text-sm text-center mb-6">
                Ingresa y confirma tu nueva contraseña.
            </p>
            </div>

            {tokenValid === false ? (
            <div className="w-full flex flex-col gap-4">
                <p className="text-sm text-red-600 text-center">{error}</p>
                <button
                type="button"
                onClick={() => navigate("/recuperar-password")}
                className="btn-primary w-full py-3 mt-1 text-base flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 transition-all"
                >
                Solicitar nuevo enlace
                </button>
            </div>
            ) : (
            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
                <div>
                <label
                    className="block text-sm font-semibold text-pizza-dark mb-1.5"
                    htmlFor="password"
                >
                    Nueva contraseña
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pizza-muted" />
                    </div>
                    <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-10 pr-10"
                    placeholder="••••••••"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pizza-muted hover:text-pizza-dark transition-colors"
                    >
                        {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                        ) : (
                        <Eye className="h-4 w-4" />
                        )}
                    </button>
                    </div>
                </div>
                </div>

                <div>
                <label
                    className="block text-sm font-semibold text-pizza-dark mb-1.5"
                    htmlFor="confirmPassword"
                >
                    Confirmar contraseña
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pizza-muted" />
                    </div>
                    <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field pl-10 pr-10"
                    placeholder="••••••••"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pizza-muted hover:text-pizza-dark transition-colors"
                    >
                        {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                        ) : (
                        <Eye className="h-4 w-4" />
                        )}
                    </button>
                    </div>
                </div>
                </div>

                <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 mt-3 text-base flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                {loading ? "Guardando..." : "Restablecer contraseña"}
                </button>
            </form>
            )}
        </div>
        </div>
    </div>
);
}
