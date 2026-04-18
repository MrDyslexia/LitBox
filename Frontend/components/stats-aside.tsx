"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface Props {
  readonly title: string
  readonly accentColor?: string
  readonly children: React.ReactNode
  readonly className?: string
}

/**
 * Desktop-only right-side stats rail used inside each role home page.
 */
export default function StatsAside({ title, accentColor, children, className }: Props) {
  return (
    <aside
      className={cn(
        "hidden xl:flex flex-col w-72 shrink-0 border-l border-border overflow-y-auto p-4 gap-3 self-start sticky top-0 max-h-screen",
        className,
      )}
    >
      <div className="flex items-center gap-2 px-1 pb-1">
        <div
          className="w-1 h-3.5 rounded-full shrink-0"
          style={{ background: accentColor ?? "var(--accent)" }}
          aria-hidden
        />
        <h2 className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">{title}</h2>
      </div>
      {children}
    </aside>
  )
}
