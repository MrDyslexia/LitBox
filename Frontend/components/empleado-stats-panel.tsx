"use client"

import { TrendingUp, Wallet, CheckCircle, Timer, CalendarDays, FileText } from "lucide-react"
import { formatMonto } from "@/lib/mock-data"
import type { ApiStats } from "@/lib/types"

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

  const slaColor =
    tiempoAvg == null  ? "var(--muted-foreground)"
    : tiempoAvg < 3   ? "oklch(0.58 0.14 162)"
    : tiempoAvg <= 5  ? "oklch(0.55 0.14 72)"
                      : "oklch(0.55 0.22 27)"
  const slaLabel =
    tiempoAvg == null  ? "Sin datos"
    : tiempoAvg < 3   ? "Respuesta rápida"
    : tiempoAvg <= 5  ? "Normal"
                      : "Lenta"

  const top3 = porTipo.slice(0, 3)
  const maxTipo = top3.length > 0 ? Math.max(...top3.map((t) => t.total)) : 1

  return (
    <>
      {/* Hero — Tasa de aprobación */}
      <div className="rounded-xl p-4" style={{ background: "oklch(0.26 0.065 252)" }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-white/70">Tasa de aprobación</span>
          <TrendingUp className="w-4 h-4 text-white/50" />
        </div>
        <p className="text-3xl font-black text-white tracking-tight">
          {loading ? "—" : resueltas === 0 ? "—" : `${tasaAprobacion}%`}
        </p>
        <div className="w-full h-2 rounded-full overflow-hidden mt-3" style={{ background: "rgba(255,255,255,0.2)" }}>
          <div className="h-full rounded-full" style={{ width: `${loading ? 0 : tasaAprobacion}%`, background: "white" }} />
        </div>
        <p className="text-xs text-white/60 mt-2">
          {loading ? "" : resueltas === 0 ? "Sin boletas resueltas" : `${aprobada + pagada} de ${resueltas}`}
        </p>
      </div>

      {/* Por cobrar */}
      <div
        className="rounded-xl p-3.5"
        style={{
          background: montoPendienteCobro > 0 ? "oklch(0.97 0.02 72 / 0.7)" : "var(--secondary)",
          border: `1px solid ${montoPendienteCobro > 0 ? "oklch(0.92 0.04 72)" : "var(--border)"}`,
        }}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-tight">Por cobrar</span>
          <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: "oklch(0.62 0.14 72 / 0.15)" }}>
            <Wallet className="w-3.5 h-3.5" style={{ color: "oklch(0.55 0.14 72)" }} />
          </div>
        </div>
        <p className="text-2xl font-black text-foreground tracking-tight">
          {loading ? "—" : formatMonto(montoPendienteCobro)}
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">aprobadas pendientes de pago</p>
      </div>

      {/* Total recibido */}
      <div className="rounded-xl p-3.5" style={{ background: "oklch(0.97 0.01 162 / 0.6)", border: "1px solid oklch(0.92 0.02 162)" }}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-tight">Total recibido</span>
          <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: "oklch(0.58 0.14 162 / 0.15)" }}>
            <CheckCircle className="w-3.5 h-3.5" style={{ color: "oklch(0.58 0.14 162)" }} />
          </div>
        </div>
        <p className="text-2xl font-black text-foreground tracking-tight">
          {loading ? "—" : formatMonto(stats?.montoPagado ?? 0)}
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">reembolsado históricamente</p>
      </div>

      {/* Tiempo promedio */}
      <div className="rounded-xl p-3.5" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-tight">Tiempo respuesta</span>
          <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: "var(--muted)" }}>
            <Timer className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        </div>
        <p className="text-2xl font-black text-foreground tracking-tight">
          {loading ? "—" : tiempoAvg != null ? `${tiempoAvg.toFixed(1)} d` : "—"}
        </p>
        <p className="text-[11px] mt-1 font-medium" style={{ color: slaColor }}>{loading ? "" : slaLabel}</p>
      </div>

      {/* Este mes */}
      <div className="rounded-xl p-3.5" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-tight">Este mes</span>
          <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: "var(--muted)" }}>
            <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        </div>
        <p className="text-2xl font-black text-foreground tracking-tight">
          {loading ? "—" : `${boletasMes} boletas`}
        </p>
        {!loading && <p className="text-[11px] text-muted-foreground mt-1">{formatMonto(montoMes)}</p>}
      </div>

      {/* Mis gastos por tipo */}
      {!loading && top3.length > 0 && (
        <div className="rounded-xl p-3.5" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-3 h-3 text-muted-foreground" />
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Mis gastos</p>
          </div>
          <div className="space-y-2.5">
            {top3.map(({ tipo, total }) => (
              <div key={tipo}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] font-medium text-foreground truncate flex-1 pr-2">{tipo}</span>
                  <span className="text-[11px] font-bold text-foreground shrink-0">{total}</span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${(total / maxTipo) * 100}%`, background: "var(--primary)" }} />
                </div>
              </div>
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
    <aside
      className="hidden xl:flex flex-col w-72 shrink-0 border-l overflow-y-auto p-4 space-y-3 self-start sticky top-0"
      style={{ borderColor: "var(--border)", maxHeight: "100vh" }}
    >
      <div className="flex items-center gap-2 px-1 pb-1">
        <div className="w-1 h-4 rounded-full shrink-0" style={{ background: "oklch(0.52 0.21 28)" }} />
        <h2 className="text-xs font-bold text-foreground">KPIs Personales</h2>
      </div>
      <PanelContent stats={stats} loading={loading} montoPendienteCobro={montoPendienteCobro} />
    </aside>
  )
}
