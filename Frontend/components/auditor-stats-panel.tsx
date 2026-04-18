"use client"

import { TrendingUp, AlertTriangle, Zap, Clock, CheckCircle, XCircle } from "lucide-react"
import type { ApiStats } from "@/lib/types"
import KpiCard from "@/components/kpi-card"
import StatsAside from "@/components/stats-aside"
import ProgressRow from "@/components/progress-row"

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

  const slaTone: "default" | "success" | "warn" | "danger" =
    tiempoAvg == null ? "default"
    : tiempoAvg < 2 ? "success"
    : tiempoAvg <= 3 ? "warn"
    : "danger"
  const slaLabel =
    tiempoAvg == null ? "Sin datos"
    : tiempoAvg < 2 ? "Dentro de SLA"
    : tiempoAvg <= 3 ? "En límite"
    : "Fuera de SLA"

  return (
    <>
      <KpiCard
        tone="accent"
        size="md"
        label="Aprobación (mes)"
        icon={TrendingUp}
        value={loading ? "—" : resueltasMes === 0 ? "—" : `${tasaMes}%`}
        sub={loading ? "" : resueltasMes === 0 ? "Sin actividad este mes" : `${resueltasMes} resueltas`}
        footer={
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.2)" }}>
            <div className="h-full rounded-full" style={{ width: `${loading ? 0 : tasaMes}%`, background: "#fff" }} />
          </div>
        }
      />

      <KpiCard
        tone="muted"
        size="sm"
        label="Throughput / semana"
        icon={Zap}
        value={loading ? "—" : `${throughputSem} bol.`}
        sub={loading ? "" : `${resueltasMes} este mes`}
      />

      <KpiCard
        tone={slaTone}
        size="sm"
        label="Tiempo promedio"
        icon={Clock}
        value={loading ? "—" : tiempoAvg != null ? `${tiempoAvg.toFixed(1)}d` : "—"}
        sub={loading ? "" : slaLabel}
      />

      <KpiCard
        tone={atrasadas > 0 ? "danger" : "muted"}
        size="sm"
        label="Fuera de SLA"
        icon={AlertTriangle}
        value={loading ? "—" : atrasadas}
        sub={loading ? "" : atrasadas === 0 ? "Al día" : "+3 días sin resolver"}
      />

      <KpiCard
        tone="danger"
        size="sm"
        label="Tasa de rechazo"
        icon={XCircle}
        value={loading ? "—" : resueltasMes === 0 ? "—" : `${tasaRechazo}%`}
        sub={loading ? "" : `${rechazadasMes} rechazadas este mes`}
      />

      {/* Backlog split */}
      <div className="rounded-xl border border-border bg-secondary p-3.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-3">
          Backlog — {loading ? "—" : backlog} total
        </p>
        <div className="space-y-2.5">
          <ProgressRow
            label="Pendientes"
            value={loading ? "—" : pendiente}
            percent={backlog > 0 ? (pendiente / backlog) * 100 : 0}
            color="var(--chart-4)"
            leading={<Clock className="w-3 h-3 shrink-0" style={{ color: "var(--chart-4)" }} />}
          />
          <ProgressRow
            label="En revisión"
            value={loading ? "—" : en_revision}
            percent={backlog > 0 ? (en_revision / backlog) * 100 : 0}
            color="var(--chart-1)"
            leading={<CheckCircle className="w-3 h-3 shrink-0" style={{ color: "var(--chart-1)" }} />}
          />
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
    <StatsAside title="KPIs Auditoría" accentColor="var(--accent)">
      <PanelContent stats={stats} loading={loading} />
    </StatsAside>
  )
}
