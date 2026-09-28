import { useState } from 'react';
import {
  Bike, MapPin, Clock, Phone, CheckCircle2, Package,
  Navigation, AlertCircle, RotateCcw, ChevronRight,
  TrendingUp, Timer, Star
} from 'lucide-react';

const MOCK_DELIVERIES = [
  {
    id: 'DEL-001',
    orderId: 'ORD-008',
    customer: 'María González',
    phone: '0414-123-4567',
    address: 'Av. Libertador #45, Urb. Los Pinos',
    zone: 'Zona Norte',
    items: ['1x Pizza Pepperoni Suprema (Familiar)', '2x Coca-Cola'],
    total: 24.90,
    rider: 'Ramón Torres',
    status: 'en_camino',
    createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    estimatedAt: new Date(Date.now() + 7 * 60 * 1000).toISOString(),
    distance: '2.3 km',
  },
  {
    id: 'DEL-002',
    orderId: 'ORD-007',
    customer: 'Carlos Ramírez',
    phone: '0424-987-6543',
    address: 'Calle Bolívar #12, Quinta Las Flores',
    zone: 'Zona Centro',
    items: ['1x Combo Pareja', '1x Helado Vainilla'],
    total: 21.00,
    rider: 'Luis Medina',
    status: 'entregado',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    estimatedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    distance: '1.1 km',
  },
  {
    id: 'DEL-003',
    orderId: 'ORD-009',
    customer: 'Ana Soto',
    phone: '0416-555-3210',
    address: 'Urb. La Castellana, Manzana 7, Casa 3',
    zone: 'Zona Sur',
    items: ['2x BBQ Chicken (Mediana)', '1x Agua Mineral'],
    total: 36.50,
    rider: 'Pedro Gómez',
    status: 'preparando',
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    estimatedAt: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
    distance: '3.8 km',
  },
  {
    id: 'DEL-004',
    orderId: 'ORD-006',
    customer: 'Juan Pérez',
    phone: '0412-777-6543',
    address: 'Res. El Mirador, Torre B, Apto 4D',
    zone: 'Zona Este',
    items: ['1x Combo Familiar'],
    total: 28.00,
    rider: 'Ramón Torres',
    status: 'entregado',
    createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    estimatedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    distance: '0.9 km',
  },
  {
    id: 'DEL-005',
    orderId: 'ORD-010',
    customer: 'Luis Herrera',
    phone: '0426-444-1122',
    address: 'Sector Industrial, Galpón 22-A',
    zone: 'Zona Oeste',
    items: ['3x Margarita Clásica (Familiar)', '6x Pepsi', '2x Helado Chocolate'],
    total: 68.00,
    rider: 'Luis Medina',
    status: 'en_camino',
    createdAt: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
    estimatedAt: new Date(Date.now() + 3 * 60 * 1000).toISOString(),
    distance: '4.2 km',
  },
];

const STATUS_CONFIG = {
  preparando: {
    label: 'Preparando',
    icon: Package,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-400',
    step: 1,
  },
  en_camino: {
    label: 'En Camino',
    icon: Bike,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-500',
    step: 2,
  },
  entregado: {
    label: 'Entregado',
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-400',
    step: 3,
  },
};

function getElapsed(iso) {
  const mins = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (mins < 1) return '< 1 min';
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function getETA(iso) {
  const diff = new Date(iso) - Date.now();
  if (diff <= 0) return 'Ya llegó';
  const mins = Math.ceil(diff / 60000);
  return `~${mins} min`;
}

function ProgressBar({ status }) {
  const step = STATUS_CONFIG[status]?.step || 0;
  const steps = [
    { label: 'Preparando', icon: Package },
    { label: 'En Camino', icon: Bike },
    { label: 'Entregado', icon: CheckCircle2 },
  ];
  return (
    <div className="flex items-center gap-0 w-full">
      {steps.map((s, i) => {
        const Icon = s.icon;
        const done = i + 1 <= step;
        const active = i + 1 === step;
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
              done
                ? active
                  ? 'bg-pizza-red text-white shadow-[0_0_10px_rgba(234,42,51,0.4)]'
                  : 'bg-slate-700 text-white'
                : 'bg-slate-100 text-slate-400'
            }`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            {i < 2 && (
              <div className={`flex-1 h-0.5 mx-1 rounded-full transition-all duration-500 ${
                i + 1 < step ? 'bg-slate-700' : 'bg-slate-200'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function DeliveryCard({ delivery, onStatusChange }) {
  const cfg = STATUS_CONFIG[delivery.status];
  const Icon = cfg.icon;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`rounded-2xl border-2 overflow-hidden transition-all duration-300 ${cfg.border} bg-white shadow-sm hover:shadow-md group`}>
      {/* Top bar accent */}
      <div className={`h-1 w-full ${cfg.dot}`} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-6 h-6 ${cfg.color}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-slate-800 text-base">{delivery.orderId}</span>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${cfg.badge} flex items-center gap-1`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${delivery.status === 'en_camino' ? 'animate-pulse' : ''}`}></span>
                  {cfg.label}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-600 mt-0.5">{delivery.customer}</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xl font-extrabold text-slate-800">${delivery.total.toFixed(2)}</p>
            <p className="text-xs text-slate-400">{delivery.distance}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <ProgressBar status={delivery.status} />
        </div>

        {/* Address & ETA */}
        <div className="flex items-start gap-3 bg-slate-50 rounded-xl p-3 mb-3">
          <MapPin className="w-4 h-4 text-pizza-red shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{delivery.zone}</p>
            <p className="text-sm text-slate-800 font-medium leading-snug truncate">{delivery.address}</p>
          </div>
          {delivery.status !== 'entregado' && (
            <div className="shrink-0 text-right">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">ETA</p>
              <p className={`text-sm font-extrabold ${cfg.color}`}>{getETA(delivery.estimatedAt)}</p>
            </div>
          )}
        </div>

        {/* Info row */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
          <div className="flex items-center gap-1.5">
            <Bike className="w-3.5 h-3.5" />
            <span className="font-semibold">{delivery.rider}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Hace {getElapsed(delivery.createdAt)}</span>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 hover:text-slate-800 transition-colors font-semibold"
          >
            Ver items
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
        </div>

        {/* Items expandable */}
        {expanded && (
          <div className="bg-slate-50 rounded-xl p-3 mb-3 space-y-1 animate-fade-in">
            {delivery.items.map((item, i) => (
              <p key={i} className="text-xs text-slate-700 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-pizza-red inline-block shrink-0"></span>
                {item}
              </p>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <a
            href={`tel:${delivery.phone}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            {delivery.phone}
          </a>
          {delivery.status === 'en_camino' && (
            <button
              onClick={() => onStatusChange(delivery.id, 'entregado')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-colors shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Confirmar Entrega
            </button>
          )}
          {delivery.status === 'preparando' && (
            <button
              onClick={() => onStatusChange(delivery.id, 'en_camino')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold transition-colors shadow-sm"
            >
              <Navigation className="w-3.5 h-3.5" />
              Despachar
            </button>
          )}
          {delivery.status === 'entregado' && (
            <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-bold">
              <Star className="w-3.5 h-3.5 fill-current" />
              Completado
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DeliveryScreen() {
  const [deliveries, setDeliveries] = useState(MOCK_DELIVERIES);
  const [filter, setFilter] = useState('todos');

  const handleStatusChange = (id, newStatus) => {
    setDeliveries(prev =>
      prev.map(d => d.id === id ? { ...d, status: newStatus } : d)
    );
  };

  const counts = {
    todos: deliveries.length,
    preparando: deliveries.filter(d => d.status === 'preparando').length,
    en_camino: deliveries.filter(d => d.status === 'en_camino').length,
    entregado: deliveries.filter(d => d.status === 'entregado').length,
  };

  const filtered = filter === 'todos' ? deliveries : deliveries.filter(d => d.status === filter);
  const totalDelivered = deliveries.filter(d => d.status === 'entregado').reduce((s, d) => s + d.total, 0);
  const inTransit = deliveries.filter(d => d.status === 'en_camino').length;

  const FILTERS = [
    { id: 'todos', label: 'Todos', color: 'bg-slate-800 text-white', inactive: 'bg-white text-slate-600 border border-slate-200' },
    { id: 'preparando', label: 'Preparando', color: 'bg-amber-500 text-white', inactive: 'bg-white text-amber-600 border border-amber-200' },
    { id: 'en_camino', label: 'En Camino', color: 'bg-blue-500 text-white', inactive: 'bg-white text-blue-600 border border-blue-200' },
    { id: 'entregado', label: 'Entregados', color: 'bg-emerald-500 text-white', inactive: 'bg-white text-emerald-600 border border-emerald-200' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Header — clean white, consistent with rest of app */}
      <div className="bg-white border-b border-slate-100 px-6 py-5 shrink-0">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              <Bike className="w-7 h-7 text-pizza-red" />
              Control de Delivery
            </h1>
            <p className="text-slate-500 text-sm mt-0.5 capitalize">
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <button className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 px-4 py-2 rounded-xl text-sm font-semibold transition-all">
            <RotateCcw className="w-4 h-4" />
            Actualizar
          </button>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Bike className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-blue-500 text-xs font-bold uppercase tracking-wider">En Tránsito</p>
              <p className="text-slate-800 font-extrabold text-2xl">{inTransit}</p>
            </div>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-emerald-500 text-xs font-bold uppercase tracking-wider">Entregados</p>
              <p className="text-slate-800 font-extrabold text-2xl">{counts.entregado}</p>
            </div>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-pizza-red" />
            </div>
            <div>
              <p className="text-pizza-red text-xs font-bold uppercase tracking-wider">Ingresos Hoy</p>
              <p className="text-slate-800 font-extrabold text-2xl">${totalDelivered.toFixed(0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 shrink-0 flex items-center gap-2 overflow-x-auto hide-scrollbar bg-white border-b border-slate-100">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
              filter === f.id ? f.color + ' shadow-md' : f.inactive + ' hover:opacity-80'
            }`}
          >
            {f.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === f.id ? 'bg-white/20' : 'bg-slate-100'}`}>
              {counts[f.id]}
            </span>
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1.5 text-slate-500 text-xs font-semibold shrink-0">
          <Timer className="w-3.5 h-3.5" />
          {filtered.length} resultado(s)
        </div>
      </div>

      {/* Grid of delivery cards */}
      <div className="flex-1 overflow-y-auto p-6 hide-scrollbar">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-300">
            <AlertCircle className="w-16 h-16 opacity-50" />
            <p className="font-semibold text-lg">Sin deliveries en esta categoría</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(delivery => (
              <DeliveryCard
                key={delivery.id}
                delivery={delivery}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
