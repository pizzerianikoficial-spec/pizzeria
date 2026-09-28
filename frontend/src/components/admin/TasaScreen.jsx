import { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  LockKeyhole,
  RefreshCw,
  UnlockKeyhole,
  DollarSign,
} from "lucide-react";
import { useExchangeRate } from "../../hooks/useExchangeRate";

const API_BASE = "http://localhost:3001/api";

const getHeaderDate = () => {
  const date = new Date();
  const options = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  };
  const dateString = date.toLocaleDateString("es-ES", options);
  return dateString
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function TasaScreen() {
  const { updateExchangeRate } = useExchangeRate();
  const [rate, setRate] = useState(null);
  const [manualRate, setManualRate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const messageRef = useRef({ type: "", text: "" });

  const loadRate = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/tasa`, {
        withCredentials: true,
      });
      if (!data.success) throw new Error(data.message);
      setRate(data.data);
      setManualRate(String(data.data.tasa_sistema));
      updateExchangeRate(data.data.tasa_sistema);
    } catch (error) {
      messageRef.current = {
        type: "error",
        text: error.response?.data?.message || "No se pudo cargar la tasa.",
      };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRate();
  }, []);

  const handleAnchor = async (event) => {
    event.preventDefault();
    const value = Number(manualRate);
    if (!Number.isFinite(value) || value <= 0) {
      window.Toast.fire({
        icon: "error",
        title: "Ingresa una tasa mayor que cero.",
      });
      return;
    }
    setSaving(true);
    try {
      const { data } = await axios.put(`${API_BASE}/tasa/anclar`, {
        tasa_manual: value,
      }, {
        withCredentials: true,
      });
      setRate(data.data);
      updateExchangeRate(data.data.tasa_sistema);
      window.Toast.fire({
        icon: "success",
        title: "Tasa fijada y anclada correctamente.",
      });
    } catch (error) {
      window.Toast.fire({
        icon: "error",
        title: error.response?.data?.message || "No se pudo anclar la tasa.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUnanchor = async () => {
    setSaving(true);
    try {
      const { data } = await axios.put(
        `${API_BASE}/tasa/desanclar`,
        {},
        { withCredentials: true },
      );
      setRate(data.data);
      setManualRate(String(data.data.tasa_sistema));
      updateExchangeRate(data.data.tasa_sistema);
      window.Toast.fire({
        icon: "success",
        title: "Anclaje retirado. Se usa el precio del día.",
      });
    } catch (error) {
      window.Toast.fire({
        icon: "error",
        title: error.response?.data?.message || "No se pudo quitar el anclaje.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 h-full overflow-y-auto bg-slate-50 p-4 pb-24 sm:p-6 sm:pb-6 hide-scrollbar flex flex-col gap-4 sm:gap-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-pizza-red/10 rounded-2xl flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6 text-pizza-red" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
              Tasa del Dólar
            </h1>
            <p className="text-xs font-semibold text-slate-400 mt-1.5">
              {getHeaderDate()}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={loadRate}
          disabled={loading || saving}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm active:scale-[0.98]"
        >
          <RefreshCw
            className={`h-4 w-4 text-slate-500 ${loading ? "animate-spin" : ""}`}
          />
          Actualizar
        </button>
      </header>

      {loading && !rate ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          Cargando configuración...
        </div>
      ) : rate ? (
        <>
          {/* Panel de valores */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden shrink-0">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-base">
                Valores Actuales
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Tasas registradas en el sistema
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
              {/* Tasa del Sistema */}
              <div className="p-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Tasa del Sistema
                </p>
                <p className="mt-3 text-3xl font-extrabold text-slate-800">
                  Bs. {Number(rate.tasa_sistema).toFixed(2)}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Valor usado por caja
                </p>
              </div>

              {/* Tasa del BCV */}
              <div className="p-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Tasa del BCV
                </p>
                <p className="mt-3 text-3xl font-extrabold text-slate-800">
                  Bs. {Number(rate.tasa_api).toFixed(2)}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Último valor consultado
                </p>
              </div>

              {/* Estado */}
              <div
                className={`p-6 ${rate.anclado ? "bg-amber-50/60" : "bg-emerald-50/60"}`}
              >
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Estado
                </p>
                <div className="mt-3 flex items-center gap-2">
                  {rate.anclado ? (
                    <LockKeyhole className="h-6 w-6 text-amber-500 shrink-0" />
                  ) : (
                    <UnlockKeyhole className="h-6 w-6 text-emerald-500 shrink-0" />
                  )}
                  <span
                    className={`text-2xl font-extrabold ${rate.anclado ? "text-amber-700" : "text-emerald-700"}`}
                  >
                    {rate.anclado ? "Anclada" : "Automática"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  {rate.anclado
                    ? "Tasa fijada manualmente"
                    : "Usando precio del BCV"}
                </p>
              </div>
            </div>
          </div>

          {/* Control operativo */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden shrink-0">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-base">
                Control Operativo
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Fija una tasa manual o vuelve al precio actualizado del BCV
              </p>
            </div>
            <div className="p-5 sm:p-6">
              <form
                onSubmit={handleAnchor}
                className="flex flex-col gap-3 sm:flex-row sm:items-end"
              >
                <label className="flex-1 flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Nueva tasa manual (Bs.)
                  </span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={manualRate}
                    onChange={(event) => setManualRate(event.target.value)}
                    className="input-field w-full"
                    placeholder="772.50"
                  />
                </label>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-pizza-red px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-pizza-red-dark disabled:cursor-not-allowed disabled:opacity-60 w-full sm:w-auto active:scale-[0.98] shrink-0"
                >
                  Fijar y Anclar Tasa
                </button>
                <button
                  type="button"
                  onClick={handleUnanchor}
                  disabled={saving || !rate.anclado}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 w-full sm:w-auto active:scale-[0.98] shrink-0"
                >
                  <UnlockKeyhole className="h-4 w-4" />
                  Quitar Anclaje
                </button>
              </form>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
