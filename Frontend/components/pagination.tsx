"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export default function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null

  const getPageNumbers = (): (number | "…")[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const pages: (number | "…")[] = []
    const left = Math.max(2, page - 1)
    const right = Math.min(totalPages - 1, page + 1)

    pages.push(1)

    if (left > 2) pages.push("…")

    for (let i = left; i <= right; i++) {
      pages.push(i)
    }

    if (right < totalPages - 1) pages.push("…")

    pages.push(totalPages)

    return pages
  }

  const pages = getPageNumbers()

  return (
    <div className={`flex items-center justify-center gap-1 py-2 ${className ?? ""}`}>
      {/* Prev button */}
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="flex items-center justify-center w-8 h-8 rounded-md transition-colors hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Página anterior"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Mobile: only show "Página X de Y" */}
      <span className="sm:hidden text-xs text-muted-foreground px-2">
        Página {page} de {totalPages}
      </span>

      {/* Desktop: numbered buttons */}
      <div className="hidden sm:flex items-center gap-1">
        {pages.map((p, idx) =>
          p === "…" ? (
            <span
              key={`ellipsis-${idx}`}
              className="w-8 h-8 flex items-center justify-center text-xs text-muted-foreground"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className="w-8 h-8 rounded-md text-xs font-medium transition-colors hover:bg-muted/50"
              style={
                p === page
                  ? { background: "var(--primary)", color: "white" }
                  : undefined
              }
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </button>
          )
        )}
      </div>

      {/* Next button */}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="flex items-center justify-center w-8 h-8 rounded-md transition-colors hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Página siguiente"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
