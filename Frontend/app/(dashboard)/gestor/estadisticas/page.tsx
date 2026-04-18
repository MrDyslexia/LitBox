"use client"

import { useState, useEffect, useCallback } from "react"
import {
  DollarSign, CheckCircle, AlertTriangle, TrendingUp,
  Clock, CalendarDays, BarChart3, Target,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import { formatMonto, type Boleta } from "@/lib/mock-data"
import { boletasApi, normalizeBoleta } from "@/lib/api"
import type { ApiStats } from "@/lib/types"

const GESTOR_COLOR = "oklch(0.36 0.08 252)"

export default function GestorEstadisticasPage() {
  const [stats, setStats]       = useState<ApiStats | null>(null)
  const [aprobadas, setAprobadas] = useState<Boleta[]>([])
  const [loading, setLoading]   = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [statsResult, boletasResult] = await Promise.allSettled([
        boletasApi.stats(),
        boletasApi.list({ limit: "200" }),
      ])
      if (statsResult.status === "fulfilled") setStats(statsResult.value)
      if (boletasResult.status === "fulfilled") {
        const all = boletasResult.value.items.map(normalizeBoleta)
        setAprobadas(all.filter((b) => b.estado === "aprobada"))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const oldestUnpaid = aprobadas.length > 0
    ? aprobadas.reduce((o, b) => new Date(b.fecha) < new Date(o.fecha) ? b : o)
    : null
  const oldestUnpaidDays = oldestUnpaid
    ? Math.floor((Date.now() - new Date(oldestUnpaid.fecha).getTime()) / 86400000)
    : null

  const montoPorPagar  = aprobadas.reduce((s, b) => s + b.monto, 0)
  const montoPagado    = stats?.montoPagado ?? 0
  const pagada         = stats?.pagada ?? 0
  const aprobadaCount  = stats?.aprobada ?? 0
  const pagadasMes     = stats?.pagadasMes ?? 0
  const montoPagadoMes = stats?.montoPagadoMes ?? 0
  const tiempoEndToEnd = stats?.tiempoEndToEnd ?? null
  const atrasadas      = stats?.boletasAtrasadas ?? 0
  const porTipo        = stats?.porTipo ?? []

  // Payment SLA ratio: pagada / (pagada + aprobada)
  const totalClosed = pagada + aprobadaCount
  const paymentRate = totalClosed > 0 ? Math.round((pagada / totalClosed) * 100) : null

  // DPO semáforos
  const dpoBad  = oldestUnpaidDays != null && oldestUnpaidDays > 5
  const dpoWarn = oldestUnpaidDays != null && oldestUnpaidDays >= 3 && !dpoBad
  const dpoOk   = oldestUnpaidDays != null && !dpoBad && !dpoWarn
  const dpoColor  = dpoOk ? "oklch(0.58 0.14 162)" : dpoWarn ? "oklch(0.55 0.14 72)" : dpoBad ? "oklch(0.55 0.22 27)" : "var(--muted-foreground)"
  const dpoBg     = dpoBad ? "oklch(0.97 0.02 27)" : dpoWarn ? "oklch(0.97 0.03 72)" : "var(--secondary)"
  const dpoBorder = dpoBad ? "oklch(0.88 0.06 27)" : dpoWarn ? "oklch(0.88 0.07 72)" : "var(--border)"

  // Cycle time semáforo
  const cycleColor =
    tiempoEndToEnd == null   ? "var(--muted-foreground)"
    : tiempoEndToEnd < 7    ? "oklch(0.58 0.14 162)"
    : tiempoEndToEnd <= 14  ? "oklch(0.55 0.14 72)"
                             : "oklch(0.55 0.22 27)"
  const cycleLabel =
    tiempoEndToEnd == null  ? "Sin datos suficientes"
    : tiempoEndToEnd < 7   ? "Ciclo eficiente (<7 días)"
    : tiempoEndToEnd <= 14 ? "Ciclo moderado (7–14 días)"
                            : "Ciclo lento (>14 días)"

  const top5Tipos = porTipo.slice(0, 5)
  const maxTipo   = top5Tipos.length > 0 ? Math.max(...top5Tipos.map((t) => t.total)) : 1

  const V = loading ? "—" : undefined

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl">
      <BreadcrumbNav
        items={[
          { label: "Resumen", href: "/gestor" },
          { label: "Estadísticas" },
        ]}
      />
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Estadísticas de pagos</h1>
        <p className="text-muted-foreground text-sm mt-1">
          KPIs financieros y de eficiencia del ciclo de reembolsos.
        </p>
      </div>

      {/* ── SECCIÓN 1: EXPOSICIÓN FINANCIERA ────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <DollarSign className="w-3.5 h-3.5" />
          Exposición financiera actual
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Cash Exposure hero */}
          <div className="rounded-2xl p-5" style={{ background: GESTOR_COLOR }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-white/70">Cash Exposure</span>
              <DollarSign className="w-4 h-4 text-white/40" />
            </div>
            <p className="text-5xl font-black text-white tracking-tight">
              {V ?? formatMonto(montoPorPagar)}
            </p>
            <p className="text-sm text-white/60 mt-2">monto total sin pagar</p>
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-white/50">Boletas pendientes</span>
              <span className="text-sm font-bold text-white">{V ?? aprobadaCount}</span>
            </div>
          </div>

          {/* DPO */}
          <div className="rounded-2xl p-5" style={{ background: dpoBg, border: `1px solid ${dpoBorder}` }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                DPO — Antigüedad máxima
              </span>
              <AlertTriangle className="w-4 h-4" style={{ color: dpoColor }} />
            </div>
            <p className="text-5xl font-black text-foreground tracking-tight">
              {V ?? (oldestUnpaidDays != null ? `${oldestUnpaidDays}d` : "—")}
            </p>
            <p className="text-sm mt-2 font-semibold" style={{ color: dpoColor }}>
              {loading ? "" : oldestUnpaidDays == null ? "Sin deuda pendiente"
                : dpoBad ? "Pago urgente requerido"
                : dpoWarn ? "Atención requerida"
                : "Al día"}
            </p>
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">Benchmark: &lt;3 días ideal, &lt;5 días aceptable</p>
            </div>
          </div>
        </div>

        {/* Fila secundaria */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Payment Rate",
              value: V ?? (paymentRate != null ? `${paymentRate}%` : "—"),
              sub: "boletas pagadas del total",
              icon: TrendingUp,
              color: "oklch(0.58 0.14 162)",
              bg: "oklch(0.95 0.04 162)",
            },
            {
              label: "Fuera de SLA",
              value: V ?? atrasadas,
              sub: atrasadas > 0 ? "+3 días sin resolución" : "al día",
              icon: AlertTriangle,
              color: atrasadas > 0 ? "oklch(0.55 0.22 27)" : "var(--muted-foreground)",
              bg: atrasadas > 0 ? "oklch(0.97 0.02 27)" : "var(--muted)",
            },
            {
              label: "Total pagado",
              value: V ?? formatMonto(montoPagado),
              sub: `${pagada} boletas históricas`,
              icon: CheckCircle,
              color: "oklch(0.58 0.14 162)",
              bg: "oklch(0.95 0.04 162)",
            },
            {
              label: "Pagado este mes",
              value: V ?? formatMonto(montoPagadoMes),
              sub: `${pagadasMes} boletas`,
              icon: CalendarDays,
              color: GESTOR_COLOR,
              bg: "oklch(0.94 0.02 252)",
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
              <p className="text-lg font-black text-foreground tracking-tight leading-tight">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECCIÓN 2: EFICIENCIA DEL CICLO ─────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Target className="w-3.5 h-3.5" />
          Eficiencia del ciclo de pago
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Cycle time E2E */}
          <div className="rounded-2xl p-5" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Ciclo E2E (creación → pago)
              </span>
              <Clock className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-5xl font-black text-foreground tracking-tight">
              {V ?? (tiempoEndToEnd != null ? `${tiempoEndToEnd.toFixed(1)}d` : "—")}
            </p>
            <p className="text-sm mt-2 font-semibold" style={{ color: cycleColor }}>
              {loading ? "" : cycleLabel}
            </p>
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">Incluye tiempo de auditoría + pago</p>
            </div>
          </div>

          {/* Payment rate con barra */}
          <div className="rounded-2xl p-5" style={{ background: "oklch(0.97 0.01 162 / 0.5)", border: "1px solid oklch(0.92 0.02 162)" }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Payment Rate (global)
              </span>
              <TrendingUp className="w-4 h-4" style={{ color: "oklch(0.58 0.14 162)" }} />
            </div>
            <p className="text-5xl font-black text-foreground tracking-tight">
              {V ?? (paymentRate != null ? `${paymentRate}%` : "—")}
            </p>
            <div className="w-full h-2 rounded-full overflow-hidden mt-3" style={{ background: "var(--muted)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: paymentRate != null ? `${paymentRate}%` : "0%", background: "oklch(0.58 0.14 162)" }}
              />
            </div>
            <div className="mt-3 pt-3 border-t border-border flex justify-between text-xs text-muted-foreground">
              <span>Pagadas: {V ?? pagada}</span>
              <span>Pendientes: {V ?? aprobadaCount}</span>
            </div>
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
                Top categorías (total acumulado)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {top5Tipos.map(({ tipo, total }, i) => {
                const pct = Math.round((total / maxTipo) * 100)
                const barColors = [GESTOR_COLOR, "oklch(0.52 0.21 28)", "oklch(0.58 0.14 162)", "oklch(0.55 0.14 72)", "oklch(0.55 0.22 27)"]
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
                        style={{ width: `${pct}%`, background: barColors[i] ?? GESTOR_COLOR }}
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
