"use client"

import { TrendingUp, Timer, AlertCircle, CalendarDays, Users } from "lucide-react"
import { formatMonto } from "@/lib/mock-data"
import type { ApiStats } from "@/lib/types"

interface Props {
  stats: ApiStats | null
  loading: boolean
  totalUsuarios: number
  mobile?: boolean
}

function PanelContent({ stats, loading, totalUsuarios }: Omit<Props, "mobile">) {
  const aprobada = stats?.aprobada ?? 0
  const pagada = stats?.pagada ?? 0
  const rechazada = stats?.rechazada ?? 0
  const tasaAprobacion = Math.round(
    ((aprobada + pagada) / Math.max(aprobada + pagada + rechazada, 1)) * 100
  )

  const boletasAtrasadas = stats?.boletasAtrasadas ?? 0
  const pagadasMes = stats?.pagadasMes ?? 0
  const montoPagadoMes = stats?.montoPagadoMes ?? 0

  const porTipo = stats?.porTipo ?? []
  const top4 = porTipo.slice(0, 4)
  const maxTipo = top4.length > 0 ? Math.max(...top4.map((t) => t.total)) : 1

  const isAtrasadasAlert = !loading && boletasAtrasadas > 0

  return (
    <>
      {/* Hero card — Tasa de aprobacion global */}
      <div
        className="rounded-xl p-4"
        style={{ background: "oklch(0.28 0.1 243)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-white/70">
            Tasa de aprobación global
          </span>
          <TrendingUp className="w-4 h-4 text-white/50" />
        </div>
        <p className="text-3xl font-black text-white tracking-tight">
          {loading ? "—" : `${tasaAprobacion}%`}
        </p>
        <div
          className="w-full h-2 rounded-full overflow-hidden mt-3"
          style={{ background: "rgba(255,255,255,0.2)" }}
        >
          <div
            className="h-full rounded-full"
            style={{ width: `${loading ? 0 : tasaAprobacion}%`, background: "white" }}
          />
        </div>
        <p className="text-xs text-white/60 mt-2">del total de solicitudes resueltas</p>
      </div>

      {/* Gray — Tiempo end-to-end */}
      <div
        className="rounded-xl p-3.5"
        style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-tight">
            Tiempo end-to-end
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
        <p className="text-[11px] text-muted-foreground mt-1">creación → pago promedio</p>
      </div>

      {/* Alert card — Boletas atrasadas */}
      <div
        className="rounded-xl p-3.5"
        style={{
          background: isAtrasadasAlert
            ? "oklch(0.97 0.02 27)"
            : "oklch(0.97 0.01 162 / 0.4)",
          border: `1px solid ${isAtrasadasAlert ? "oklch(0.88 0.06 27)" : "oklch(0.92 0.02 162)"}`,
        }}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-tight">
            Boletas atrasadas
          </span>
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
            style={{
              background: isAtrasadasAlert
                ? "oklch(0.55 0.22 27 / 0.12)"
                : "oklch(0.58 0.14 162 / 0.12)",
            }}
          >
            <AlertCircle
              className="w-3.5 h-3.5"
              style={{
                color: isAtrasadasAlert
                  ? "oklch(0.55 0.22 27)"
                  : "oklch(0.58 0.14 162)",
              }}
            />
          </div>
        </div>
        <p
          className="text-2xl font-black tracking-tight"
          style={{
            color: isAtrasadasAlert ? "oklch(0.45 0.22 27)" : "var(--foreground)",
          }}
        >
          {loading ? "—" : boletasAtrasadas}
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">
          {isAtrasadasAlert ? "+3 días sin resolver" : "todo al día"}
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

      {/* Gray — Usuarios registrados */}
      <div
        className="rounded-xl p-3.5"
        style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-tight">
            Usuarios registrados
          </span>
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
            style={{ background: "var(--muted)" }}
          >
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        </div>
        <p className="text-2xl font-black text-foreground tracking-tight">
          {loading ? "—" : totalUsuarios}
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">en el sistema</p>
      </div>

      {/* Type distribution bars */}
      {!loading && top4.length > 0 && (
        <div
          className="rounded-xl p-3.5"
          style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Distribución de gastos
          </p>
          <div className="space-y-2.5">
            {top4.map(({ tipo, total }) => (
              <div key={tipo}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] font-medium text-foreground truncate flex-1 pr-2">
                    {tipo}
                  </span>
                  <span className="text-[11px] font-bold text-foreground shrink-0">{total}</span>
                </div>
                <div
                  className="w-full h-2 rounded-full overflow-hidden"
                  style={{ background: "var(--muted)" }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${(total / maxTipo) * 100}%`, background: "var(--primary)" }}
                  />
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
        <div className="w-1 h-4 rounded-full shrink-0" style={{ background: "oklch(0.28 0.1 243)" }} />
        <h2 className="text-xs font-bold text-foreground">Estadísticas</h2>
      </div>
      <PanelContent stats={stats} loading={loading} totalUsuarios={totalUsuarios} />
    </aside>
  )
}
