#!/usr/bin/env node
// Estimador de consumo mensual contra los planes gratuitos de
// Vercel (Hobby), Turso (Free) y Pusher (Sandbox).
//
// Uso:
//   node scripts/estimar-uso.mjs                      (valores por defecto)
//   node scripts/estimar-uso.mjs --pedidos 200 --dispositivos 10 --horas 7
//
// Modelo derivado del código real (backend/controllers + frontend hooks):
//  - Reads/order (Pusher conectado, pantallas típicas montadas):
//      pedido_creado:      VentasHoy(1) + PedidosActivos(3) + Entregas(2)
//                          + cocina(3) + ContadorCajero(1) + Notif(1)  ≈ 11
//      por cambio estado:  VentasHoy(1)+PedidosActivos(3)+Entregas(2)
//                          +Contador(1) + kitchenOrders onSettled(15)  ≈ 22
//                          × ~5 cambios por pedido                       ≈ 110
//  - Writes/order: INSERT ventas + pagos + detalles + extras           ≈ 10
//  - Requests Vercel/order ≈ 6 + 5 × 9                                ≈ 51
//  - Mensajes Pusher/order ≈ 2 (created) + 2×5 (estados) + 2 (entrega)≈ 14

const args = process.argv.slice(2);
const get = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 ? Number(args[i + 1]) : def;
};

const PEDIDOS_DIA = get("--pedidos", 150);
const DISPOSITIVOS = get("--dispositivos", 8);
// Carga conocida del negocio: activo 7h/día, todos los días del mes.
const HORAS_DIA = get("--horas", 7);
const DIAS = get("--dias", 31);
const CPU_MS = get("--cpu-ms", 30); // CPU media por invocación (ms)
const RESP_KB = get("--resp-kb", 8); // respuesta media por invocación (KB)

// Límites de planes gratuitos
const LIMITS = {
  vercel: {
    invocaciones: 1_000_000,
    fastDataTransferGB: 100,
    fastOriginTransferGB: 10,
    activeCPUh: 4,
    provisionedMemoryGBh: 360,
  },
  turso: { filasLeidas: 500_000_000, filasEscritas: 10_000_000, storageGB: 5 },
  pusher: { mensajesDia: 200_000, conexiones: 100 },
};

// Constantes del modelo
const READS_ORDER = 120;
const WRITES_ORDER = 10;
const REQUESTS_ORDER = 51;
const PUSHER_ORDER = 14;

// Peor caso: Pusher caído toda la jornada → polling de respaldo activo
const FALLBACK = {
  kitchen: { refetchsDia: (HORAS_DIA * 3600) / 8, requests: 5, reads: 15 },
  entregas: { refetchsDia: (HORAS_DIA * 3600) / 8, requests: 1, reads: 2 },
  pedidosActivos: { refetchsDia: (HORAS_DIA * 3600) / 10, requests: 1, reads: 3 },
  ventasHoy: { refetchsDia: (HORAS_DIA * 3600) / 15, requests: 1, reads: 1 },
  contador: { refetchsDia: (HORAS_DIA * 3600) / 15, requests: 1, reads: 1 },
  notif: { refetchsDia: (HORAS_DIA * 3600) / 15, requests: 1, reads: 1 },
};

const ordersMes = PEDIDOS_DIA * DIAS;

const turso = {
  leidas: ordersMes * READS_ORDER,
  escritas: ordersMes * WRITES_ORDER,
};
const vercel = {
  invocaciones: ordersMes * REQUESTS_ORDER,
  activeCPUh: (ordersMes * REQUESTS_ORDER * CPU_MS) / 3_600_000,
  originTransferGB: (ordersMes * REQUESTS_ORDER * RESP_KB) / (1024 * 1024),
};
const pusher = {
  mensajesDia: PEDIDOS_DIA * PUSHER_ORDER,
  conexiones: DISPOSITIVOS,
};

const fallback = Object.values(FALLBACK).reduce(
  (acc, f) => {
    acc.requestsDia += f.refetchsDia * f.requests;
    acc.readsDia += f.refetchsDia * f.reads;
    return acc;
  },
  { requestsDia: 0, readsDia: 0 },
);

const pct = (v, limit) => ((v / limit) * 100).toFixed(2);

console.log(`\n═══ Estimación mensual (${PEDIDOS_DIA} pedidos/día, ${HORAS_DIA}h/día × ${DIAS} días) ═══`);
console.log(`Pedidos/mes: ${ordersMes.toLocaleString()} | Dispositivos en paralelo: ${DISPOSITIVOS}`);
console.log(`\nTamaño medio de pedido asumido: ${READS_ORDER} lecturas + ${WRITES_ORDER} escrituras + ${REQUESTS_ORDER} requests + ${PUSHER_ORDER} mensajes Pusher.\n`);

console.log("── Turso FREE ──");
console.log(`  Lecturas/mes : ${turso.leidas.toLocaleString()}   (${pct(turso.leidas, LIMITS.turso.filasLeidas)}% de 500M filas)`);
console.log(`  Escrituras/mes: ${turso.escritas.toLocaleString()}   (${pct(turso.escritas, LIMITS.turso.filasEscritas)}% de 10M filas)`);

console.log("\n── Vercel Hobby ──");
console.log(`  Invocaciones/mes : ${vercel.invocaciones.toLocaleString()}   (${pct(vercel.invocaciones, LIMITS.vercel.invocaciones)}% de 1M)`);
console.log(`  Active CPU/mes   : ${vercel.activeCPUh.toFixed(2)} h   (${pct(vercel.activeCPUh, LIMITS.vercel.activeCPUh)}% de 4 h)  [asume ${CPU_MS} ms/invocación]`);
console.log(`  Origin Transfer  : ${vercel.originTransferGB.toFixed(2)} GB   (${pct(vercel.originTransferGB, LIMITS.vercel.fastOriginTransferGB)}% de 10 GB)  [asume ${RESP_KB} KB/invocación]`);
console.log(`  ⚠  Vercel Hobby es USO NO COMERCIAL. Un POS de pizzeria que procesa`);
console.log(`      pagos es uso comercial → riesgo de suspensión. Considerar Pro (US$20/mes).`);

console.log("\n── Pusher Sandbox (Free) ──");
console.log(`  Mensajes/día : ${pusher.mensajesDia.toLocaleString()}   (${pct(pusher.mensajesDia, LIMITS.pusher.mensajesDia)}% de 200k)`);
console.log(`  Conexiones   : ${pusher.conexiones}  (${pct(pusher.conexiones, LIMITS.pusher.conexiones)}% de 100)`);

console.log("\n── Peor caso: Pusher caído toda la jornada (self-healing con polling) ──");
console.log(`  Requests Vercel ese día: ${Math.round(fallback.requestsDia).toLocaleString()}   (${pct(fallback.requestsDia, LIMITS.vercel.invocaciones / 30)}% del presupuesto diario)`);
console.log(`  Lecturas Turso ese día : ${Math.round(fallback.readsDia).toLocaleString()}`);
console.log(`  → El consumo no es idle: solo ocurre mientras Pusher está caído y se apaga solo al reconectar.`);

const ok = (v, limit) => v <= limit;
const allOk =
  ok(turso.leidas, LIMITS.turso.filasLeidas) &&
  ok(turso.escritas, LIMITS.turso.filasEscritas) &&
  ok(vercel.invocaciones, LIMITS.vercel.invocaciones) &&
  ok(vercel.activeCPUh, LIMITS.vercel.activeCPUh) &&
  ok(pusher.mensajesDia, LIMITS.pusher.mensajesDia) &&
  ok(pusher.conexiones, LIMITS.pusher.conexiones);

console.log(`\n═══ Verdicto: ${allOk ? "CABE en los planes gratuitos ✅" : "⚠ EXCEDE algún límite"} ═══`);
console.log(`(Salvedad Vercel Hobby: restricción de uso no comercial, ver arriba.)\n`);