"use client"

import { useState, useEffect, useCallback } from "react"
import {
  CheckCircle, XCircle, Clock, Timer,
  TrendingUp, Wallet, FileText, BarChart3, Target,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import PageHeader from "@/components/page-header"
import KpiCard from "@/components/kpi-card"
import SectionHeader from "@/components/section-header"
import { DistributionBars, RadialProgress } from "@/components/charts"
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

  const slaTone: "default" | "success" | "warn" | "danger" =
    tiempoAvg == null ? "default"
    : tiempoAvg < 3 ? "success"
    : tiempoAvg <= 5 ? "warn"
    : "danger"
  const slaLabel =
    tiempoAvg == null ? "Sin datos suficientes"
    : tiempoAvg < 3 ? "Respuesta rápida (<3 días)"
    : tiempoAvg <= 5 ? "Respuesta normal (3–5 días)"
    : "Respuesta lenta (>5 días)"

  const top5Tipos = porTipo.slice(0, 5).map((t) => ({ label: t.tipo, value: t.total }))

  return (
    <div className="p-4 sm:p-6 space-y-8 max-w-5xl">
      <BreadcrumbNav items={[{ label: "Inicio", href: "/empleado" }, { label: "Estadísticas" }]} />

      <PageHeader
        title="Mis estadísticas"
        description="Rendimiento personal de reembolsos y calidad de submissions."
      />

      {/* Mi dinero */}
      <section className="space-y-3">
        <SectionHeader icon={Wallet} label="Mi dinero" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <KpiCard
            tone="primary" size="lg" label="Total recibido" icon={CheckCircle}
            value={loading ? "—" : formatMonto(montoPagado)}
            sub="reembolsado históricamente"
            footer={
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.14em] text-primary-foreground/60">Boletas pagadas</span>
                <span className="text-sm font-bold tabular-nums">{loading ? "—" : pagadas}</span>
              </div>
            }
          />
          <KpiCard
            tone={pipeline > 0 ? "warn" : "muted"}
            size="lg" label="Por cobrar" icon={Wallet}
            value={loading ? "—" : formatMonto(pipeline)}
            sub={loading ? "" : pipeline === 0 ? "Todo al día" : "aprobado, esperando pago"}
            footer={
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Este mes</span>
                <span className="text-sm font-bold text-foreground tabular-nums">{loading ? "—" : formatMonto(montoMes)}</span>
              </div>
            }
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard tone="muted" size="md" label="Total enviadas" icon={FileText}
            value={loading ? "—" : total} sub={`${boletasMes} este mes`} />
          <KpiCard tone="success" size="md" label="Aprobadas" icon={CheckCircle}
            value={loading ? "—" : aprobadas + pagadas} sub="incluye pagadas" />
          <KpiCard tone="danger" size="md" label="Rechazadas" icon={XCircle}
            value={loading ? "—" : rechazadas} sub={tasaRechazo != null ? `${tasaRechazo}% del total` : "—"} />
          <KpiCard tone="warn" size="md" label="Pendientes" icon={Clock}
            value={loading ? "—" : pendientes} sub="en revisión" />
        </div>
      </section>

      {/* Rendimiento */}
      <section className="space-y-3">
        <SectionHeader icon={Target} label="Mi rendimiento" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Card className="border border-border shadow-none py-0">
            <CardContent className="p-5 flex flex-col items-center gap-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground self-start">
                Tasa de aprobación
              </p>
              <RadialProgress
                value={tasaAprobacion ?? 0}
                size={180}
                color="var(--chart-3)"
              >
                <span className="text-4xl font-black text-foreground tabular-nums tracking-tight">
                  {loading ? "—" : tasaAprobacion != null ? `${tasaAprobacion}%` : "—"}
                </span>
              </RadialProgress>
              <div className="w-full grid grid-cols-2 gap-3 pt-3 border-t border-border text-center">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Aprobadas</p>
                  <p className="text-sm font-bold text-foreground tabular-nums">{loading ? "—" : aprobadas + pagadas}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Rechazadas</p>
                  <p className="text-sm font-bold text-foreground tabular-nums">{loading ? "—" : rechazadas}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <KpiCard
            tone={slaTone} size="lg" label="Tiempo de respuesta" icon={Timer}
            value={loading ? "—" : tiempoAvg != null ? `${tiempoAvg.toFixed(1)}d` : "—"}
            sub={loading ? "" : slaLabel}
            footer={<p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Días desde envío hasta decisión del auditor</p>}
          />
        </div>
      </section>

      {/* Distribución */}
      {!loading && top5Tipos.length > 0 && (
        <section className="space-y-3">
          <SectionHeader icon={BarChart3} label="Mis gastos por categoría" />
          <Card className="border border-border shadow-none py-0">
            <CardHeader className="px-5 py-3 border-b border-border">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Distribución de boletas enviadas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              <DistributionBars data={top5Tipos} />
            </CardContent>
          </Card>
        </section>
      )}

      {loading && (
        <div className="text-center py-8 text-sm text-muted-foreground">Cargando...</div>
      )}
    </div>
  )
}
