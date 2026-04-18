"use client"

import { TrendingUp, AlertTriangle, Zap, Clock, CheckCircle, XCircle } from "lucide-react"
import type { ApiStats } from "@/lib/types"

interface Props {
  stats: ApiStats | null
  loading: boolean
  mobile?: boolean
}

function PanelContent({ stats, loading }: Omit<Props, "mobile">) {
  const resueltasMes  = stats?.resueltasMes ?? 0
  const aprobadasMes  = stats?.aprobadasMes ?? 0
  const rechazadasMes = stats?.rechazadasMes ?? 0
  const pendiente     = stats?.pendiente ?? 0
  const en_revision   = stats?.en_revision ?? 0
  const atrasadas     = stats?.boletasAtrasadas ?? 0
  const tiempoAvg     = stats?.tiempoPromedioResolucion ?? null

  const tasaMes      = resueltasMes > 0 ? Math.round((aprobadasMes / resueltasMes) * 100) : 0
  const tasaRechazo  = resueltasMes > 0 ? Math.round((rechazadasMes / resueltasMes) * 100) : 0
  const throughputSem = Math.round(resueltasMes / 4.3)
  const backlog       = pendiente + en_revision

  const slaColor =
    tiempoAvg == null   ? "var(--muted-foreground)"
    : tiempoAvg < 2     ? "oklch(0.58 0.14 162)"
    : tiempoAvg <= 3    ? "oklch(0.55 0.14 72)"
                        : "oklch(0.55 0.22 27)"
  const slaLabel =
    tiempoAvg == null   ? "Sin datos"
    : tiempoAvg < 2     ? "Dentro de SLA"
    : tiempoAvg <= 3    ? "En límite"
                        : "Fuera de SLA"

  return (
    <>
      {/* Hero — Tasa de aprobación mes */}
      <div className="rounded-xl p-4" style={{ background: "oklch(0.52 0.21 28)" }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-white/70">
            Aprobación (mes)
          </span>
          <TrendingUp className="w-4 h-4 text-white/50" />
        </div>
        <p className="text-3xl font-black text-white tracking-tight">
          {loading ? "—" : resueltasMes === 0 ? "—" : `${tasaMes}%`}
        </p>
        <div className="w-full h-2 rounded-full overflow-hidden mt-3" style={{ background: "rgba(255,255,255,0.2)" }}>
          <div className="h-full rounded-full" style={{ width: `${loading ? 0 : tasaMes}%`, background: "white" }} />
        </div>
        <p className="text-xs text-white/60 mt-2">
          {loading ? "" : resueltasMes === 0 ? "Sin actividad este mes" : `${resueltasMes} resueltas`}
        </p>
      </div>

      {/* Throughput semanal */}
      <div className="rounded-xl p-3.5" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-tight">
            Throughput / semana
          </span>
          <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: "oklch(0.26 0.065 252 / 0.12)" }}>
            <Zap className="w-3.5 h-3.5" style={{ color: "var(--primary)" }} />
          </div>
        </div>
        <p className="text-2xl font-black text-foreground tracking-tight">
          {loading ? "—" : `${throughputSem} bol.`}
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">{loading ? "" : `${resueltasMes} este mes`}</p>
      </div>

      {/* SLA / Tiempo promedio */}
      <div
        className="rounded-xl p-3.5"
        style={{
          background: tiempoAvg != null && tiempoAvg > 3 ? "oklch(0.97 0.02 27)" : "var(--secondary)",
          border: `1px solid ${tiempoAvg != null && tiempoAvg > 3 ? "oklch(0.88 0.06 27)" : "var(--border)"}`,
        }}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-tight">
            Tiempo promedio
          </span>
          <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: "var(--muted)" }}>
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        </div>
        <p className="text-2xl font-black text-foreground tracking-tight">
          {loading ? "—" : tiempoAvg != null ? `${tiempoAvg.toFixed(1)} d` : "—"}
        </p>
        <p className="text-[11px] mt-1 font-medium" style={{ color: slaColor }}>
          {loading ? "" : slaLabel}
        </p>
      </div>

      {/* Atrasadas */}
      <div
        className="rounded-xl p-3.5"
        style={{
          background: atrasadas > 0 ? "oklch(0.97 0.02 27)" : "var(--secondary)",
          border: `1px solid ${atrasadas > 0 ? "oklch(0.88 0.06 27)" : "var(--border)"}`,
        }}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-tight">
            Fuera de SLA
          </span>
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
            style={{ background: atrasadas > 0 ? "oklch(0.55 0.22 27 / 0.12)" : "var(--muted)" }}
          >
            <AlertTriangle className="w-3.5 h-3.5" style={{ color: atrasadas > 0 ? "oklch(0.55 0.22 27)" : "var(--muted-foreground)" }} />
          </div>
        </div>
        <p
          className="text-2xl font-black tracking-tight"
          style={{ color: atrasadas > 0 ? "oklch(0.45 0.22 27)" : "var(--foreground)" }}
        >
          {loading ? "—" : atrasadas}
        </p>
        <p className="text-[11px] mt-1" style={{ color: atrasadas > 0 ? "oklch(0.55 0.18 27)" : "var(--muted-foreground)" }}>
          {loading ? "" : atrasadas === 0 ? "Al día" : "+3 días sin resolver"}
        </p>
      </div>

      {/* Tasa de rechazo */}
      <div className="rounded-xl p-3.5" style={{ background: "oklch(0.97 0.02 27 / 0.5)", border: "1px solid oklch(0.92 0.04 27)" }}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-tight">
            Tasa de rechazo
          </span>
          <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: "oklch(0.55 0.22 27 / 0.12)" }}>
            <XCircle className="w-3.5 h-3.5" style={{ color: "oklch(0.55 0.22 27)" }} />
          </div>
        </div>
        <p className="text-2xl font-black text-foreground tracking-tight">
          {loading ? "—" : resueltasMes === 0 ? "—" : `${tasaRechazo}%`}
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">
          {loading ? "" : `${rechazadasMes} rechazadas este mes`}
        </p>
      </div>

      {/* Backlog split */}
      <div className="rounded-xl p-3.5" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Backlog — {loading ? "—" : backlog} total
        </p>
        <div className="space-y-2.5">
          {[
            { label: "Pendientes",  value: pendiente,   color: "oklch(0.55 0.14 72)",  icon: Clock },
            { label: "En revisión", value: en_revision, color: "oklch(0.48 0.09 252)", icon: CheckCircle },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label}>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3 h-3 shrink-0" style={{ color }} />
                  <span className="text-[11px] font-medium text-foreground">{label}</span>
                </div>
                <span className="text-[11px] font-bold text-foreground">{loading ? "—" : value}</span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: backlog > 0 ? `${(value / backlog) * 100}%` : "0%", background: color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default function AuditorStatsPanel({ stats, loading, mobile = false }: Props) {
  if (mobile) {
    return (
      <div className="space-y-3">
        <PanelContent stats={stats} loading={loading} />
      </div>
    )
  }

  return (
    <aside
      className="hidden xl:flex flex-col w-72 shrink-0 border-l overflow-y-auto p-4 space-y-3 self-start sticky top-0"
      style={{ borderColor: "var(--border)", maxHeight: "100vh" }}
    >
      <div className="flex items-center gap-2 px-1 pb-1">
        <div className="w-1 h-4 rounded-full shrink-0" style={{ background: "oklch(0.52 0.21 28)" }} />
        <h2 className="text-xs font-bold text-foreground">KPIs Auditoría</h2>
      </div>
      <PanelContent stats={stats} loading={loading} />
    </aside>
  )
}
