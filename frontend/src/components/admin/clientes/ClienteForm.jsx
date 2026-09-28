import { useState } from "react";
import {
  Save,
  XCircle,
  CreditCard,
  User,
  Phone,
  MessageSquare,
  AlertCircle,
} from "lucide-react";

const EMPTY = { cedula: "", name: "", phone: "", descripcion: "" };

function Field({ label, error, icon: Icon, children }) {
  return (
    <div>
      <label className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5 block">
        {label}
      </label>
      <div className="relative">
        <Icon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        {children}
      </div>
      {error && (
        <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}

const inputClass = (hasError) =>
  `w-full bg-slate-50 border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none transition-all ${
    hasError
      ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-200"
      : "border-slate-200 hover:border-slate-300 focus:border-pizza-red focus:ring-1 focus:ring-pizza-red"
  }`;

export default function ClienteForm({
  initial,
  customers = [],
  isSaving,
  serverError,
  onSave,
  onCancel,
}) {
  const [form, setForm] = useState(initial || { ...EMPTY });
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const e = {};
    const cedulaTrim = form.cedula.trim();

    if (!cedulaTrim) {
      e.cedula = "La cédula es requerida";
    } else {
      const duplicated = customers.some(
        (c) =>
          String(c.cedula).trim().toLowerCase() === cedulaTrim.toLowerCase() &&
          c.id !== initial?.id,
      );
      if (duplicated) e.cedula = "Ya existe un cliente con esa cédula";
    }

    if (!form.name.trim()) e.name = "El nombre es requerido";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    onSave({
      cedula: form.cedula.trim(),
      name: form.name.trim(),
      phone: String(form.phone || "").replace(/\D/g, ""),
      descripcion: form.descripcion,
    });
  };

  return (
    <div className="flex flex-col gap-4 relative">
      {/* Overlay de carga */}
      {isSaving && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
          <div className="flex flex-col items-center gap-3">
            <div className="w-9 h-9 border-4 border-pizza-red border-t-transparent rounded-full animate-spin" />
            <span className="text-pizza-red font-bold">Guardando...</span>
          </div>
        </div>
      )}

      {/* Error del servidor */}
      {serverError && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-semibold rounded-xl px-4 py-3 flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {serverError}
        </div>
      )}

      {/* Cédula */}
      <Field label="Cédula / RIF" error={errors.cedula} icon={CreditCard}>
        <input
          type="text"
          value={form.cedula}
          onChange={(e) => handleChange("cedula", e.target.value)}
          className={inputClass(errors.cedula)}
          placeholder="Ej: V-12345678"
        />
      </Field>

      {/* Nombre */}
      <Field label="Nombre Completo" error={errors.name} icon={User}>
        <input
          type="text"
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
          className={inputClass(errors.name)}
          placeholder="Nombre y apellido"
        />
      </Field>

      {/* Teléfono */}
      <Field label="Teléfono" icon={Phone}>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          className={inputClass(false)}
          placeholder="Solo números (Ej: 04141234567)"
        />
      </Field>

      {/* Descripción */}
      <Field label="Descripción" icon={MessageSquare}>
        <textarea
          value={form.descripcion}
          onChange={(e) => handleChange("descripcion", e.target.value)}
          className={`${inputClass(false)} resize-none`}
          rows={2}
          placeholder="Notas u observaciones del cliente"
        />
      </Field>

      {/* Acciones */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 mt-2">
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] w-full sm:w-1/3 transition-all flex items-center justify-center gap-2"
        >
          <XCircle className="w-4 h-4" /> Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSaving}
          className="flex-1 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-slate-950 hover:shadow-lg text-white py-3 rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.98] w-full"
        >
          <Save className="w-4 h-4" /> Guardar Cliente
        </button>
      </div>
    </div>
  );
}
