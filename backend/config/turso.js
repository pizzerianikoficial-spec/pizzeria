import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error(
    "[turso] Falta TURSO_DATABASE_URL en las variables de entorno.",
  );
  throw new Error(
    "Configuración incompleta: TURSO_DATABASE_URL es obligatoria.",
  );
}

const db = createClient({
  url,
  ...(authToken ? { authToken } : {}),
});

export default db;
