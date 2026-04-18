"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Sun, Moon, Monitor } from "lucide-react"

type Variant = "sidebar" | "inline"

interface Props {
  readonly variant?: Variant
}

/**
 * Segmented control: Sistema / Claro / Oscuro.
 * `sidebar` variant is styled for dark navy sidebar surfaces.
 */
export default function ThemeToggle({ variant = "sidebar" }: Props) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const current = mounted ? (theme ?? "system") : "system"
  const options: ReadonlyArray<{ value: "system" | "light" | "dark"; icon: React.ReactNode; aria: string }> = [
    { value: "system", icon: <Monitor className="w-3.5 h-3.5" />, aria: "Sistema" },
    { value: "light", icon: <Sun className="w-3.5 h-3.5" />, aria: "Claro" },
    { value: "dark", icon: <Moon className="w-3.5 h-3.5" />, aria: "Oscuro" },
  ]

  const isSidebar = variant === "sidebar"

  return (
    <div
      role="radiogroup"
      aria-label="Cambiar tema"
      className="inline-flex items-center gap-0.5 p-0.5 rounded-lg border"
      style={
        isSidebar
          ? { background: "var(--sidebar-accent)", borderColor: "var(--sidebar-border)" }
          : { background: "var(--muted)", borderColor: "var(--border)" }
      }
    >
      {options.map((opt) => {
        const active = current === opt.value
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={active}
            aria-label={opt.aria}
            onClick={() => setTheme(opt.value)}
            className="flex items-center justify-center w-7 h-7 rounded-md transition-colors"
            style={
              active
                ? isSidebar
                  ? { background: "var(--accent)", color: "var(--accent-foreground)" }
                  : { background: "var(--card)", color: "var(--foreground)", boxShadow: "0 1px 2px rgb(0 0 0 / 0.06)" }
                : isSidebar
                  ? { color: "var(--sidebar-muted)" }
                  : { color: "var(--muted-foreground)" }
            }
          >
            {opt.icon}
          </button>
        )
      })}
    </div>
  )
}
