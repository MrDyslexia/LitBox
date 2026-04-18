"use client"

import * as React from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface SectionHeaderProps {
  readonly icon?: LucideIcon
  readonly label: string
  readonly trailing?: React.ReactNode
  readonly className?: string
}

/**
 * Uppercase, tracking-widest section divider used across dashboards.
 */
export default function SectionHeader({ icon: Icon, label, trailing, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground flex items-center gap-2">
        <span className="w-1 h-3.5 rounded-full bg-accent shrink-0" aria-hidden />
        {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground" />}
        {label}
      </h2>
      {trailing}
    </div>
  )
}
