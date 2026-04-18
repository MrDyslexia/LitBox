"use client"

import { useState, useEffect, useCallback } from "react"
import {
  DollarSign, CheckCircle, AlertTriangle, TrendingUp,
  Clock, CalendarDays, BarChart3, Target,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import PageHeader from "@/components/page-header"
import KpiCard from "@/components/kpi-card"
import SectionHeader from "@/components/section-header"
import { DistributionBars, RadialProgress } from "@/components/charts"
import { formatMonto, type Boleta } from "@/lib/mock-data"
import { boletasApi, normalizeBoleta } from "@/lib/api"
import type { ApiStats } from "@/lib/types"

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

  const totalClosed = pagada + aprobadaCount
  const paymentRate = totalClosed > 0 ? Math.round((pagada / totalClosed) * 100) : null

  const dpoTone: "default" | "success" | "warn" | "danger" =
    oldestUnpaidDays == null ? "default"
    : oldestUnpaidDays > 5 ? "danger"
    : oldestUnpaidDays >= 3 ? "warn"
    : "success"

  const cycleTone: "default" | "success" | "warn" | "danger" =
    tiempoEndToEnd == null ? "default"
    : tiempoEndToEnd < 7 ? "success"
    : tiempoEndToEnd <= 14 ? "warn"
    : "danger"
  const cycleLabel =
    tiempoEndToEnd == null ? "Sin datos suficientes"
    : tiempoEndToEnd < 7 ? "Ciclo eficiente (<7 días)"
    : tiempoEndToEnd <= 14 ? "Ciclo moderado (7–14 días)"
    : "Ciclo lento (>14 días)"

  const top5Tipos = porTipo.slice(0, 5).map((t) => ({ label: t.tipo, value: t.total }))

  return (
    <div className="p-4 sm:p-6 space-y-8 max-w-5xl">
      <BreadcrumbNav items={[{ label: "Resumen", href: "/gestor" }, { label: "Estadísticas" }]} />

      <PageHeader
        title="Estadísticas de pagos"
        description="KPIs financieros y de eficiencia del ciclo de reembolsos."
      />

      {/* Exposición financiera */}
      <section className="space-y-3">
        <SectionHeader icon={DollarSign} label="Exposición financiera actual" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <KpiCard
            tone="primary" size="lg" label="Cash Exposure" icon={DollarSign}
            value={loading ? "—" : formatMonto(montoPorPagar)}
            sub="monto total sin pagar"
            footer={
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.14em] text-primary-foreground/60">Boletas pendientes</span>
                <span className="text-sm font-bold tabular-nums">{loading ? "—" : aprobadaCount}</span>
              </div>
            }
          />
          <KpiCard
            tone={dpoTone} size="lg" label="DPO — antigüedad máxima" icon={AlertTriangle}
            value={loading ? "—" : oldestUnpaidDays != null ? `${oldestUnpaidDays}d` : "—"}
            sub={
              loading ? ""
              : oldestUnpaidDays == null ? "Sin deuda pendiente"
              : oldestUnpaidDays > 5 ? "Pago urgente requerido"
              : oldestUnpaidDays >= 3 ? "Atención requerida"
              : "Al día"
            }
            footer={<p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Benchmark: &lt;3 días ideal · &lt;5 días aceptable</p>}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard
            tone="success" size="md" label="Payment Rate" icon={TrendingUp}
            value={loading ? "—" : paymentRate != null ? `${paymentRate}%` : "—"}
            sub="boletas pagadas del total"
          />
          <KpiCard
            tone={atrasadas > 0 ? "danger" : "muted"} size="md" label="Fuera de SLA" icon={AlertTriangle}
            value={loading ? "—" : atrasadas}
            sub={atrasadas > 0 ? "+3 días sin resolución" : "al día"}
          />
          <KpiCard
            tone="success" size="md" label="Total pagado" icon={CheckCircle}
            value={loading ? "—" : formatMonto(montoPagado)}
            sub={`${pagada} históricas`}
          />
          <KpiCard
            tone="muted" size="md" label="Pagado este mes" icon={CalendarDays}
            value={loading ? "—" : formatMonto(montoPagadoMes)}
            sub={`${pagadasMes} boletas`}
          />
        </div>
      </section>

      {/* Eficiencia ciclo */}
      <section className="space-y-3">
        <SectionHeader icon={Target} label="Eficiencia del ciclo de pago" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <KpiCard
            tone={cycleTone} size="lg"
            label="Ciclo E2E (creación → pago)"
            icon={Clock}
            value={loading ? "—" : tiempoEndToEnd != null ? `${tiempoEndToEnd.toFixed(1)}d` : "—"}
            sub={loading ? "" : cycleLabel}
            footer={<p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Incluye tiempo de auditoría + pago</p>}
          />

          <Card className="border border-border shadow-none py-0" style={{ background: "var(--success-bg)", borderColor: "var(--success-border)" }}>
            <CardContent className="p-5 flex flex-col items-center gap-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground self-start">
                Payment Rate (global)
              </p>
              <RadialProgress
                value={paymentRate ?? 0}
                size={160}
                color="var(--chart-3)"
              >
                <span className="text-3xl font-black text-foreground tabular-nums tracking-tight">
                  {loading ? "—" : paymentRate != null ? `${paymentRate}%` : "—"}
                </span>
              </RadialProgress>
              <div className="w-full flex justify-between pt-2 text-[11px] text-muted-foreground">
                <span>Pagadas: <span className="font-bold text-foreground tabular-nums">{loading ? "—" : pagada}</span></span>
                <span>Pendientes: <span className="font-bold text-foreground tabular-nums">{loading ? "—" : aprobadaCount}</span></span>
              </div>
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
                Top categorías (total acumulado)
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
