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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useApp();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError("");

    if (!email.trim()) {
      setError("Por favor, ingresa tu correo electrónico");
      return;
    }

    if (!password.trim()) {
      setError("Por favor, ingresa tu contraseña");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(email.trim(), password);
      if (!result.success) {
        setError(result.message);
      }
    } finally {
      setIsSubmitting(false);
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
    <div className="app-viewport w-full overflow-hidden grid grid-cols-1 md:grid-cols-2 bg-pizza-gray-2">
      {/* ───────── Columna Izquierda: Formulario ───────── */}
      <div className="h-full w-full overflow-x-hidden overflow-y-auto bg-white">
        <div className="min-h-full w-full flex items-center justify-center px-4 py-4 sm:px-8 sm:py-6 lg:px-12">
          <div className="w-full max-w-md flex flex-col items-center gap-3 sm:gap-4">
            {/* Logo: crece con el alto disponible, pero con tope */}
            <div className="w-full max-w-[min(22rem,70dvh)] aspect-[7/2] overflow-hidden shrink-0">
              <img
                src={logoImg}
                alt="Pizzería Nico"
                className="w-full h-full object-cover object-center select-none"
                draggable="false"
              />
            </div>

            {/* Tarjeta del formulario (borde superior rojo) */}
            <div className="bg-white rounded-2xl shadow-card border-t-4 border-pizza-red border-x border-b border-pizza-gray-3 p-5 sm:p-6 lg:p-8 w-full">
              <h2 className="text-xl sm:text-2xl font-bold text-pizza-dark text-center mb-1">
                Bienvenido de vuelta
              </h2>
              <p className="text-pizza-muted text-sm text-center mb-5 sm:mb-6">
                Ingresa tus credenciales para acceder a tu área de trabajo.
              </p>

              <form
                onSubmit={handleSubmit}
                noValidate
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
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pizza-muted pointer-events-none" />
                    <input
                      id="email"
                      type="email"
                      inputMode="email"
                      autoComplete="username"
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder="ejemplo@pizzeria.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      // text-base en móvil evita el zoom automático de iOS al enfocar
                      className="input-field pl-10 py-2.5 text-base sm:text-sm"
                    />
                  </div>
                </div>

                {/* Campo de Contraseña */}
                <div>
                  <div className="flex flex-wrap justify-between items-center gap-x-2 mb-1.5">
                    <label
                      className="block text-sm font-semibold text-pizza-dark"
                      htmlFor="password"
                    >
                      Contraseña
                    </label>
                    <a
                      href="/recuperar-password"
                      className="text-xs font-semibold text-pizza-red hover:underline py-1"
                    >
                      ¿Olvidaste tu contraseña?
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pizza-muted pointer-events-none" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field pl-10 pr-11 py-2.5 text-base sm:text-sm"
                    />
                    {/* Área táctil de 32px (antes 16px) */}
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={
                        showPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-md text-pizza-muted hover:text-pizza-dark transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 break-words"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isSubmitting ? "Ingresando..." : "Iniciar Sesión"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ───────── Columna Derecha: Portada (oculta < 768px) ───────── */}
      <div className="hidden md:flex relative h-full w-full overflow-hidden bg-pizza-dark text-white items-end p-10 lg:p-14">
        {/* La imagen ocupa todo el panel y queda centrada */}
        <img
          src={coverImg}
          alt="Pizzería Portada"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-75 select-none pointer-events-none"
          draggable="false"
        />
        {/* Overlay gradiente oscuro */}
        <div className="absolute inset-0 bg-gradient-to-t from-pizza-dark via-pizza-dark/40 to-transparent z-10" />

        {/* Texto sobre la portada */}
        <div className="relative z-20 max-w-lg">
          <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider mb-3 border border-white/20 animate-pulse-red">
            Pizzeria Nico
          </span>
          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-extrabold leading-tight mb-3 drop-shadow-md">
            Las mejores Pizzas de la Ciudad.
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
