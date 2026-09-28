import { useNavigate, useLocation } from "react-router-dom";
import { Lock, ShieldAlert, ArrowRight } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useVerificarCierre } from "../../hooks/useVerificarCierre";

export default function ModalBloqueoCierre() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { currentUser } = useApp();
  const { data } = useVerificarCierre();

  const esCajero = currentUser?.role === "cashier";
  const esDelivery = currentUser?.role === "cashierdelivery";
  const rutaCierre = esDelivery ? "/cierre-delivery" : "/cierre";

  const pendienteBloqueo = esDelivery
    ? Boolean(data?.pendiente_delivery)
    : Boolean(data?.pendiente);

  // Solo bloquea a cajero/cashierDelivery, nunca sobre la pantalla de cierre que lo desbloquea.
  if (
    (!esCajero && !esDelivery) ||
    pathname === rutaCierre ||
    !pendienteBloqueo
  ) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/95 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white px-6 py-8 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <Lock className="h-8 w-8 text-red-600" />
        </div>

        <h2 className="mt-5 text-xl font-black text-slate-900">
          Cierre de caja pendiente
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Existe un {esDelivery ? "cierre delivery " : ""}cierre de caja
          pendiente del día de negocio anterior. Para continuar operando es
          obligatorio realizar el cierre antes de iniciar la jornada.
        </p>

        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-left">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-xs leading-relaxed text-amber-800">
            El sistema permanecerá bloqueado hasta que se complete el cierre
            de caja correspondiente.
          </p>
        </div>

        <button
          onClick={() => navigate(rutaCierre)}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Ir a Cierre {esDelivery ? "de Delivery" : "de Caja"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}