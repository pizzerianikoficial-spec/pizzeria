import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  itemName = "registros",
  className = "",
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const from = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, totalItems);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [];
    const delta = 1;
    const rangeStart = Math.max(1, safePage - delta);
    const rangeEnd = Math.min(totalPages, safePage + delta);

    if (rangeStart > 1) {
      pages.push(1);
      if (rangeStart > 2) pages.push("...");
    }

    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }

    if (rangeEnd < totalPages) {
      if (rangeEnd < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  }, [safePage, totalPages]);

  return (
    <div
      className={`px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 select-none ${className}`}
    >
      {/* Texto informativo */}
      <div className="text-xs font-semibold text-slate-500 text-center sm:text-left">
        Mostrando <span className="text-slate-800 font-bold">{from}</span> -{" "}
        <span className="text-slate-800 font-bold">{to}</span> de{" "}
        <span className="text-slate-800 font-bold">{totalItems}</span>{" "}
        {itemName}
      </div>

      {/* Controles de navegación */}
      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        {/* Botón Anterior */}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          disabled={safePage <= 1}
          className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
          title="Página anterior"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        {/* Números de página */}
        {pageNumbers.map((p, i) =>
          p === "..." ? (
            <span
              key={`ellipsis-${i}`}
              className="w-6 text-center text-slate-400 text-xs font-bold self-center"
            >
              ...
            </span>
          ) : (
            <button
              type="button"
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                p === safePage
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent"
              }`}
            >
              {p}
            </button>
          ),
        )}

        {/* Botón Siguiente */}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
          disabled={safePage >= totalPages}
          className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
          title="Página siguiente"
        >
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
