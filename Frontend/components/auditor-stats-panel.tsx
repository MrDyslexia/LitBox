"use client"

import { TrendingUp, CheckCircle, XCircle, Timer, Clock } from "lucide-react"
import type { ApiStats } from "@/lib/types"

interface Props {
  stats: ApiStats | null
  loading: boolean
  mobile?: boolean
}

function PanelContent({ stats, loading }: Omit<Props, "mobile">) {
  const resueltasMes = stats?.resueltasMes ?? 0
  const aprobadasMes = stats?.aprobadasMes ?? 0
  const rechazadasMes = stats?.rechazadasMes ?? 0

  const tasaMesValue = resueltasMes === 0 ? "—" : `${Math.round((aprobadasMes / resueltasMes) * 100)}%`
  const tasaMesPct = resueltasMes === 0 ? 0 : Math.round((aprobadasMes / resueltasMes) * 100)
  const tasaSubtitle = resueltasMes === 0 ? "Sin actividad este mes" : `${resueltasMes} resueltas este mes`

  const pendiente = stats?.pendiente ?? 0
  const en_revision = stats?.en_revision ?? 0
  const aprobada = stats?.aprobada ?? 0
  const rechazada = stats?.rechazada ?? 0

  return (
    <>
      {/* Hero card — Tasa de aprobacion este mes */}
      <div
        className="rounded-xl p-4"
        style={{ background: "oklch(0.52 0.16 72)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-white/70">
            Tasa de aprobación (mes)
          </span>
          <TrendingUp className="w-4 h-4 text-white/50" />
        </div>
        <p className="text-3xl font-black text-white tracking-tight">
          {loading ? "—" : tasaMesValue}
        </p>
        <div
          className="w-full h-2 rounded-full overflow-hidden mt-3"
          style={{ background: "rgba(255,255,255,0.2)" }}
        >
          <div
            className="h-full rounded-full"
            style={{ width: `${loading ? 0 : tasaMesPct}%`, background: "white" }}
          />
        </div>
        <p className="text-xs text-white/60 mt-2">{loading ? "" : tasaSubtitle}</p>
      </div>

      {/* Green tint — Aprobadas este mes */}
      <div
        className="rounded-xl p-3.5"
        style={{
          background: "oklch(0.97 0.01 162 / 0.6)",
          border: "1px solid oklch(0.92 0.02 162)",
        }}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-tight">
            Aprobadas este mes
          </span>
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
            style={{ background: "oklch(0.58 0.14 162 / 0.15)" }}
          >
            <CheckCircle className="w-3.5 h-3.5" style={{ color: "oklch(0.58 0.14 162)" }} />
          </div>
        </div>
        <p className="text-2xl font-black text-foreground tracking-tight">
          {loading ? "—" : aprobadasMes}
        </p>
      </div>

      {/* Red tint — Rechazadas este mes */}
      <div
        className="rounded-xl p-3.5"
        style={{
          background: "oklch(0.97 0.02 27 / 0.6)",
          border: "1px solid oklch(0.92 0.04 27)",
        }}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-tight">
            Rechazadas este mes
          </span>
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
            style={{ background: "oklch(0.55 0.22 27 / 0.12)" }}
          >
            <XCircle className="w-3.5 h-3.5" style={{ color: "oklch(0.55 0.22 27)" }} />
          </div>
        </div>
        <p className="text-2xl font-black text-foreground tracking-tight">
          {loading ? "—" : rechazadasMes}
        </p>
      </div>

      {/* Gray — Tiempo promedio */}
      <div
        className="rounded-xl p-3.5"
        style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-tight">
            Tiempo promedio
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
            : stats?.tiempoPromedioResolucion != null
            ? `${stats.tiempoPromedioResolucion.toFixed(1)} días`
            : "—"}
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">de resolución propio</p>
      </div>

      {/* Amber tint — Global: Por revisar */}
      <div
        className="rounded-xl p-3.5"
        style={{
          background: "oklch(0.97 0.02 72 / 0.7)",
          border: "1px solid oklch(0.92 0.04 72)",
        }}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-tight">
            Global: Por revisar
          </span>
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
            style={{ background: "oklch(0.62 0.14 72 / 0.15)" }}
          >
            <Clock className="w-3.5 h-3.5" style={{ color: "oklch(0.55 0.14 72)" }} />
          </div>
        </div>
        <p className="text-2xl font-black text-foreground tracking-tight">
          {loading ? "—" : pendiente + en_revision}
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">en cola total</p>
      </div>

      {/* Split card — Global: Aprobadas / Rechazadas */}
      <div
        className="rounded-xl p-3.5"
        style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Global: Aprobadas / Rechazadas
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div
            className="text-center p-2 rounded-lg"
            style={{ background: "oklch(0.95 0.04 162 / 0.5)" }}
          >
            <p
              className="text-xl font-black"
              style={{ color: "oklch(0.45 0.14 162)" }}
            >
              {loading ? "—" : aprobada}
            </p>
            <p
              className="text-[10px] font-medium mt-0.5"
              style={{ color: "oklch(0.55 0.1 162)" }}
            >
              Aprobadas
            </p>
          </div>
          <div
            className="text-center p-2 rounded-lg"
            style={{ background: "oklch(0.97 0.02 27 / 0.5)" }}
          >
            <p
              className="text-xl font-black"
              style={{ color: "oklch(0.45 0.22 27)" }}
            >
              {loading ? "—" : rechazada}
            </p>
            <p
              className="text-[10px] font-medium mt-0.5"
              style={{ color: "oklch(0.55 0.18 27)" }}
            >
              Rechazadas
            </p>
          </div>
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
        <div className="w-1 h-4 rounded-full shrink-0" style={{ background: "oklch(0.52 0.16 72)" }} />
        <h2 className="text-xs font-bold text-foreground">Estadísticas</h2>
      </div>
      <PanelContent stats={stats} loading={loading} />
    </aside>
  )
}
