import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary] Error capturado:", error, info);
    try {
      if (window.__LAST_ERRORS && Array.isArray(window.__LAST_ERRORS)) {
        window.__LAST_ERRORS.push({
          time: new Date().toISOString(),
          message: String(error?.message || error),
          stack: String(error?.stack || ""),
          componentStack: String(info?.componentStack || ""),
        });
      }
    } catch {
      /* noop */
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    const { error, info } = this.state;

    if (error) {
      const message = String(error?.message || error || "Error desconocido");
      const stack = String(error?.stack || "");
      const componentStack = String(info?.componentStack || "");

      return (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2147483000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            background: "#f8fafc",
            fontFamily: "Arial, sans-serif",
            color: "#0f172a",
          }}
        >
          <div
            style={{
              maxWidth: 560,
              width: "100%",
              background: "#ffffff",
              border: "1px solid #fecaca",
              borderRadius: 16,
              padding: "28px 24px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                margin: "0 auto 12px",
                borderRadius: "50%",
                background: "#fee2e2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
              }}
            >
              🍕
            </div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>
              Oops, algo salió mal
            </h2>
            <p style={{ margin: "8px 0 20px", fontSize: 14, color: "#475569" }}>
              La pantalla dejó de renderizar. Presiona el botón para volver a
              cargar el sistema.
            </p>
            <button
              onClick={this.handleReload}
              style={{
                cursor: "pointer",
                border: "none",
                background: "#dc2626",
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 700,
                padding: "12px 24px",
                borderRadius: 12,
              }}
            >
              Recargar sistema
            </button>

            <details
              style={{ marginTop: 20, textAlign: "left", fontSize: 12 }}
            >
              <summary style={{ cursor: "pointer", color: "#64748b" }}>
                Ver detalle técnico (para reportar)
              </summary>
              <pre
                style={{
                  margin: "8px 0 0",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  background: "#f1f5f9",
                  padding: 12,
                  borderRadius: 8,
                  maxHeight: 200,
                  overflow: "auto",
                  color: "#334155",
                }}
              >
                {message}
                {"\n\n"}
                {componentStack || stack}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}