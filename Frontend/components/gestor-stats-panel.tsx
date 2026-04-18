"use client"

import { DollarSign, AlertTriangle, CheckCircle, CalendarDays, Clock, TrendingUp } from "lucide-react"
import { formatMonto } from "@/lib/mock-data"
import type { ApiStats } from "@/lib/types"
import KpiCard from "@/components/kpi-card"
import StatsAside from "@/components/stats-aside"

interface Props {
  stats: ApiStats | null
  loading: boolean
  oldestUnpaidDays: number | null
  mobile?: boolean
}

function PanelContent({ stats, loading, oldestUnpaidDays }: Omit<Props, "mobile">) {
  const aprobada      = stats?.aprobada ?? 0
  const pagada        = stats?.pagada ?? 0
  const pagadasMes    = stats?.pagadasMes ?? 0
  const montoPagado   = stats?.montoPagado ?? 0
  const montoPagadoMes = stats?.montoPagadoMes ?? 0
  const montoAprobado = stats?.montoAprobado ?? 0
  const tiempoEndToEnd = stats?.tiempoEndToEnd ?? null

  const totalClosed = pagada + aprobada
  const paymentRate = totalClosed > 0 ? Math.round((pagada / totalClosed) * 100) : 0

  const dpoTone: "default" | "success" | "warn" | "danger" =
    oldestUnpaidDays == null ? "default"
    : oldestUnpaidDays > 5 ? "danger"
    : oldestUnpaidDays >= 3 ? "warn"
    : "success"

  const cycleTone: "default" | "success" | "warn" | "danger" =
    tiempoEndToEnd == null ? "default"
    : tiempoEndToEnd < 7 ? "success"
    : tiempoEndToEnd <= 14 ? "warn"
    : "danger"

  return (
    <>
      <KpiCard
        tone="primary"
        size="md"
        label="Cash Exposure"
        icon={DollarSign}
        value={loading ? "—" : formatMonto(montoAprobado)}
        sub={loading ? "" : `${aprobada} boleta${aprobada !== 1 ? "s" : ""} sin pagar`}
      />

      <KpiCard
        tone={dpoTone}
        size="sm"
        label="DPO — antigüedad máx."
        icon={AlertTriangle}
        value={loading ? "—" : oldestUnpaidDays != null ? `${oldestUnpaidDays} días` : "—"}
        sub={
          loading ? ""
          : oldestUnpaidDays == null ? "Sin deuda pendiente"
          : oldestUnpaidDays > 5 ? "Pago urgente"
          : oldestUnpaidDays >= 3 ? "Atención requerida"
          : "Al día"
        }
      />

      <KpiCard
        tone="success"
        size="sm"
        label="Payment Rate"
        icon={TrendingUp}
        value={loading ? "—" : `${paymentRate}%`}
        footer={
          <div className="w-full h-1.5 rounded-full overflow-hidden bg-muted">
            <div
              className="h-full rounded-full"
              style={{ width: `${loading ? 0 : paymentRate}%`, background: "var(--chart-3)" }}
            />
          </div>
        }
      />

      <KpiCard
        tone={cycleTone}
        size="sm"
        label="Ciclo E2E"
        icon={Clock}
        value={loading ? "—" : tiempoEndToEnd != null ? `${tiempoEndToEnd.toFixed(1)}d` : "—"}
        sub={
          loading ? ""
          : tiempoEndToEnd == null ? "Sin datos"
          : tiempoEndToEnd < 7 ? "Eficiente"
          : tiempoEndToEnd <= 14 ? "Moderado"
          : "Lento"
        }
      />

      <KpiCard
        tone="muted"
        size="sm"
        label="Pagadas este mes"
        icon={CalendarDays}
        value={loading ? "—" : pagadasMes}
        sub={loading ? "" : formatMonto(montoPagadoMes)}
      />

      <KpiCard
        tone="success"
        size="sm"
        label="Total reembolsado"
        icon={CheckCircle}
        value={loading ? "—" : formatMonto(montoPagado)}
        sub={loading ? "" : `${pagada} boletas históricas`}
      />
    </>
  )
}

export default function GestorStatsPanel({ stats, loading, oldestUnpaidDays, mobile = false }: Props) {
  if (mobile) {
    return (
      <div className="space-y-3">
        <PanelContent stats={stats} loading={loading} oldestUnpaidDays={oldestUnpaidDays} />
      </div>
    )
  }
  return (
    <StatsAside title="KPIs Pagos" accentColor="oklch(0.36 0.08 252)">
      <PanelContent stats={stats} loading={loading} oldestUnpaidDays={oldestUnpaidDays} />
    </StatsAside>
  )
}
