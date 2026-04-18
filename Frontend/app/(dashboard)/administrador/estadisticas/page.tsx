"use client"

import { useState, useEffect, useCallback } from "react"
import {
  TrendingUp, Timer, AlertTriangle, DollarSign,
  CheckCircle, XCircle, Users, BarChart3, Target, Zap,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import { formatMonto } from "@/lib/mock-data"
import { boletasApi, usersApi } from "@/lib/api"
import type { ApiStats } from "@/lib/types"

export default function AdminEstadisticasPage() {
  const [stats, setStats]             = useState<ApiStats | null>(null)
  const [totalUsuarios, setTotalUsers] = useState(0)
  const [loading, setLoading]         = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [statsResult, usersResult] = await Promise.allSettled([
        boletasApi.stats(),
        usersApi.list({ limit: "100" }),
      ])
      if (statsResult.status === "fulfilled") setStats(statsResult.value)
      if (usersResult.status === "fulfilled") setTotalUsers(usersResult.value.total)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const aprobada   = stats?.aprobada ?? 0
  const pagada     = stats?.pagada ?? 0
  const rechazada  = stats?.rechazada ?? 0
  const pendiente  = stats?.pendiente ?? 0
  const en_revision = stats?.en_revision ?? 0
  const total      = stats?.total ?? 0
  const atrasadas  = stats?.boletasAtrasadas ?? 0
  const montoAprobado = stats?.montoAprobado ?? 0
  const montoPagado   = stats?.montoPagado ?? 0
  const pagadasMes    = stats?.pagadasMes ?? 0
  const montoPagadoMes = stats?.montoPagadoMes ?? 0
  const tiempoEndToEnd    = stats?.tiempoEndToEnd ?? null
  const tiempoResolucion  = stats?.tiempoPromedioResolucion ?? null
  const porTipo = stats?.porTipo ?? []

  const resueltas = aprobada + pagada + rechazada
  const tasaAprobacion = resueltas > 0 ? Math.round(((aprobada + pagada) / resueltas) * 100) : null
  const expensePerUser = totalUsuarios > 0 ? montoPagado / totalUsuarios : 0
  const boletasPorUser = totalUsuarios > 0 ? Math.round(total / totalUsuarios * 10) / 10 : 0
  const paymentRate = (aprobada + pagada) > 0 ? Math.round((pagada / (aprobada + pagada)) * 100) : null

  // Semáforos
  const cycleColor =
    tiempoEndToEnd == null  ? "var(--muted-foreground)"
    : tiempoEndToEnd < 7   ? "oklch(0.58 0.14 162)"
    : tiempoEndToEnd <= 14 ? "oklch(0.55 0.14 72)"
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
      <BreadcrumbNav items={[{ label: "Resumen general", href: "/administrador" }, { label: "Estadísticas" }]} />
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Estadísticas del sistema</h1>
        <p className="text-muted-foreground text-sm mt-1">
          KPIs operacionales globales del sistema de gestión de boletas.
        </p>
      </div>

      {/* ── SECCIÓN 1: SALUD DEL SISTEMA ─────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Target className="w-3.5 h-3.5" />
          Salud del sistema
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Tasa aprobación global */}
          <div className="rounded-2xl p-5" style={{ background: "var(--primary)" }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-white/70">Tasa de aprobación global</span>
              <TrendingUp className="w-4 h-4 text-white/40" />
            </div>
            <p className="text-5xl font-black text-white tracking-tight">
              {V ?? (tasaAprobacion != null ? `${tasaAprobacion}%` : "—")}
            </p>
            <div className="w-full h-2 rounded-full overflow-hidden mt-3" style={{ background: "rgba(255,255,255,0.2)" }}>
              <div className="h-full rounded-full" style={{ width: `${tasaAprobacion ?? 0}%`, background: "white" }} />
            </div>
            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-xs text-white/50">
              <span>Aprobadas: {V ?? (aprobada + pagada)}</span>
              <span>Rechazadas: {V ?? rechazada}</span>
            </div>
          </div>

          {/* Alertas críticas */}
          <div className="space-y-3">
            <div
              className="rounded-2xl p-4"
              style={{ background: atrasadas > 0 ? "oklch(0.97 0.02 27)" : "oklch(0.97 0.01 162 / 0.4)", border: `1px solid ${atrasadas > 0 ? "oklch(0.88 0.06 27)" : "oklch(0.92 0.02 162)"}` }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground">Fuera de SLA</span>
                <AlertTriangle className="w-4 h-4" style={{ color: atrasadas > 0 ? "oklch(0.55 0.22 27)" : "oklch(0.58 0.14 162)" }} />
              </div>
              <p className="text-3xl font-black tracking-tight" style={{ color: atrasadas > 0 ? "oklch(0.45 0.22 27)" : "var(--foreground)" }}>
                {V ?? atrasadas}
              </p>
              <p className="text-xs mt-1" style={{ color: atrasadas > 0 ? "oklch(0.55 0.18 27)" : "oklch(0.58 0.14 162)" }}>
                {loading ? "" : atrasadas === 0 ? "Sistema al día" : "+3 días sin resolver"}
              </p>
            </div>
            <div className="rounded-2xl p-4" style={{ background: "oklch(0.97 0.03 72)", border: "1px solid oklch(0.88 0.07 72)" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground">Backlog pendiente</span>
                <Zap className="w-4 h-4" style={{ color: "oklch(0.55 0.14 72)" }} />
              </div>
              <p className="text-3xl font-black text-foreground tracking-tight">{V ?? (pendiente + en_revision)}</p>
              <p className="text-xs mt-1" style={{ color: "oklch(0.52 0.1 72)" }}>
                {loading ? "" : `${pendiente} pendiente · ${en_revision} en revisión`}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 2: EFICIENCIA OPERACIONAL ───────────────────── */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Timer className="w-3.5 h-3.5" />
          Eficiencia operacional
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Cycle E2E */}
          <div className="rounded-2xl p-5" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ciclo E2E (creación → pago)</span>
              <Timer className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-5xl font-black text-foreground tracking-tight">
              {V ?? (tiempoEndToEnd != null ? `${tiempoEndToEnd.toFixed(1)}d` : "—")}
            </p>
            <p className="text-sm mt-2 font-semibold" style={{ color: cycleColor }}>
              {loading ? "" : cycleLabel}
            </p>
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">Benchmark: &lt;7 días ideal, &lt;14 días aceptable</p>
            </div>
          </div>

          {/* Tiempo resolución auditoría */}
          <div className="rounded-2xl p-5" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tiempo de revisión</span>
              <Timer className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-5xl font-black text-foreground tracking-tight">
              {V ?? (tiempoResolucion != null ? `${tiempoResolucion.toFixed(1)}d` : "—")}
            </p>
            <p className="text-sm mt-2 text-muted-foreground">
              {loading ? "" : "creación → decisión auditoría"}
            </p>
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">Benchmark: &lt;2 días ideal, &lt;3 días aceptable</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Payment Rate", value: V ?? (paymentRate != null ? `${paymentRate}%` : "—"), sub: "boletas pagadas vs aprobadas", icon: CheckCircle, color: "oklch(0.58 0.14 162)", bg: "oklch(0.95 0.04 162)" },
            { label: "Gasto / empleado", value: V ?? (totalUsuarios > 0 ? formatMonto(expensePerUser) : "—"), sub: "promedio histórico", icon: Users, color: "var(--primary)", bg: "oklch(0.94 0.02 252)" },
            { label: "Boletas / empleado", value: V ?? (totalUsuarios > 0 ? boletasPorUser : "—"), sub: "promedio total", icon: XCircle, color: "var(--muted-foreground)", bg: "var(--muted)" },
            { label: "Pagadas este mes", value: V ?? pagadasMes, sub: V ?? formatMonto(montoPagadoMes), icon: DollarSign, color: "oklch(0.58 0.14 162)", bg: "oklch(0.95 0.04 162)" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-4" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
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

      {/* ── SECCIÓN 3: FLUJO FINANCIERO ──────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <DollarSign className="w-3.5 h-3.5" />
          Flujo financiero
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-2xl p-5" style={{ background: "var(--primary)" }}>
            <span className="text-xs font-semibold uppercase tracking-wide text-white/70">Total pagado (histórico)</span>
            <p className="text-4xl font-black text-white tracking-tight mt-2">{V ?? formatMonto(montoPagado)}</p>
            <p className="text-xs text-white/50 mt-2">{V ?? pagada} boletas pagadas</p>
          </div>
          <div className="rounded-2xl p-5" style={{ background: "oklch(0.97 0.03 72)", border: "1px solid oklch(0.88 0.07 72)" }}>
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "oklch(0.45 0.1 72)" }}>Cash Exposure actual</span>
            <p className="text-4xl font-black tracking-tight mt-2" style={{ color: "oklch(0.32 0.12 72)" }}>{V ?? formatMonto(montoAprobado)}</p>
            <p className="text-xs mt-2" style={{ color: "oklch(0.52 0.1 72)" }}>{V ?? aprobada} boletas aprobadas sin pagar</p>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 4: DISTRIBUCIÓN POR TIPO ────────────────────── */}
      {!loading && top5Tipos.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5" />
            Distribución por categoría
          </h2>
          <Card className="border shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Top categorías de gasto (global)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {top5Tipos.map(({ tipo, total: t }, i) => {
                const barColors = ["var(--primary)", "oklch(0.52 0.21 28)", "oklch(0.58 0.14 162)", "oklch(0.55 0.14 72)", "oklch(0.55 0.22 27)"]
                return (
                  <div key={tipo}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-mono font-bold text-muted-foreground shrink-0">{String(i + 1).padStart(2, "0")}</span>
                        <span className="text-sm font-medium text-foreground truncate">{tipo}</span>
                      </div>
                      <span className="text-sm font-black text-foreground shrink-0 ml-3">{t}</span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.round((t / maxTipo) * 100)}%`, background: barColors[i] ?? "var(--primary)" }} />
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
