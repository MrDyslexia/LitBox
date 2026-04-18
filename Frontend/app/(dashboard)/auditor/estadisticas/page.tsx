"use client"

import { useState, useEffect, useCallback } from "react"
import {
  TrendingUp, Clock, CheckCircle, XCircle, Timer,
  AlertTriangle, BarChart3, Target, Zap,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import PageHeader from "@/components/page-header"
import KpiCard from "@/components/kpi-card"
import SectionHeader from "@/components/section-header"
import ProgressRow from "@/components/progress-row"
import { DistributionBars, RadialProgress } from "@/components/charts"
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

  const totalResueltas = aprobada + rechazada
  const tasaGlobal = totalResueltas > 0 ? Math.round((aprobada / totalResueltas) * 100) : null

  const slaTone: "default" | "success" | "warn" | "danger" =
    tiempoAvg == null ? "default"
    : tiempoAvg < 2 ? "success"
    : tiempoAvg <= 3 ? "warn"
    : "danger"
  const slaLabel =
    tiempoAvg == null ? "Sin datos suficientes"
    : tiempoAvg < 2 ? "Dentro de SLA (<2 días)"
    : tiempoAvg <= 3 ? "En límite (2–3 días)"
    : "Fuera de SLA (>3 días)"

  const top5Tipos = porTipo.slice(0, 5).map((t) => ({ label: t.tipo, value: t.total }))
  const backlog = pendiente + en_revision

  return (
    <div className="p-4 sm:p-6 space-y-8 max-w-5xl">
      <BreadcrumbNav items={[{ label: "Resumen", href: "/auditor" }, { label: "Estadísticas" }]} />

      <PageHeader
        title="Estadísticas de auditoría"
        description="KPIs operacionales de rendimiento y calidad de revisión."
      />

      {/* Rendimiento */}
      <section className="space-y-3">
        <SectionHeader icon={Target} label="Rendimiento — este mes" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
          <KpiCard
            tone="primary" size="lg"
            label="Throughput semanal"
            icon={Zap}
            value={loading ? "—" : throughputSem}
            sub="boletas/semana estimado"
            footer={
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.14em] text-primary-foreground/60">Total mes</span>
                <span className="text-sm font-bold tabular-nums">{loading ? "—" : resueltasMes}</span>
              </div>
            }
          />

          <Card className="border border-border shadow-none py-0">
            <CardContent className="p-5 flex flex-col items-center gap-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground self-start">
                Tasa de aprobación
              </p>
              <RadialProgress
                value={tasaMes ?? 0}
                size={180}
                color="var(--chart-3)"
              >
                <span className="text-3xl font-black text-foreground tabular-nums tracking-tight">
                  {loading ? "—" : tasaMes != null ? `${tasaMes}%` : "—"}
                </span>
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Mes actual
                </span>
              </RadialProgress>
              <div className="w-full flex items-center justify-between pt-3 border-t border-border">
                <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Tasa global</span>
                <span className="text-sm font-bold text-foreground tabular-nums">
                  {loading ? "—" : tasaGlobal != null ? `${tasaGlobal}%` : "—"}
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 content-start">
            <KpiCard tone="success" size="md" label="Aprobadas" icon={CheckCircle} value={loading ? "—" : aprobadasMes} sub="este mes" />
            <KpiCard tone="danger" size="md" label="Rechazadas" icon={XCircle} value={loading ? "—" : rechazadasMes} sub={tasaRechazo != null ? `${tasaRechazo}% del total` : "—"} />
            <KpiCard tone="muted" size="md" label="Aprobadas (global)" icon={CheckCircle} value={loading ? "—" : aprobada} sub="históricas" />
            <KpiCard tone="muted" size="md" label="Rechazadas (global)" icon={XCircle} value={loading ? "—" : rechazada} sub="históricas" />
          </div>
        </div>
      </section>

      {/* SLA */}
      <section className="space-y-3">
        <SectionHeader icon={Timer} label="SLA y tiempos de respuesta" />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <KpiCard
            tone={slaTone} size="lg" label="Tiempo promedio" icon={Timer}
            value={loading ? "—" : tiempoAvg != null ? `${tiempoAvg.toFixed(1)}d` : "—"}
            sub={loading ? "" : slaLabel}
            footer={<p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Benchmark: &lt;2 días ideal</p>}
          />
          <KpiCard
            tone={atrasadas > 0 ? "danger" : "muted"} size="lg" label="Fuera de SLA" icon={AlertTriangle}
            value={loading ? "—" : atrasadas}
            sub={loading ? "" : atrasadas === 0 ? "Ninguna atrasada" : "+3 días sin resolución"}
          />
          <Card className="border border-border shadow-none py-0">
            <CardHeader className="px-4 py-3 border-b border-border">
              <CardTitle className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                Estado del backlog
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <ProgressRow
                label="Pendientes"
                value={loading ? "—" : pendiente}
                percent={backlog > 0 ? (pendiente / backlog) * 100 : 0}
                color="var(--status-pending-dot)"
              />
              <ProgressRow
                label="En revisión"
                value={loading ? "—" : en_revision}
                percent={backlog > 0 ? (en_revision / backlog) * 100 : 0}
                color="var(--status-review-dot)"
              />
              <p className="text-[11px] text-muted-foreground pt-2 border-t border-border">
                {loading ? "" : `${backlog} total en cola`}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Distribución */}
      {!loading && top5Tipos.length > 0 && (
        <section className="space-y-3">
          <SectionHeader icon={BarChart3} label="Distribución por categoría" />
          <Card className="border border-border shadow-none py-0">
            <CardHeader className="px-5 py-3 border-b border-border">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Top categorías revisadas (global)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              <DistributionBars data={top5Tipos} />
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  )
}
