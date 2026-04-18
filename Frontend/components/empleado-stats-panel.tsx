"use client"

import { TrendingUp, Wallet, CheckCircle, Timer, CalendarDays, FileText } from "lucide-react"
import { formatMonto } from "@/lib/mock-data"
import type { ApiStats } from "@/lib/types"
import KpiCard from "@/components/kpi-card"
import StatsAside from "@/components/stats-aside"
import ProgressRow from "@/components/progress-row"

interface Props {
  stats: ApiStats | null
  loading: boolean
  montoPendienteCobro: number
  mobile?: boolean
}

function PanelContent({ stats, loading, montoPendienteCobro }: Omit<Props, "mobile">) {
  const aprobada  = stats?.aprobada ?? 0
  const pagada    = stats?.pagada ?? 0
  const rechazada = stats?.rechazada ?? 0
  const boletasMes = stats?.boletasMes ?? 0
  const montoMes   = stats?.montoMes ?? 0
  const tiempoAvg  = stats?.tiempoPromedioResolucion ?? null
  const porTipo    = stats?.porTipo ?? []

  const resueltas = aprobada + pagada + rechazada
  const tasaAprobacion = Math.round(((aprobada + pagada) / Math.max(resueltas, 1)) * 100)

  const slaTone: "default" | "success" | "warn" | "danger" =
    tiempoAvg == null ? "default"
    : tiempoAvg < 3 ? "success"
    : tiempoAvg <= 5 ? "warn"
    : "danger"
  const slaLabel =
    tiempoAvg == null ? "Sin datos"
    : tiempoAvg < 3 ? "Respuesta rápida"
    : tiempoAvg <= 5 ? "Normal"
    : "Lenta"

  const top3 = porTipo.slice(0, 3)
  const maxTipo = top3.length > 0 ? Math.max(...top3.map((t) => t.total)) : 1

  return (
    <>
      <KpiCard
        tone="primary"
        size="md"
        label="Tasa de aprobación"
        icon={TrendingUp}
        value={loading ? "—" : resueltas === 0 ? "—" : `${tasaAprobacion}%`}
        sub={loading ? "" : resueltas === 0 ? "Sin boletas resueltas" : `${aprobada + pagada} de ${resueltas}`}
        footer={
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.2)" }}>
            <div className="h-full rounded-full" style={{ width: `${loading ? 0 : tasaAprobacion}%`, background: "#fff" }} />
          </div>
        }
      />

      <KpiCard
        tone={montoPendienteCobro > 0 ? "warn" : "muted"}
        size="sm"
        label="Por cobrar"
        icon={Wallet}
        value={loading ? "—" : formatMonto(montoPendienteCobro)}
        sub={loading ? "" : "aprobadas pendientes de pago"}
      />

      <KpiCard
        tone="success"
        size="sm"
        label="Total recibido"
        icon={CheckCircle}
        value={loading ? "—" : formatMonto(stats?.montoPagado ?? 0)}
        sub={loading ? "" : "reembolsado históricamente"}
      />

      <KpiCard
        tone={slaTone}
        size="sm"
        label="Tiempo respuesta"
        icon={Timer}
        value={loading ? "—" : tiempoAvg != null ? `${tiempoAvg.toFixed(1)} d` : "—"}
        sub={loading ? "" : slaLabel}
      />

      <KpiCard
        tone="muted"
        size="sm"
        label="Este mes"
        icon={CalendarDays}
        value={loading ? "—" : `${boletasMes} boletas`}
        sub={loading ? "" : formatMonto(montoMes)}
      />

      {!loading && top3.length > 0 && (
        <div className="rounded-xl border border-border bg-secondary p-3.5">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-3 h-3 text-muted-foreground" />
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Mis gastos
            </p>
          </div>
          <div className="space-y-2.5">
            {top3.map(({ tipo, total }) => (
              <ProgressRow
                key={tipo}
                label={tipo}
                value={total}
                percent={(total / maxTipo) * 100}
                color="var(--chart-2)"
              />
            ))}
          </div>
        </div>
      )}
    </>
  )
}

export default function EmpleadoStatsPanel({ stats, loading, montoPendienteCobro, mobile = false }: Props) {
  if (mobile) {
    return (
      <div className="space-y-3">
        <PanelContent stats={stats} loading={loading} montoPendienteCobro={montoPendienteCobro} />
      </div>
    )
  }
  return (
    <StatsAside title="KPIs Personales" accentColor="var(--accent)">
      <PanelContent stats={stats} loading={loading} montoPendienteCobro={montoPendienteCobro} />
    </StatsAside>
  )
}
