"use client"

import { useState, useEffect, useCallback } from "react"
import {
  TrendingUp, Clock, CheckCircle, XCircle, Timer,
  AlertTriangle, BarChart3, Target, Zap,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import { boletasApi } from "@/lib/api"
import type { ApiStats } from "@/lib/types"

export default function AuditorEstadisticasPage() {
  const [stats, setStats] = useState<ApiStats | null>(null)
  const [loading, setLoading] = useState(true)

  const loadStats = useCallback(async () => {
    setLoading(true)
    try {
      setStats(await boletasApi.stats())
    } catch (err) {
      console.error("Error cargando estadísticas:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadStats() }, [loadStats])

  const resueltasMes  = stats?.resueltasMes ?? 0
  const aprobadasMes  = stats?.aprobadasMes ?? 0
  const rechazadasMes = stats?.rechazadasMes ?? 0
  const pendiente     = stats?.pendiente ?? 0
  const en_revision   = stats?.en_revision ?? 0
  const aprobada      = stats?.aprobada ?? 0
  const rechazada     = stats?.rechazada ?? 0
  const atrasadas     = stats?.boletasAtrasadas ?? 0
  const tiempoAvg     = stats?.tiempoPromedioResolucion ?? null
  const porTipo       = stats?.porTipo ?? []

  const tasaMes      = resueltasMes > 0 ? Math.round((aprobadasMes / resueltasMes) * 100) : null
  const tasaRechazo  = resueltasMes > 0 ? Math.round((rechazadasMes / resueltasMes) * 100) : null
  const throughputSem = Math.round(resueltasMes / 4.3)

  // Tasa global (histórica)
  const totalResueltas = aprobada + rechazada
  const tasaGlobal = totalResueltas > 0 ? Math.round((aprobada / totalResueltas) * 100) : null

  // SLA semáforo
  const slaOk    = tiempoAvg != null && tiempoAvg < 2
  const slaWarn  = tiempoAvg != null && tiempoAvg >= 2 && tiempoAvg <= 3
  const slaBad   = tiempoAvg != null && tiempoAvg > 3
  const slaColor = slaOk ? "oklch(0.58 0.14 162)" : slaWarn ? "oklch(0.55 0.14 72)" : slaBad ? "oklch(0.55 0.22 27)" : "var(--muted-foreground)"
  const slaBg    = slaOk ? "oklch(0.97 0.01 162 / 0.6)" : slaWarn ? "oklch(0.97 0.03 72)" : slaBad ? "oklch(0.97 0.02 27)" : "var(--secondary)"
  const slaBorder = slaOk ? "oklch(0.92 0.02 162)" : slaWarn ? "oklch(0.88 0.07 72)" : slaBad ? "oklch(0.88 0.06 27)" : "var(--border)"
  const slaLabel  = slaOk ? "Dentro de SLA (<2 días)" : slaWarn ? "En límite (2–3 días)" : slaBad ? "Fuera de SLA (>3 días)" : "Sin datos suficientes"

  const top5Tipos = porTipo.slice(0, 5)
  const maxTipo   = top5Tipos.length > 0 ? Math.max(...top5Tipos.map((t) => t.total)) : 1

  const V = loading ? "—" : undefined

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl">
      <BreadcrumbNav
        items={[
          { label: "Resumen", href: "/auditor" },
          { label: "Estadísticas" },
        ]}
      />
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Estadísticas de auditoría</h1>
        <p className="text-muted-foreground text-sm mt-1">
          KPIs operacionales de rendimiento y calidad de revisión.
        </p>
      </div>

      {/* ── SECCIÓN 1: RENDIMIENTO PERSONAL ─────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Target className="w-3.5 h-3.5" />
          Rendimiento — este mes
        </h2>

        {/* Hero: throughput + tasa */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Throughput */}
          <div className="rounded-2xl p-5" style={{ background: "var(--primary)" }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-white/70">
                Throughput semanal
              </span>
              <Zap className="w-4 h-4 text-white/40" />
            </div>
            <p className="text-5xl font-black text-white tracking-tight">
              {V ?? throughputSem}
            </p>
            <p className="text-sm text-white/60 mt-2">boletas/semana estimado</p>
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-white/50">Total este mes</span>
              <span className="text-sm font-bold text-white">{V ?? resueltasMes}</span>
            </div>
          </div>

          {/* Tasa de aprobación mes */}
          <div className="rounded-2xl p-5" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Tasa de aprobación
              </span>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-5xl font-black text-foreground tracking-tight">
              {V ?? (tasaMes != null ? `${tasaMes}%` : "—")}
            </p>
            <div className="w-full h-2 rounded-full overflow-hidden mt-3" style={{ background: "var(--muted)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: tasaMes != null ? `${tasaMes}%` : "0%", background: "oklch(0.58 0.14 162)" }}
              />
            </div>
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Tasa global (histórico)</span>
              <span className="text-sm font-bold text-foreground">{V ?? (tasaGlobal != null ? `${tasaGlobal}%` : "—")}</span>
            </div>
          </div>
        </div>

        {/* Fila métricas secundarias */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Aprobadas",
              value: V ?? aprobadasMes,
              sub: "este mes",
              icon: CheckCircle,
              color: "oklch(0.58 0.14 162)",
              bg: "oklch(0.95 0.04 162)",
            },
            {
              label: "Rechazadas",
              value: V ?? rechazadasMes,
              sub: V ?? (tasaRechazo != null ? `${tasaRechazo}% del total` : "—"),
              icon: XCircle,
              color: "oklch(0.55 0.22 27)",
              bg: "oklch(0.97 0.02 27)",
            },
            {
              label: "Aprobadas (global)",
              value: V ?? aprobada,
              sub: "históricas",
              icon: CheckCircle,
              color: "oklch(0.58 0.14 162)",
              bg: "oklch(0.95 0.04 162)",
            },
            {
              label: "Rechazadas (global)",
              value: V ?? rechazada,
              sub: "históricas",
              icon: XCircle,
              color: "oklch(0.55 0.22 27)",
              bg: "oklch(0.97 0.02 27)",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl p-4"
              style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-muted-foreground leading-tight">{s.label}</p>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: s.bg }}>
                  <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                </div>
              </div>
              <p className="text-2xl font-black text-foreground tracking-tight">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECCIÓN 2: SLA Y TIEMPO ──────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Timer className="w-3.5 h-3.5" />
          SLA y tiempos de respuesta
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Tiempo promedio — hero */}
          <div className="rounded-2xl p-5" style={{ background: slaBg, border: `1px solid ${slaBorder}` }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Tiempo promedio
              </span>
              <Timer className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-5xl font-black text-foreground tracking-tight">
              {V ?? (tiempoAvg != null ? `${tiempoAvg.toFixed(1)}d` : "—")}
            </p>
            <p className="text-sm mt-2 font-semibold" style={{ color: slaColor }}>
              {loading ? "" : slaLabel}
            </p>
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">Benchmark: &lt;2 días ideal, &lt;3 días aceptable</p>
            </div>
          </div>

          {/* Atrasadas */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: atrasadas > 0 ? "oklch(0.97 0.02 27)" : "var(--secondary)",
              border: `1px solid ${atrasadas > 0 ? "oklch(0.88 0.06 27)" : "var(--border)"}`,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Fuera de SLA
              </span>
              <AlertTriangle className="w-4 h-4" style={{ color: atrasadas > 0 ? "oklch(0.55 0.22 27)" : "var(--muted-foreground)" }} />
            </div>
            <p
              className="text-5xl font-black tracking-tight"
              style={{ color: atrasadas > 0 ? "oklch(0.45 0.22 27)" : "var(--foreground)" }}
            >
              {V ?? atrasadas}
            </p>
            <p className="text-sm mt-2" style={{ color: atrasadas > 0 ? "oklch(0.55 0.18 27)" : "var(--muted-foreground)" }}>
              {loading ? "" : atrasadas === 0 ? "Ninguna atrasada" : "+3 días sin resolución"}
            </p>
          </div>

          {/* Backlog estado */}
          <div className="rounded-2xl p-5" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Estado del backlog
              </span>
              <Clock className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="space-y-3">
              {[
                { label: "Pendientes",   value: pendiente,    color: "oklch(0.55 0.14 72)" },
                { label: "En revisión",  value: en_revision,  color: "oklch(0.48 0.09 252)" },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-foreground">{row.label}</span>
                    <span className="text-sm font-black text-foreground">{loading ? "—" : row.value}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: (pendiente + en_revision) > 0 ? `${(row.value / (pendiente + en_revision)) * 100}%` : "0%", background: row.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              {loading ? "" : `${pendiente + en_revision} total en cola`}
            </p>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 3: DISTRIBUCIÓN POR TIPO ────────────────────── */}
      {!loading && top5Tipos.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5" />
            Distribución por categoría de gasto
          </h2>
          <Card className="border shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Top categorías revisadas (global)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {top5Tipos.map(({ tipo, total }, i) => {
                const pct = Math.round((total / maxTipo) * 100)
                const barColors = [
                  "var(--primary)",
                  "oklch(0.52 0.21 28)",
                  "oklch(0.58 0.14 162)",
                  "oklch(0.55 0.14 72)",
                  "oklch(0.55 0.22 27)",
                ]
                return (
                  <div key={tipo}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-mono font-bold text-muted-foreground shrink-0">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="text-sm font-medium text-foreground truncate">{tipo}</span>
                      </div>
                      <span className="text-sm font-black text-foreground shrink-0 ml-3">{total}</span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: barColors[i] ?? "var(--primary)" }}
                      />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  )
}
