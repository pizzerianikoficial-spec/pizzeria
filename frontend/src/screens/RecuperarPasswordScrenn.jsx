import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CloseButton } from "../components/ui/ButtonClose";
import axios from "axios";
import { toast } from "react-hot-toast";
import logoImg from "../assets/login/logo.png";
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

const API_URL = "http://localhost:3001/api";

export default function RecuperarPasswordScreen() {
const navigate = useNavigate();
const [email, setEmail] = useState("");
const [loading, setLoading] = useState(false);
const [message, setMessage] = useState("");
const [error, setError] = useState("");

const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const peticionCorreo = axios.post(`${API_URL}/recuperar-password`, { email });

    toast.promise(peticionCorreo, {
    loading: "Enviando correo de recuperación...",
    success: (response) => {
        setEmail("");
        setLoading(false);
        setTimeout(() => navigate("/login"), 2500);
        return response.data.message || "Correo de recuperación enviado con éxito.";
    },
    error: (err) => {
        setLoading(false);
        return err.response?.data?.message ||
        "Error al enviar el correo de recuperación. Intenta más tarde."
    }
    });
};

const handleClose = () => {
    navigate("/login");
};

return (
    <div className="flex min-h-screen w-full items-center justify-center bg-pizza-gray-1 p-2">
        <div className="w-full max-w-md flex flex-col items-center">
        <div className="flex flex-col items-center w-full px-4 mb-2">
        <img
            src={logoImg}
            alt="Pizza Logo"
            className="w-40 h-40 md:w-56 md:h-56 object-contain select-none"
        />
        </div>
        <div className="bg-white rounded-2xl shadow-card border-t-4 border-pizza-red border-x border-b border-pizza-gray-3 p-6 md:p-8 w-full">
            <CloseButton size="lg" theme="light" onClick={handleClose} />
            <div className="text-center mb-10 flex flex-col items-center">
            <h1 className="text-2xl font-bold text-pizza-dark text-center mb-1">
                Bienvenido de nuevo
            </h1>
            <p className="text-pizza-muted text-sm text-center mb-6">
                Ingresa tu correo electrónico para recuperar tu contraseña.
            </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            <div>
                <label
                className="block text-sm font-semibold text-pizza-dark mb-1.5"
                htmlFor="email"
                >
                Correo electrónico
                </label>
                <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pizza-muted" />
                </div>
                <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-10"
                    placeholder="ejemplo@pizzeria.com"
                />
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 mt-3 text-base flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {loading ? "Enviando..." : "Enviar código"}
            </button>
            </form>
        </div>
        </div>
    </div>
);
}
