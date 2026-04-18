"use client"

import { cn } from "@/lib/utils"

interface FilterChipsProps<T extends string> {
  readonly options: ReadonlyArray<{ value: T; label: string; count?: number }>
  readonly value: T
  readonly onChange: (value: T) => void
  readonly className?: string
}

export default function FilterChips<T extends string>({
  options,
  value,
  onChange,
  className,
}: FilterChipsProps<T>) {
  return (
    <div className={cn("overflow-x-auto pb-1 -mx-1 px-1", className)}>
      <div className="inline-flex items-center gap-1 p-1 rounded-lg border border-border bg-card">
        {options.map((opt) => {
          const active = opt.value === value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors",
                active
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              {opt.label}
              {opt.count !== undefined && (
                <span
                  className={cn(
                    "tabular-nums text-[10px] font-semibold rounded px-1 min-w-[16px] h-4 inline-flex items-center justify-center",
                    active ? "bg-background/20 text-background" : "bg-muted text-muted-foreground",
                  )}
                >
                  {opt.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
