"use client"

import { Clock, CheckCircle, CalendarDays, AlertCircle, Timer } from "lucide-react"
import { formatMonto } from "@/lib/mock-data"
import type { ApiStats } from "@/lib/types"

interface Props {
  stats: ApiStats | null
  loading: boolean
  oldestUnpaidDays: number | null
  mobile?: boolean
}

function PanelContent({ stats, loading, oldestUnpaidDays }: Omit<Props, "mobile">) {
  const aprobada = stats?.aprobada ?? 0
  const pagada = stats?.pagada ?? 0
  const pagadasMes = stats?.pagadasMes ?? 0
  const montoPagado = stats?.montoPagado ?? 0
  const montoPagadoMes = stats?.montoPagadoMes ?? 0
  const montoAprobado = stats?.montoAprobado ?? 0

  const oldestLabel =
    oldestUnpaidDays !== null ? `${oldestUnpaidDays} días sin pagar` : "—"
  const oldestSubtitle =
    oldestUnpaidDays !== null && oldestUnpaidDays > 5 ? "Atención requerida" : "Al día"
  const oldestSubtitleColor =
    oldestUnpaidDays !== null && oldestUnpaidDays > 5
      ? "oklch(0.55 0.22 27)"
      : undefined

  const isOldestAlert = !loading && oldestUnpaidDays !== null && oldestUnpaidDays > 5

  return (
    <>
      {/* Hero card — Por pagar (most critical metric for gestor) */}
      <div
        className="rounded-xl p-4"
        style={{ background: "oklch(0.42 0.18 290)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-white/70">
            Por pagar
          </span>
          <Clock className="w-4 h-4 text-white/50" />
        </div>
        <p className="text-3xl font-black text-white tracking-tight">
          {loading ? "—" : aprobada}
        </p>
        {!loading && (
          <p className="text-xs text-white/60 mt-2">{formatMonto(montoAprobado)}</p>
        )}
      </div>

      {/* Green tint — Total pagado */}
      <div
        className="rounded-xl p-3.5"
        style={{
          background: "oklch(0.97 0.01 162 / 0.6)",
          border: "1px solid oklch(0.92 0.02 162)",
        }}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-tight">
            Total pagado
          </span>
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
            style={{ background: "oklch(0.58 0.14 162 / 0.15)" }}
          >
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

      {/* Blue tint — Pagadas este mes */}
      <div
        className="rounded-xl p-3.5"
        style={{
          background: "oklch(0.97 0.02 240 / 0.6)",
          border: "1px solid oklch(0.92 0.03 240)",
        }}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-tight">
            Pagadas este mes
          </span>
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
            style={{ background: "oklch(0.55 0.16 240 / 0.12)" }}
          >
            <CalendarDays className="w-3.5 h-3.5" style={{ color: "var(--primary)" }} />
          </div>
        </div>
        <p className="text-2xl font-black text-foreground tracking-tight">
          {loading ? "—" : pagadasMes}
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">
          {loading ? "" : formatMonto(montoPagadoMes)}
        </p>
      </div>

      {/* Alert card — Boleta mas antigua sin pagar */}
      <div
        className="rounded-xl p-3.5"
        style={{
          background: isOldestAlert ? "oklch(0.97 0.02 27)" : "var(--secondary)",
          border: `1px solid ${isOldestAlert ? "oklch(0.88 0.06 27)" : "var(--border)"}`,
        }}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-tight">
            Boleta más antigua sin pagar
          </span>
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
            style={{
              background: isOldestAlert
                ? "oklch(0.55 0.22 27 / 0.12)"
                : "var(--muted)",
            }}
          >
            <AlertCircle
              className="w-3.5 h-3.5"
              style={{
                color: isOldestAlert ? "oklch(0.55 0.22 27)" : undefined,
              }}
            />
          </div>
        </div>
        <p className="text-2xl font-black text-foreground tracking-tight">
          {loading ? "—" : oldestLabel}
        </p>
        {!loading && (
          <p
            className="text-[11px] mt-1"
            style={oldestSubtitleColor ? { color: oldestSubtitleColor } : { color: "var(--muted-foreground)" }}
          >
            {oldestSubtitle}
          </p>
        )}
      </div>

      {/* Gray — Tiempo promedio de pago */}
      <div
        className="rounded-xl p-3.5"
        style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-tight">
            Tiempo promedio de pago
          </span>
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
            style={{ background: "var(--muted)" }}
          >
            <Timer className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        </div>
        <p className="text-2xl font-black text-foreground tracking-tight">
          {loading
            ? "—"
            : stats?.tiempoEndToEnd != null
            ? `${stats.tiempoEndToEnd.toFixed(1)} días`
            : "—"}
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">desde aprobación hasta pago</p>
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
        <div className="w-1 h-4 rounded-full shrink-0" style={{ background: "oklch(0.42 0.18 290)" }} />
        <h2 className="text-xs font-bold text-foreground">Estadísticas</h2>
      </div>
      <PanelContent stats={stats} loading={loading} oldestUnpaidDays={oldestUnpaidDays} />
    </aside>
  )
}
