"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

type KpiTone = "default" | "primary" | "accent" | "success" | "warn" | "danger" | "muted"
type KpiSize = "sm" | "md" | "lg"

interface KpiCardProps {
  readonly label: string
  readonly value: React.ReactNode
  readonly sub?: React.ReactNode
  readonly icon?: LucideIcon
  readonly tone?: KpiTone
  readonly size?: KpiSize
  readonly trailing?: React.ReactNode
  readonly footer?: React.ReactNode
  readonly className?: string
  readonly loading?: boolean
}

const toneStyles: Record<KpiTone, { surface: string; label: string; value: string; iconWrap: string; icon: string; sub: string }> = {
  default: {
    surface: "bg-card border-border",
    label: "text-muted-foreground",
    value: "text-foreground",
    iconWrap: "bg-muted",
    icon: "text-muted-foreground",
    sub: "text-muted-foreground",
  },
  primary: {
    surface: "bg-primary border-primary/40 text-primary-foreground relative overflow-hidden",
    label: "text-primary-foreground/70",
    value: "text-primary-foreground",
    iconWrap: "bg-primary-foreground/10",
    icon: "text-primary-foreground/70",
    sub: "text-primary-foreground/60",
  },
  accent: {
    surface: "bg-accent border-accent/40 text-accent-foreground",
    label: "text-accent-foreground/70",
    value: "text-accent-foreground",
    iconWrap: "bg-accent-foreground/10",
    icon: "text-accent-foreground/70",
    sub: "text-accent-foreground/60",
  },
  success: {
    surface: "",
    label: "text-muted-foreground",
    value: "text-foreground",
    iconWrap: "",
    icon: "",
    sub: "",
  },
  warn: {
    surface: "",
    label: "text-muted-foreground",
    value: "text-foreground",
    iconWrap: "",
    icon: "",
    sub: "",
  },
  danger: {
    surface: "",
    label: "text-muted-foreground",
    value: "text-foreground",
    iconWrap: "",
    icon: "",
    sub: "",
  },
  muted: {
    surface: "bg-secondary border-border",
    label: "text-muted-foreground",
    value: "text-foreground",
    iconWrap: "bg-muted",
    icon: "text-muted-foreground",
    sub: "text-muted-foreground",
  },
}

const sizeStyles: Record<KpiSize, { pad: string; label: string; value: string; icon: string; iconWrap: string }> = {
  sm: {
    pad: "p-3.5",
    label: "text-[10px]",
    value: "text-xl",
    icon: "w-3.5 h-3.5",
    iconWrap: "w-6 h-6 rounded-md",
  },
  md: {
    pad: "p-4 sm:p-5",
    label: "text-[11px]",
    value: "text-2xl sm:text-3xl",
    icon: "w-4 h-4",
    iconWrap: "w-8 h-8 rounded-lg",
  },
  lg: {
    pad: "p-5 sm:p-6",
    label: "text-xs",
    value: "text-3xl sm:text-5xl",
    icon: "w-4 h-4",
    iconWrap: "w-8 h-8 rounded-lg",
  },
}

/**
 * KpiCard — reusable minimal-futuristic metric card.
 * Supports tonal variants that adapt to dark/light via semantic tokens.
 */
export default function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "default",
  size = "md",
  trailing,
  footer,
  className,
  loading = false,
}: KpiCardProps) {
  const t = toneStyles[tone]
  const s = sizeStyles[size]

  // Status-ish tones use inline CSS vars so they adapt with dark/light
  const statusStyle =
    tone === "success"
      ? { background: "var(--success-bg)", borderColor: "var(--success-border)" }
      : tone === "warn"
      ? { background: "var(--warn-bg)", borderColor: "var(--warn-border)" }
      : tone === "danger"
      ? { background: "var(--danger-bg)", borderColor: "var(--danger-border)" }
      : undefined

  const statusText =
    tone === "success"
      ? { color: "var(--success-fg)" }
      : tone === "warn"
      ? { color: "var(--warn-fg)" }
      : tone === "danger"
      ? { color: "var(--danger-fg)" }
      : undefined

  return (
    <div
      className={cn(
        "relative rounded-xl border transition-colors",
        t.surface,
        s.pad,
        className,
      )}
      style={statusStyle}
    >
      {tone === "primary" && (
        <div aria-hidden className="absolute inset-0 bg-grid-subtle opacity-60 pointer-events-none" />
      )}
      <div className="relative flex items-start justify-between gap-2 mb-3">
        <p
          className={cn(
            "font-semibold uppercase tracking-[0.14em] leading-tight",
            s.label,
            ["success", "warn", "danger"].includes(tone) ? "" : t.label,
          )}
          style={["success", "warn", "danger"].includes(tone) ? { color: "var(--muted-foreground)" } : undefined}
        >
          {label}
        </p>
        {Icon && (
          <div
            className={cn(
              "flex items-center justify-center shrink-0",
              s.iconWrap,
              tone === "primary" ? "bg-primary-foreground/10"
                : tone === "accent" ? "bg-accent-foreground/10"
                : tone === "success" ? "bg-[color:var(--success-border)]/40"
                : tone === "warn" ? "bg-[color:var(--warn-border)]/40"
                : tone === "danger" ? "bg-[color:var(--danger-border)]/40"
                : t.iconWrap,
            )}
          >
            <Icon
              className={cn(s.icon, tone === "primary" ? "text-primary-foreground/70" : tone === "accent" ? "text-accent-foreground/70" : t.icon)}
              style={statusText}
            />
          </div>
        )}
        {trailing}
      </div>
      <p
        className={cn(
          "relative font-black tracking-tight tabular-nums leading-[1.05]",
          s.value,
          t.value,
        )}
      >
        {loading ? <span className="opacity-40">—</span> : value}
      </p>
      {sub !== undefined && sub !== "" && (
        <p
          className={cn(
            "relative mt-1.5 text-[11px] font-medium",
            ["success", "warn", "danger"].includes(tone) ? "" : t.sub,
          )}
          style={statusText}
        >
          {loading ? "" : sub}
        </p>
      )}
      {footer && <div className="relative mt-3 pt-3 border-t border-current/10">{footer}</div>}
    </div>
  )
}
