"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface Props {
  readonly label: string
  readonly value: number | string
  readonly percent: number // 0 - 100
  readonly color?: string
  readonly leading?: React.ReactNode
  readonly className?: string
}

export default function ProgressRow({ label, value, percent, color = "var(--chart-1)", leading, className }: Props) {
  const clamped = Math.max(0, Math.min(100, percent))
  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-1 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {leading}
          <span className="text-[11px] font-medium text-foreground truncate">{label}</span>
        </div>
        <span className="text-[11px] font-bold text-foreground tabular-nums shrink-0">{value}</span>
      </div>
      <div className="w-full h-1.5 rounded-full overflow-hidden bg-muted">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${clamped}%`, background: color }}
        />
      </div>
    </div>
  )
}
