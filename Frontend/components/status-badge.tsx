import type { BoletaStatus } from "@/lib/mock-data"

interface StatusBadgeProps {
  readonly status: BoletaStatus
  readonly size?: "sm" | "md"
}

const LABELS: Record<BoletaStatus, string> = {
  pendiente: "Pendiente",
  en_revision: "En revisión",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  pagada: "Pagada",
}

const TOKENS: Record<BoletaStatus, { fg: string; bg: string; dot: string }> = {
  pendiente:   { fg: "var(--status-pending-fg)",  bg: "var(--status-pending-bg)",  dot: "var(--status-pending-dot)" },
  en_revision: { fg: "var(--status-review-fg)",   bg: "var(--status-review-bg)",   dot: "var(--status-review-dot)" },
  aprobada:    { fg: "var(--status-approved-fg)", bg: "var(--status-approved-bg)", dot: "var(--status-approved-dot)" },
  rechazada:   { fg: "var(--status-rejected-fg)", bg: "var(--status-rejected-bg)", dot: "var(--status-rejected-dot)" },
  pagada:      { fg: "var(--status-paid-fg)",     bg: "var(--status-paid-bg)",     dot: "var(--status-paid-dot)" },
}

export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const t = TOKENS[status]
  return (
    <span
      className="inline-flex items-center gap-1.5 font-semibold rounded-full border uppercase tracking-[0.08em]"
      style={{
        color: t.fg,
        background: t.bg,
        borderColor: `color-mix(in oklch, ${t.dot} 30%, transparent)`,
        fontSize: size === "sm" ? "10px" : "11px",
        padding: size === "sm" ? "2px 8px 2px 6px" : "3px 10px 3px 8px",
        lineHeight: 1.4,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: t.dot }} />
      {LABELS[status]}
    </span>
  )
}
