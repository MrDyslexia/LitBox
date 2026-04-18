"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface DataTableShellProps {
  readonly children: React.ReactNode
  readonly className?: string
}

/**
 * Shared table wrapper: gives a consistent elevated surface with hairline border,
 * sticky-feeling header row and tabular numerics.
 */
export default function DataTableShell({ children, className }: DataTableShellProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card overflow-hidden",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm tabular-nums">{children}</table>
      </div>
    </div>
  )
}

export function Th({
  children,
  className,
  align = "left",
}: {
  readonly children?: React.ReactNode
  readonly className?: string
  readonly align?: "left" | "right" | "center"
}) {
  return (
    <th
      className={cn(
        "px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.14em]",
        align === "right" && "text-right",
        align === "center" && "text-center",
        align === "left" && "text-left",
        className,
      )}
    >
      {children}
    </th>
  )
}

export function Tr({
  children,
  className,
  onClick,
}: {
  readonly children: React.ReactNode
  readonly className?: string
  readonly onClick?: () => void
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        "border-t border-border transition-colors hover:bg-muted/40",
        onClick && "cursor-pointer",
        className,
      )}
    >
      {children}
    </tr>
  )
}

export function Td({
  children,
  className,
  align = "left",
}: {
  readonly children?: React.ReactNode
  readonly className?: string
  readonly align?: "left" | "right" | "center"
}) {
  return (
    <td
      className={cn(
        "px-4 py-3 text-foreground",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </td>
  )
}

export function TableHeader({ children }: { readonly children: React.ReactNode }) {
  return <thead className="bg-secondary/60">{children}</thead>
}
