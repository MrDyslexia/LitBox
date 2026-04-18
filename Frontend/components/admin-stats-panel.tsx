"use client"

import { TrendingUp, Timer, AlertTriangle, DollarSign, CheckCircle, Users, BarChart3 } from "lucide-react"
import { formatMonto } from "@/lib/mock-data"
import type { ApiStats } from "@/lib/types"
import KpiCard from "@/components/kpi-card"
import StatsAside from "@/components/stats-aside"
import ProgressRow from "@/components/progress-row"

interface Props {
  stats: ApiStats | null
  loading: boolean
  totalUsuarios: number
  mobile?: boolean
}

function PanelContent({ stats, loading, totalUsuarios }: Omit<Props, "mobile">) {
  const aprobada      = stats?.aprobada ?? 0
  const pagada        = stats?.pagada ?? 0
  const rechazada     = stats?.rechazada ?? 0
  const atrasadas     = stats?.boletasAtrasadas ?? 0
  const montoPagado   = stats?.montoPagado ?? 0
  const montoAprobado = stats?.montoAprobado ?? 0
  const pagadasMes    = stats?.pagadasMes ?? 0
  const montoPagadoMes = stats?.montoPagadoMes ?? 0
  const tiempoEndToEnd   = stats?.tiempoEndToEnd ?? null
  const tiempoResolucion = stats?.tiempoPromedioResolucion ?? null
  const porTipo     = stats?.porTipo ?? []

  const resueltas = aprobada + pagada + rechazada
  const tasaAprobacion = resueltas > 0 ? Math.round(((aprobada + pagada) / resueltas) * 100) : 0
  const expensePerUser  = totalUsuarios > 0 ? montoPagado / totalUsuarios : 0
  const top4 = porTipo.slice(0, 4)
  const maxTipo = top4.length > 0 ? Math.max(...top4.map((t) => t.total)) : 1

  const cycleLabel =
    tiempoEndToEnd == null  ? "Sin datos"
    : tiempoEndToEnd < 7   ? "Eficiente"
    : tiempoEndToEnd <= 14 ? "Moderado"
                            : "Lento"
  const cycleTone: "default" | "success" | "warn" | "danger" =
    tiempoEndToEnd == null ? "default"
    : tiempoEndToEnd < 7 ? "success"
    : tiempoEndToEnd <= 14 ? "warn"
    : "danger"

  return (
    <>
      {/* Hero — Tasa aprobación global */}
      <KpiCard
        tone="primary"
        size="md"
        label="Aprobación global"
        icon={TrendingUp}
        value={loading ? "—" : `${tasaAprobacion}%`}
        sub={loading ? "" : `${resueltas} resueltas en total`}
        footer={
          <div
            className="w-full h-1.5 rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.18)" }}
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${loading ? 0 : tasaAprobacion}%`, background: "#fff" }}
            />
          </div>
        }
      />

      <KpiCard
        tone={cycleTone}
        size="sm"
        label="Ciclo E2E"
        icon={Timer}
        value={loading ? "—" : tiempoEndToEnd != null ? `${tiempoEndToEnd.toFixed(1)}d` : "—"}
        sub={loading ? "" : cycleLabel}
      />

      <KpiCard
        tone={atrasadas > 0 ? "danger" : "success"}
        size="sm"
        label="Fuera de SLA"
        icon={AlertTriangle}
        value={loading ? "—" : atrasadas}
        sub={loading ? "" : atrasadas === 0 ? "Sistema al día" : "+3 días sin resolver"}
      />

      <KpiCard
        tone="warn"
        size="sm"
        label="Cash Exposure"
        icon={DollarSign}
        value={loading ? "—" : formatMonto(montoAprobado)}
        sub={loading ? "" : `${aprobada} sin pagar`}
      />

      <KpiCard
        tone="muted"
        size="sm"
        label="Pagadas / mes"
        icon={CheckCircle}
        value={loading ? "—" : pagadasMes}
        sub={loading ? "" : formatMonto(montoPagadoMes)}
      />

      <KpiCard
        tone="muted"
        size="sm"
        label="Gasto / empleado"
        icon={Users}
        value={loading ? "—" : totalUsuarios > 0 ? formatMonto(expensePerUser) : "—"}
        sub={loading ? "" : `${totalUsuarios} usuarios`}
      />

      <KpiCard
        tone="muted"
        size="sm"
        label="Tiempo revisión"
        icon={Timer}
        value={loading ? "—" : tiempoResolucion != null ? `${tiempoResolucion.toFixed(1)}d` : "—"}
        sub="creación → auditoría"
      />

      {/* Distribución por tipo */}
      {!loading && top4.length > 0 && (
        <div className="rounded-xl border border-border bg-secondary p-3.5">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-3 h-3 text-muted-foreground" />
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Distribución gastos
            </p>
          </div>
          <div className="space-y-2.5">
            {top4.map(({ tipo, total }) => (
              <ProgressRow
                key={tipo}
                label={tipo}
                value={total}
                percent={(total / maxTipo) * 100}
                color="var(--chart-1)"
              />
            ))}
          </div>
        </div>
      )}
    </>
  )
}

export default function AdminStatsPanel({ stats, loading, totalUsuarios, mobile = false }: Props) {
  if (mobile) {
    return (
      <div className="space-y-3">
        <PanelContent stats={stats} loading={loading} totalUsuarios={totalUsuarios} />
      </div>
    )
  }
  return (
    <StatsAside title="KPIs Sistema" accentColor="var(--chart-1)">
      <PanelContent stats={stats} loading={loading} totalUsuarios={totalUsuarios} />
    </StatsAside>
  )
}
