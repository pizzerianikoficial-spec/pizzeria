import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

// ── Auditoría estática de eficiencia (cuota gratuita Vercel/Turso/Pusher)
// Verifica que NINGÚN hook o componente mantenga polling incondicional:
// todo refetchInterval debe depender de la conexión a Pusher, de modo que
// con Pusher activo no se consume cuota de solicitudes y con Pusher caído
// el polling de respaldo se activa (autorecuperación) y luego se apaga.

const srcDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
);

const read = (rel) =>
  readFileSync(path.join(srcDir, rel), "utf8");

// [archivo, intervalo de respaldo (ms), token del hook de conexión]
const conditionalPollingFiles = [
  ["hooks/useKitchenOrders.js", 8000],
  ["hooks/useEntregas.js", 8000],
  ["hooks/usePedidosActivos.js", 10000],
  ["hooks/useVentasHoy.js", 15000],
  ["hooks/useContadorCajero.js", 15000],
  ["components/cajero/PendingNotifications.jsx", 15000],
];

const CONDITIONAL_PATTERN = /refetchInterval\s*:\s*pusherConnected\s*\?\s*false\s*:/;
const UNCONDITIONAL_NUMBER_PATTERN = /refetchInterval\s*:\s*(?:\d+(?:\.\d+)?)\s*,?/;
const UNCONDITIONAL_BOOL_PATTERN = /refetchInterval\s*:\s*(?:true|false)\s*,?/;

test("todos los hooks/pantallas usan polling condicional a Pusher", () => {
  for (const [file, expectedInterval] of conditionalPollingFiles) {
    const src = read(file);

    assert.ok(
      CONDITIONAL_PATTERN.test(src),
      `${file}: debe usar \`refetchInterval: pusherConnected ? false : ...\``,
    );

    assert.ok(
      src.replace(/[_ ]/g, "").includes(String(expectedInterval)),
      `${file}: el polling de respaldo debería ser ${expectedInterval} ms`,
    );

    assert.ok(
      src.includes("usePusherConnection()"),
      `${file}: debe obtener la conexión con usePusherConnection()`,
    );

    assert.equal(
      (src.match(CONDITIONAL_PATTERN) || []).length,
      1,
      `${file}: la guarda condicional debe aparecer exactamente 1 vez`,
    );
  }
});

test("no queda ningún refetchInterval numérico o booleano incondicional", () => {
  for (const [file] of conditionalPollingFiles) {
    const src = read(file);
    assert.ok(
      !UNCONDITIONAL_NUMBER_PATTERN.test(src),
      `${file}: hay un refetchInterval numérico fijo (polling siempre activo)`,
    );
    assert.ok(
      !UNCONDITIONAL_BOOL_PATTERN.test(src),
      `${file}: hay un refetchInterval true/false fijo`,
    );
  }
});

test("useEntregas usa staleTime y polling de respaldo razonable", () => {
  const src = read("hooks/useEntregas.js");
  assert.ok(src.includes("staleTime"), "useEntregas debe definir staleTime");
});

test("usePedidosActivos/useVentasHoy/useContadorCajero tienen staleTime", () => {
  for (const file of [
    "hooks/usePedidosActivos.js",
    "hooks/useVentasHoy.js",
    "hooks/useContadorCajero.js",
  ]) {
    assert.ok(read(file).includes("staleTime"), `${file} debe definir staleTime`);
  }
});

test("pusherClient expone la API de conexión y suscripción", () => {
  const src = read("lib/pusherClient.js");
  for (const exportName of [
    "isPusherConnected",
    "subscribePusherConnection",
    "subscribeToPusher",
  ]) {
    assert.ok(
      src.includes(`export const ${exportName}`),
      `pusherClient debe exportar ${exportName}`,
    );
  }
  assert.ok(
    src.includes('connection.state === "connected"'),
    "detecta el estado connected de Pusher",
  );
  assert.ok(
    src.includes("enabledTransports: [\"ws\", \"wss\"]"),
    "usa ws/wss para no depender de transportes de polling (http)",
  );
});

test("usePusherConnection es un hook reactivo correcto", () => {
  const src = read("hooks/usePusherConnection.js");
  assert.ok(src.includes("subscribePusherConnection(setConnected)"));
  assert.ok(src.includes('"connected"') === false, "no debe hardcodear estado");
  assert.ok(src.includes("export function usePusherConnection"));
});

test("kitchenOrders sigue cacheado y con optimistic updates", () => {
  const src = read("hooks/useKitchenOrders.js");
  assert.ok(src.includes("onMutate"), "debe mantener optimistic update onMutate");
  assert.ok(src.includes("onError"), "debe mantener rollback en onError");
  assert.ok(
    src.includes("staleTime: 15_000"),
    "useKitchenOrders debe mantener staleTime 15s",
  );
  assert.ok(
    src.includes("refetchType: \"active\""),
    "las invalidaciones solo refetchan consultas activas (montadas)",
  );
});

test("queryClient global no hace refetch agresivo", () => {
  const src = read("lib/queryClient.js");
  assert.ok(src.includes("refetchOnWindowFocus: false"));
  assert.ok(src.includes("refetchOnMount: false"));
  assert.ok(
    src.replace(/[_ ]/g, "").includes("staleTime:30*1000") ||
      src.replace(/_/g, "").includes("staleTime: 30000"),
    "staleTime global debe ser 30s y no consumir lecturas en cada montaje",
  );
  assert.ok(src.includes("gcTime"), "debe definir gcTime");
});