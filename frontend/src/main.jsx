import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App.jsx";
import "./index.css";
import { createQueryClient } from "./lib/queryClient";

const queryClient = createQueryClient();

const portalHost = document.createElement("div");
portalHost.id = "app-portals";
document.body.appendChild(portalHost);

window.__LAST_ERRORS = [];

window.addEventListener("error", (event) => {
  const err = event.error || event.message;
  console.error("[global:error]", event.message);
  window.__LAST_ERRORS.push({
    time: new Date().toISOString(),
    type: "error",
    message: String(event.message || err),
    stack: String(err?.stack || ""),
  });
  setTimeout(() => {
    try {
      if (window.Toast) {
        window.Toast.fire({
          icon: "error",
          title: "Ocurrió un error inesperado (revisa la consola)",
        });
      }
    } catch {
      /* noop */
    }
  }, 0);
});

window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;
  console.error("[global:unhandledrejection]", reason);
  window.__LAST_ERRORS.push({
    time: new Date().toISOString(),
    type: "unhandledrejection",
    message: String(reason?.message || reason),
    stack: String(reason?.stack || ""),
  });
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
