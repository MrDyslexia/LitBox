import { STATUS_CONFIG, type BoletaStatus } from "@/lib/mock-data"

interface StatusBadgeProps {
  status: BoletaStatus
  size?: "sm" | "md"
}

export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  return (
    <span
      className="inline-flex items-center gap-1.5 font-medium rounded-full"
      style={{
        color: config.color,
        background: config.bg,
        fontSize: size === "sm" ? "11px" : "12px",
        padding: size === "sm" ? "2px 8px" : "3px 10px",
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: config.dot }}
      />
      {config.label}
    </span>
  )
}
