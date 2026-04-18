"use client"

import { useState, useEffect, useCallback } from "react"
import {
  CheckCircle, XCircle, Clock, Timer,
  TrendingUp, Wallet, FileText, BarChart3, Target,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import { formatMonto } from "@/lib/mock-data"
import { boletasApi } from "@/lib/api"
import type { ApiStats } from "@/lib/types"

export default function EmpleadoEstadisticasPage() {
  const [stats, setStats] = useState<ApiStats | null>(null)
  const [loading, setLoading] = useState(true)

  const loadStats = useCallback(async () => {
    setLoading(true)
    try { setStats(await boletasApi.stats()) }
    catch (err) { console.error("Error:", err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadStats() }, [loadStats])

  const total      = stats?.total ?? 0
  const aprobadas  = stats?.aprobada ?? 0
  const rechazadas = stats?.rechazada ?? 0
  const pagadas    = stats?.pagada ?? 0
  const pendientes = stats?.pendiente ?? 0
  const montoPagado   = stats?.montoPagado ?? 0
  const montoAprobado = stats?.montoAprobado ?? 0
  const boletasMes    = stats?.boletasMes ?? 0
  const montoMes      = stats?.montoMes ?? 0
  const tiempoAvg     = stats?.tiempoPromedioResolucion ?? null
  const porTipo       = stats?.porTipo ?? []

  const pipeline   = Math.max(0, montoAprobado - montoPagado)
  const resueltas  = aprobadas + pagadas + rechazadas
  const tasaAprobacion = resueltas > 0 ? Math.round(((aprobadas + pagadas) / resueltas) * 100) : null
  const tasaRechazo    = resueltas > 0 ? Math.round((rechazadas / resueltas) * 100) : null

  const slaColor =
    tiempoAvg == null  ? "var(--muted-foreground)"
    : tiempoAvg < 3   ? "oklch(0.58 0.14 162)"
    : tiempoAvg <= 5  ? "oklch(0.55 0.14 72)"
                      : "oklch(0.55 0.22 27)"
  const slaLabel =
    tiempoAvg == null  ? "Sin datos suficientes"
    : tiempoAvg < 3   ? "Respuesta rápida (<3 días)"
    : tiempoAvg <= 5  ? "Respuesta normal (3–5 días)"
                      : "Respuesta lenta (>5 días)"

  const top5Tipos = porTipo.slice(0, 5)
  const maxTipo   = top5Tipos.length > 0 ? Math.max(...top5Tipos.map((t) => t.total)) : 1
  const V = loading ? "—" : undefined

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl">
      <BreadcrumbNav items={[{ label: "Inicio", href: "/empleado" }, { label: "Estadísticas" }]} />
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Mis estadísticas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Rendimiento personal de reembolsos y calidad de submissions.
        </p>
      </div>

      {/* ── SECCIÓN 1: MI DINERO ─────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Wallet className="w-3.5 h-3.5" />
          Mi dinero
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Hero — Total recibido */}
          <div className="rounded-2xl p-5" style={{ background: "var(--primary)" }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-white/70">Total recibido</span>
              <CheckCircle className="w-4 h-4 text-white/40" />
            </div>
            <p className="text-5xl font-black text-white tracking-tight">
              {V ?? formatMonto(montoPagado)}
            </p>
            <p className="text-sm text-white/60 mt-2">reembolsado históricamente</p>
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-white/50">Boletas pagadas</span>
              <span className="text-sm font-bold text-white">{V ?? pagadas}</span>
            </div>
          </div>

          {/* Hero — Por cobrar */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: pipeline > 0 ? "oklch(0.97 0.03 72)" : "var(--secondary)",
              border: `1px solid ${pipeline > 0 ? "oklch(0.88 0.07 72)" : "var(--border)"}`,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Por cobrar</span>
              <Wallet className="w-4 h-4" style={{ color: pipeline > 0 ? "oklch(0.55 0.14 72)" : "var(--muted-foreground)" }} />
            </div>
            <p className="text-5xl font-black text-foreground tracking-tight">
              {V ?? formatMonto(pipeline)}
            </p>
            <p className="text-sm mt-2" style={{ color: pipeline > 0 ? "oklch(0.52 0.1 72)" : "var(--muted-foreground)" }}>
              {loading ? "" : pipeline === 0 ? "Todo al día" : "aprobado, esperando pago"}
            </p>
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Este mes</span>
              <span className="text-sm font-bold text-foreground">{V ?? formatMonto(montoMes)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total enviadas", value: V ?? total, sub: `${boletasMes} este mes`, icon: FileText, color: "var(--primary)", bg: "oklch(0.94 0.02 252)" },
            { label: "Aprobadas", value: V ?? (aprobadas + pagadas), sub: "incluye pagadas", icon: CheckCircle, color: "oklch(0.58 0.14 162)", bg: "oklch(0.95 0.04 162)" },
            { label: "Rechazadas", value: V ?? rechazadas, sub: tasaRechazo != null ? `${tasaRechazo}% del total` : "—", icon: XCircle, color: "oklch(0.55 0.22 27)", bg: "oklch(0.97 0.02 27)" },
            { label: "Pendientes", value: V ?? pendientes, sub: "en revisión", icon: Clock, color: "oklch(0.55 0.14 72)", bg: "oklch(0.97 0.03 72)" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-4" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
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

      {/* ── SECCIÓN 2: MI RENDIMIENTO ────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Target className="w-3.5 h-3.5" />
          Mi rendimiento
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Tasa de aprobación */}
          <div className="rounded-2xl p-5" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tasa de aprobación</span>
              <TrendingUp className="w-4 h-4" style={{ color: "oklch(0.58 0.14 162)" }} />
            </div>
            <p className="text-5xl font-black text-foreground tracking-tight">
              {V ?? (tasaAprobacion != null ? `${tasaAprobacion}%` : "—")}
            </p>
            <div className="w-full h-2 rounded-full overflow-hidden mt-3" style={{ background: "var(--muted)" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${tasaAprobacion ?? 0}%`, background: "oklch(0.58 0.14 162)" }} />
            </div>
            <div className="mt-3 pt-3 border-t border-border flex justify-between text-xs text-muted-foreground">
              <span>Aprobadas: {V ?? (aprobadas + pagadas)}</span>
              <span>Rechazadas: {V ?? rechazadas}</span>
            </div>
          </div>

          {/* Tiempo promedio */}
          <div className="rounded-2xl p-5" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tiempo de respuesta</span>
              <Timer className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-5xl font-black text-foreground tracking-tight">
              {V ?? (tiempoAvg != null ? `${tiempoAvg.toFixed(1)}d` : "—")}
            </p>
            <p className="text-sm mt-2 font-semibold" style={{ color: slaColor }}>
              {loading ? "" : slaLabel}
            </p>
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">Días desde envío hasta decisión del auditor</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 3: MIS GASTOS POR TIPO ──────────────────────── */}
      {!loading && top5Tipos.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5" />
            Mis gastos por categoría
          </h2>
          <Card className="border shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Distribución de boletas enviadas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {top5Tipos.map(({ tipo, total: t }, i) => {
                const barColors = ["var(--primary)", "oklch(0.52 0.21 28)", "oklch(0.58 0.14 162)", "oklch(0.55 0.14 72)", "oklch(0.55 0.22 27)"]
                return (
                  <div key={tipo}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-mono font-bold text-muted-foreground shrink-0">
                          {String(i + 1).padStart(2, "0")}
                        </span>
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
