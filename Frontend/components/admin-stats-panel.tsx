"use client"

import { TrendingUp, Timer, AlertTriangle, DollarSign, CheckCircle, Users, BarChart3 } from "lucide-react"
import { formatMonto } from "@/lib/mock-data"
import type { ApiStats } from "@/lib/types"

interface Props {
  stats: ApiStats | null
  loading: boolean
  totalUsuarios: number
  mobile?: boolean
}

function PanelContent({ stats, loading, totalUsuarios }: Omit<Props, "mobile">) {
  const aprobada    = stats?.aprobada ?? 0
  const pagada      = stats?.pagada ?? 0
  const rechazada   = stats?.rechazada ?? 0
  const atrasadas   = stats?.boletasAtrasadas ?? 0
  const montoPagado = stats?.montoPagado ?? 0
  const montoAprobado = stats?.montoAprobado ?? 0
  const pagadasMes  = stats?.pagadasMes ?? 0
  const montoPagadoMes = stats?.montoPagadoMes ?? 0
  const tiempoEndToEnd   = stats?.tiempoEndToEnd ?? null
  const tiempoResolucion = stats?.tiempoPromedioResolucion ?? null
  const porTipo     = stats?.porTipo ?? []

  const resueltas = aprobada + pagada + rechazada
  const tasaAprobacion = resueltas > 0 ? Math.round(((aprobada + pagada) / resueltas) * 100) : 0
  const expensePerUser  = totalUsuarios > 0 ? montoPagado / totalUsuarios : 0
  const top4 = porTipo.slice(0, 4)
  const maxTipo = top4.length > 0 ? Math.max(...top4.map((t) => t.total)) : 1

  const cycleColor =
    tiempoEndToEnd == null  ? "var(--muted-foreground)"
    : tiempoEndToEnd < 7   ? "oklch(0.58 0.14 162)"
    : tiempoEndToEnd <= 14 ? "oklch(0.55 0.14 72)"
                            : "oklch(0.55 0.22 27)"

  return (
    <>
      {/* Hero — Tasa aprobación global */}
      <div className="rounded-xl p-4" style={{ background: "oklch(0.26 0.065 252)" }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-white/70">Aprobación global</span>
          <TrendingUp className="w-4 h-4 text-white/50" />
        </div>
        <p className="text-3xl font-black text-white tracking-tight">
          {loading ? "—" : `${tasaAprobacion}%`}
        </p>
        <div className="w-full h-2 rounded-full overflow-hidden mt-3" style={{ background: "rgba(255,255,255,0.2)" }}>
          <div className="h-full rounded-full" style={{ width: `${loading ? 0 : tasaAprobacion}%`, background: "white" }} />
        </div>
        <p className="text-xs text-white/60 mt-2">
          {loading ? "" : `${resueltas} resueltas en total`}
        </p>
      </div>

      {/* Ciclo E2E */}
      <div className="rounded-xl p-3.5" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-tight">Ciclo E2E</span>
          <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: "var(--muted)" }}>
            <Timer className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        </div>
        <p className="text-2xl font-black text-foreground tracking-tight">
          {loading ? "—" : tiempoEndToEnd != null ? `${tiempoEndToEnd.toFixed(1)} d` : "—"}
        </p>
        <p className="text-[11px] mt-1 font-medium" style={{ color: cycleColor }}>
          {loading ? "" : tiempoEndToEnd == null ? "Sin datos" : tiempoEndToEnd < 7 ? "Eficiente" : tiempoEndToEnd <= 14 ? "Moderado" : "Lento"}
        </p>
      </div>

      {/* Fuera de SLA */}
      <div
        className="rounded-xl p-3.5"
        style={{ background: atrasadas > 0 ? "oklch(0.97 0.02 27)" : "oklch(0.97 0.01 162 / 0.4)", border: `1px solid ${atrasadas > 0 ? "oklch(0.88 0.06 27)" : "oklch(0.92 0.02 162)"}` }}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-tight">Fuera de SLA</span>
          <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
            style={{ background: atrasadas > 0 ? "oklch(0.55 0.22 27 / 0.12)" : "oklch(0.58 0.14 162 / 0.12)" }}>
            <AlertTriangle className="w-3.5 h-3.5" style={{ color: atrasadas > 0 ? "oklch(0.55 0.22 27)" : "oklch(0.58 0.14 162)" }} />
          </div>
        </div>
        <p className="text-2xl font-black tracking-tight" style={{ color: atrasadas > 0 ? "oklch(0.45 0.22 27)" : "var(--foreground)" }}>
          {loading ? "—" : atrasadas}
        </p>
        <p className="text-[11px] mt-1" style={{ color: atrasadas > 0 ? "oklch(0.55 0.18 27)" : "oklch(0.58 0.14 162)" }}>
          {loading ? "" : atrasadas === 0 ? "Sistema al día" : "+3 días sin resolver"}
        </p>
      </div>

      {/* Cash exposure */}
      <div className="rounded-xl p-3.5" style={{ background: "oklch(0.97 0.02 72 / 0.7)", border: "1px solid oklch(0.92 0.04 72)" }}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-tight">Cash Exposure</span>
          <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: "oklch(0.62 0.14 72 / 0.15)" }}>
            <DollarSign className="w-3.5 h-3.5" style={{ color: "oklch(0.55 0.14 72)" }} />
          </div>
        </div>
        <p className="text-2xl font-black text-foreground tracking-tight">
          {loading ? "—" : formatMonto(montoAprobado)}
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">{loading ? "" : `${aprobada} boletas sin pagar`}</p>
      </div>

      {/* Pagadas este mes */}
      <div className="rounded-xl p-3.5" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-tight">Pagadas este mes</span>
          <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: "oklch(0.58 0.14 162 / 0.15)" }}>
            <CheckCircle className="w-3.5 h-3.5" style={{ color: "oklch(0.58 0.14 162)" }} />
          </div>
        </div>
        <p className="text-2xl font-black text-foreground tracking-tight">
          {loading ? "—" : pagadasMes}
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">{loading ? "" : formatMonto(montoPagadoMes)}</p>
      </div>

      {/* Gasto por empleado */}
      <div className="rounded-xl p-3.5" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-tight">Gasto / empleado</span>
          <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: "var(--muted)" }}>
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        </div>
        <p className="text-2xl font-black text-foreground tracking-tight">
          {loading ? "—" : totalUsuarios > 0 ? formatMonto(expensePerUser) : "—"}
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">{loading ? "" : `${totalUsuarios} usuarios`}</p>
      </div>

      {/* Tiempo resolución */}
      <div className="rounded-xl p-3.5" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-tight">Tiempo revisión</span>
          <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: "var(--muted)" }}>
            <Timer className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        </div>
        <p className="text-2xl font-black text-foreground tracking-tight">
          {loading ? "—" : tiempoResolucion != null ? `${tiempoResolucion.toFixed(1)} d` : "—"}
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">creación → auditoría</p>
      </div>

      {/* Distribución gastos */}
      {!loading && top4.length > 0 && (
        <div className="rounded-xl p-3.5" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-3 h-3 text-muted-foreground" />
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Distribución gastos</p>
          </div>
          <div className="space-y-2.5">
            {top4.map(({ tipo, total }) => (
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

export default function AdminStatsPanel({ stats, loading, totalUsuarios, mobile = false }: Props) {
  if (mobile) {
    return (
      <div className="space-y-3">
        <PanelContent stats={stats} loading={loading} totalUsuarios={totalUsuarios} />
      </div>
    )
  }

  return (
    <aside
      className="hidden xl:flex flex-col w-72 shrink-0 border-l overflow-y-auto p-4 space-y-3 self-start sticky top-0"
      style={{ borderColor: "var(--border)", maxHeight: "100vh" }}
    >
      <div className="flex items-center gap-2 px-1 pb-1">
        <div className="w-1 h-4 rounded-full shrink-0" style={{ background: "oklch(0.26 0.065 252)" }} />
        <h2 className="text-xs font-bold text-foreground">KPIs Sistema</h2>
      </div>
      <PanelContent stats={stats} loading={loading} totalUsuarios={totalUsuarios} />
    </aside>
  )
}
