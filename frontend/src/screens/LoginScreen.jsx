import { useState } from "react";
import { useApp } from "../context/AppContext";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import logoImg from "../assets/login/logo.png";
import coverImg from "../assets/login/cover.png";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("123456"); // Dummy password for aesthetics
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { login } = useApp();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Por favor, ingresa tu correo electrónico");
      return;
    }

    if (!password.trim()) {
      setError("Por favor, ingresa tu contraseña");
      return;
    }

    const result = await login(email.trim(), password);
    if (!result.success) {
      setError(result.message);
    }
  };

  const handleDemoLogin = async (demoEmail) => {
    setEmail(demoEmail);
    setError("");
    const result = await login(demoEmail, password || "123456");
    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 h-screen w-full overflow-hidden bg-pizza-gray-2">
      {/* Columna Izquierda: Formulario de Login */}
      <div className="flex flex-col items-center justify-center p-6 md:p-12 lg:p-16 w-full bg-white h-full overflow-y-auto">
        <div className="w-full max-w-md flex flex-col items-center my-auto py-8">
          {/* Logo */}
          <div className="flex flex-col items-center -mt-8 -mb-12 w-full px-4">
            <img
              src={logoImg}
              alt="Pizza Logo"
              className="w-64 h-64 md:w-80 md:h-80 object-contain select-none"
            />
          </div>

          {/* Tarjeta del Formulario (con borde superior rojo) */}
          <div className="bg-white rounded-2xl shadow-card border-t-4 border-pizza-red border-x border-b border-pizza-gray-3 p-6 md:p-8 w-full">
            <h2 className="text-2xl font-bold text-pizza-dark text-center mb-1">
              Bienvenido de vuelta
            </h2>
            <p className="text-pizza-muted text-sm text-center mb-6">
              Ingresa tus credenciales para acceder a tu área de trabajo.
            </p>

            <form
              onSubmit={handleSubmit}
              className="w-full flex flex-col gap-4"
            >
              {/* Campo de Correo */}
              <div>
                <label
                  className="block text-sm font-semibold text-pizza-dark mb-1.5"
                  htmlFor="email"
                >
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pizza-muted" />
                  <input
                    id="email"
                    type="text"
                    placeholder="ejemplo@pizzeria.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-10"
                  />
                </div>
              </div>

              {/* Campo de Contraseña (Aesthetic Dummy Field) */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label
                    className="block text-sm font-semibold text-pizza-dark"
                    htmlFor="password"
                  >
                    Contraseña
                  </label>
                  <a
                    href="/recuperar-password"
                    className="text-xs font-semibold text-pizza-red hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pizza-muted" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pizza-muted hover:text-pizza-dark transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Recordarme Checkbox */}
              <div className="flex items-center mt-1">
                <input
                  id="remember-me"
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 text-pizza-red border-pizza-gray-3 rounded focus:ring-pizza-red focus:ring-offset-0 cursor-pointer"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 text-sm text-pizza-dark font-medium cursor-pointer select-none"
                >
                  Recordarme
                </label>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 mt-1">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="btn-primary w-full py-3 mt-3 text-base flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 transition-all"
              >
                Iniciar Sesión
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Columna Derecha: Portada (Oculta en móviles) */}
      <div className="hidden md:flex md:flex-col relative h-full w-full bg-pizza-dark text-white p-12 lg:p-16 justify-end overflow-hidden">
        {/* Imagen de Portada de Fondo */}
        <img
          src={coverImg}
          alt="Pizzería Portada"
          className="absolute inset-0 w-full h-full object-cover opacity-75 select-none pointer-events-none"
        />
        {/* Overlay gradiente oscuro */}
        <div className="absolute inset-0 bg-gradient-to-t from-pizza-dark via-pizza-dark/40 to-transparent z-10" />

        {/* Contenido en la portada */}
        <div className="relative z-20 max-w-lg">
          <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider mb-4 border border-white/20 animate-pulse-red">
            Pizzeria Nico
          </span>
          <h2 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-3 drop-shadow-md">
            La mejores Pizzas de la Ciudad.
          </h2>
          <p className="text-white/80 text-sm lg:text-base leading-relaxed drop-shadow-sm">
            Gestiona pedidos, controla los tiempos de cocina y administra el
            personal en un solo panel de control unificado.
          </p>
        </div>
      </div>
    </div>
  );
}
