"use client"

import { DollarSign, AlertTriangle, CheckCircle, CalendarDays, Clock, TrendingUp } from "lucide-react"
import { formatMonto } from "@/lib/mock-data"
import type { ApiStats } from "@/lib/types"

const GESTOR_COLOR = "oklch(0.36 0.08 252)"

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
  const atrasadas     = stats?.boletasAtrasadas ?? 0

  // Payment rate
  const totalClosed = pagada + aprobada
  const paymentRate = totalClosed > 0 ? Math.round((pagada / totalClosed) * 100) : 0

  // DPO semáforo
  const dpoBad  = oldestUnpaidDays != null && oldestUnpaidDays > 5
  const dpoWarn = oldestUnpaidDays != null && oldestUnpaidDays >= 3 && !dpoBad
  const dpoColor = dpoBad ? "oklch(0.55 0.22 27)" : dpoWarn ? "oklch(0.55 0.14 72)" : oldestUnpaidDays != null ? "oklch(0.58 0.14 162)" : "var(--muted-foreground)"
  const dpoBg    = dpoBad ? "oklch(0.97 0.02 27)" : dpoWarn ? "oklch(0.97 0.03 72)" : "var(--secondary)"
  const dpoBorder = dpoBad ? "oklch(0.88 0.06 27)" : dpoWarn ? "oklch(0.88 0.07 72)" : "var(--border)"

  // Cycle semáforo
  const cycleColor =
    tiempoEndToEnd == null  ? "var(--muted-foreground)"
    : tiempoEndToEnd < 7   ? "oklch(0.58 0.14 162)"
    : tiempoEndToEnd <= 14 ? "oklch(0.55 0.14 72)"
                            : "oklch(0.55 0.22 27)"

  return (
    <>
      {/* Hero — Cash Exposure */}
      <div className="rounded-xl p-4" style={{ background: GESTOR_COLOR }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-white/70">Cash Exposure</span>
          <DollarSign className="w-4 h-4 text-white/50" />
        </div>
        <p className="text-3xl font-black text-white tracking-tight">
          {loading ? "—" : formatMonto(montoAprobado)}
        </p>
        <p className="text-xs text-white/60 mt-2">
          {loading ? "" : `${aprobada} boleta${aprobada !== 1 ? "s" : ""} sin pagar`}
        </p>
      </div>

      {/* DPO */}
      <div className="rounded-xl p-3.5" style={{ background: dpoBg, border: `1px solid ${dpoBorder}` }}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-tight">
            DPO — Antigüedad máx.
          </span>
          <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
            style={{ background: dpoBad ? "oklch(0.55 0.22 27 / 0.12)" : dpoWarn ? "oklch(0.55 0.14 72 / 0.15)" : "var(--muted)" }}>
            <AlertTriangle className="w-3.5 h-3.5" style={{ color: dpoColor }} />
          </div>
        </div>
        <p className="text-2xl font-black text-foreground tracking-tight">
          {loading ? "—" : oldestUnpaidDays != null ? `${oldestUnpaidDays} días` : "—"}
        </p>
        <p className="text-[11px] mt-1 font-medium" style={{ color: dpoColor }}>
          {loading ? "" : oldestUnpaidDays == null ? "Sin deuda pendiente" : dpoBad ? "Pago urgente" : dpoWarn ? "Atención requerida" : "Al día"}
        </p>
      </div>

      {/* Payment Rate */}
      <div className="rounded-xl p-3.5" style={{ background: "oklch(0.97 0.01 162 / 0.6)", border: "1px solid oklch(0.92 0.02 162)" }}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-tight">
            Payment Rate
          </span>
          <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: "oklch(0.58 0.14 162 / 0.15)" }}>
            <TrendingUp className="w-3.5 h-3.5" style={{ color: "oklch(0.58 0.14 162)" }} />
          </div>
        </div>
        <p className="text-2xl font-black text-foreground tracking-tight">
          {loading ? "—" : `${paymentRate}%`}
        </p>
        <div className="w-full h-1.5 rounded-full overflow-hidden mt-2" style={{ background: "var(--muted)" }}>
          <div className="h-full rounded-full" style={{ width: `${loading ? 0 : paymentRate}%`, background: "oklch(0.58 0.14 162)" }} />
        </div>
      </div>

      {/* Ciclo E2E */}
      <div className="rounded-xl p-3.5" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-tight">
            Ciclo E2E
          </span>
          <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: "var(--muted)" }}>
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        </div>
        <p className="text-2xl font-black text-foreground tracking-tight">
          {loading ? "—" : tiempoEndToEnd != null ? `${tiempoEndToEnd.toFixed(1)} d` : "—"}
        </p>
        <p className="text-[11px] mt-1 font-medium" style={{ color: cycleColor }}>
          {loading ? "" : tiempoEndToEnd == null ? "Sin datos" : tiempoEndToEnd < 7 ? "Eficiente" : tiempoEndToEnd <= 14 ? "Moderado" : "Lento"}
        </p>
      </div>

      {/* Pagadas este mes */}
      <div className="rounded-xl p-3.5" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-tight">
            Pagadas este mes
          </span>
          <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: "oklch(0.94 0.02 252)" }}>
            <CalendarDays className="w-3.5 h-3.5" style={{ color: GESTOR_COLOR }} />
          </div>
        </div>
        <p className="text-2xl font-black text-foreground tracking-tight">
          {loading ? "—" : pagadasMes}
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">
          {loading ? "" : formatMonto(montoPagadoMes)}
        </p>
      </div>

      {/* Total histórico */}
      <div className="rounded-xl p-3.5" style={{ background: "oklch(0.97 0.01 162 / 0.5)", border: "1px solid oklch(0.92 0.02 162)" }}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-tight">
            Total reembolsado
          </span>
          <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: "oklch(0.58 0.14 162 / 0.15)" }}>
            <CheckCircle className="w-3.5 h-3.5" style={{ color: "oklch(0.58 0.14 162)" }} />
          </div>
        </div>
        <p className="text-2xl font-black text-foreground tracking-tight">
          {loading ? "—" : formatMonto(montoPagado)}
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">
          {loading ? "" : `${pagada} boletas históricas`}
        </p>
      </div>
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
    <aside
      className="hidden xl:flex flex-col w-72 shrink-0 border-l overflow-y-auto p-4 space-y-3 self-start sticky top-0"
      style={{ borderColor: "var(--border)", maxHeight: "100vh" }}
    >
      <div className="flex items-center gap-2 px-1 pb-1">
        <div className="w-1 h-4 rounded-full shrink-0" style={{ background: GESTOR_COLOR }} />
        <h2 className="text-xs font-bold text-foreground">KPIs Pagos</h2>
      </div>
      <PanelContent stats={stats} loading={loading} oldestUnpaidDays={oldestUnpaidDays} />
    </aside>
  )
}
