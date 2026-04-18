"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface PaginationProps {
  readonly page: number
  readonly totalPages: number
  readonly onPageChange: (page: number) => void
  readonly className?: string
}

export default function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null

  const getPageNumbers = (): (number | "…")[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    const pages: (number | "…")[] = [1]
    const left = Math.max(2, page - 1)
    const right = Math.min(totalPages - 1, page + 1)
    if (left > 2) pages.push("…")
    for (let i = left; i <= right; i++) pages.push(i)
    if (right < totalPages - 1) pages.push("…")
    pages.push(totalPages)
    return pages
  }

  const pages = getPageNumbers()

  return (
    <nav
      aria-label="Paginación"
      className={cn(
        "flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-2 py-1.5",
        className,
      )}
    >
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
      >
        <ChevronLeft className="w-3.5 h-3.5" aria-hidden />
        <span className="hidden sm:inline">Anterior</span>
      </button>

      <span className="sm:hidden text-[11px] font-medium text-muted-foreground tabular-nums">
        {page} / {totalPages}
      </span>

      <div className="hidden sm:flex items-center gap-0.5">
        {pages.map((p, idx) =>
          p === "…" ? (
            <span
              key={`ellipsis-${idx}`}
              className="w-8 h-8 flex items-center justify-center text-xs text-muted-foreground"
              aria-hidden
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              aria-current={p === page ? "page" : undefined}
              className={cn(
                "w-8 h-8 rounded-md text-xs font-semibold tabular-nums transition-colors",
                p === page
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {p}
            </button>
          ),
        )}
      </div>

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
      >
        <span className="hidden sm:inline">Siguiente</span>
        <ChevronRight className="w-3.5 h-3.5" aria-hidden />
      </button>
    </nav>
  )
}
