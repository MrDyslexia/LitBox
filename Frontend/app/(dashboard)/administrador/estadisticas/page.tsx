"use client"

import { useState, useEffect, useCallback } from "react"
import {
  TrendingUp, Timer, AlertTriangle, DollarSign,
  CheckCircle, XCircle, Users, BarChart3, Target, Zap,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import PageHeader from "@/components/page-header"
import KpiCard from "@/components/kpi-card"
import SectionHeader from "@/components/section-header"
import { DistributionBars, EstadoDonut, RadialProgress } from "@/components/charts"
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

  const aprobada    = stats?.aprobada ?? 0
  const pagada      = stats?.pagada ?? 0
  const rechazada   = stats?.rechazada ?? 0
  const pendiente   = stats?.pendiente ?? 0
  const en_revision = stats?.en_revision ?? 0
  const total       = stats?.total ?? 0
  const atrasadas   = stats?.boletasAtrasadas ?? 0
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
  const boletasPorUser = totalUsuarios > 0 ? Math.round((total / totalUsuarios) * 10) / 10 : 0
  const paymentRate = (aprobada + pagada) > 0 ? Math.round((pagada / (aprobada + pagada)) * 100) : null

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

  const estadoData = [
    { name: "Pendientes", value: pendiente, color: "var(--status-pending-dot)" },
    { name: "En revisión", value: en_revision, color: "var(--status-review-dot)" },
    { name: "Aprobadas", value: aprobada, color: "var(--status-approved-dot)" },
    { name: "Pagadas", value: pagada, color: "var(--status-paid-dot)" },
    { name: "Rechazadas", value: rechazada, color: "var(--status-rejected-dot)" },
  ].filter((d) => d.value > 0)

  const top5Tipos = porTipo.slice(0, 5).map((t) => ({ label: t.tipo, value: t.total }))

  return (
    <div className="p-4 sm:p-6 space-y-8 max-w-5xl">
      <BreadcrumbNav items={[{ label: "Resumen general", href: "/administrador" }, { label: "Estadísticas" }]} />

      <PageHeader
        title="Estadísticas del sistema"
        description="KPIs operacionales globales del sistema de gestión de boletas."
      />

      {/* Salud del sistema */}
      <section className="space-y-3">
        <SectionHeader icon={Target} label="Salud del sistema" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
          <Card className="border border-border shadow-none py-0 lg:col-span-1">
            <CardContent className="p-5 flex flex-col items-center gap-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground self-start">
                Tasa de aprobación global
              </p>
              <RadialProgress
                value={tasaAprobacion ?? 0}
                size={200}
                color="var(--chart-1)"
              >
                <span className="text-4xl font-black text-foreground tabular-nums tracking-tight">
                  {loading ? "—" : tasaAprobacion != null ? `${tasaAprobacion}%` : "—"}
                </span>
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {loading ? "" : `${aprobada + pagada} / ${resueltas}`}
                </span>
              </RadialProgress>
              <div className="w-full grid grid-cols-2 gap-3 pt-3 border-t border-border text-center">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Aprobadas</p>
                  <p className="text-sm font-bold text-foreground tabular-nums">{loading ? "—" : aprobada + pagada}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Rechazadas</p>
                  <p className="text-sm font-bold text-foreground tabular-nums">{loading ? "—" : rechazada}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <KpiCard
              tone={atrasadas > 0 ? "danger" : "success"}
              size="md"
              label="Fuera de SLA"
              icon={AlertTriangle}
              value={loading ? "—" : atrasadas}
              sub={loading ? "" : atrasadas === 0 ? "Sistema al día" : "+3 días sin resolver"}
            />
            <KpiCard
              tone="warn"
              size="md"
              label="Backlog pendiente"
              icon={Zap}
              value={loading ? "—" : pendiente + en_revision}
              sub={loading ? "" : `${pendiente} pendiente · ${en_revision} en revisión`}
            />
            <KpiCard
              tone="primary" size="md" label="Total boletas" icon={BarChart3}
              value={loading ? "—" : total} sub="todas las boletas históricas"
            />
            <KpiCard
              tone="success" size="md" label="Payment Rate" icon={CheckCircle}
              value={loading ? "—" : paymentRate != null ? `${paymentRate}%` : "—"}
              sub="boletas pagadas vs aprobadas"
            />
          </div>
        </div>
      </section>

      {/* Eficiencia operacional */}
      <section className="space-y-3">
        <SectionHeader icon={Timer} label="Eficiencia operacional" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <KpiCard
            tone={cycleTone}
            size="lg"
            label="Ciclo E2E (creación → pago)"
            icon={Timer}
            value={loading ? "—" : tiempoEndToEnd != null ? `${tiempoEndToEnd.toFixed(1)}d` : "—"}
            sub={loading ? "" : cycleLabel}
            footer={<p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Benchmark: &lt;7 días ideal · &lt;14 días aceptable</p>}
          />
          <KpiCard
            tone="muted"
            size="lg"
            label="Tiempo de revisión"
            icon={Timer}
            value={loading ? "—" : tiempoResolucion != null ? `${tiempoResolucion.toFixed(1)}d` : "—"}
            sub={loading ? "" : "creación → decisión auditoría"}
            footer={<p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Benchmark: &lt;2 días ideal · &lt;3 días aceptable</p>}
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard
            tone="muted" size="md" label="Gasto / empleado" icon={Users}
            value={loading ? "—" : totalUsuarios > 0 ? formatMonto(expensePerUser) : "—"}
            sub="promedio histórico"
          />
          <KpiCard
            tone="muted" size="md" label="Boletas / empleado" icon={XCircle}
            value={loading ? "—" : totalUsuarios > 0 ? boletasPorUser : "—"}
            sub="promedio total"
          />
          <KpiCard
            tone="success" size="md" label="Pagadas / mes" icon={CheckCircle}
            value={loading ? "—" : pagadasMes}
            sub={loading ? "" : formatMonto(montoPagadoMes)}
          />
          <KpiCard
            tone="muted" size="md" label="Tasa aprobación" icon={TrendingUp}
            value={loading ? "—" : tasaAprobacion != null ? `${tasaAprobacion}%` : "—"}
            sub={`${resueltas} resueltas`}
          />
        </div>
      </section>

      {/* Flujo financiero */}
      <section className="space-y-3">
        <SectionHeader icon={DollarSign} label="Flujo financiero" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <KpiCard
            tone="primary" size="lg" label="Total pagado (histórico)" icon={CheckCircle}
            value={loading ? "—" : formatMonto(montoPagado)}
            sub={loading ? "" : `${pagada} boletas pagadas`}
          />
          <KpiCard
            tone="warn" size="lg" label="Cash Exposure actual" icon={AlertTriangle}
            value={loading ? "—" : formatMonto(montoAprobado)}
            sub={loading ? "" : `${aprobada} boletas aprobadas sin pagar`}
          />
        </div>
      </section>

      {/* Distribución */}
      <section className="space-y-3">
        <SectionHeader icon={BarChart3} label="Distribución" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4">
          <Card className="border border-border shadow-none py-0 lg:col-span-3">
            <CardHeader className="px-5 py-3 border-b border-border">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                <BarChart3 className="w-3.5 h-3.5" />
                Top categorías de gasto (global)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              {loading ? (
                <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">Cargando...</div>
              ) : top5Tipos.length === 0 ? (
                <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">Sin datos</div>
              ) : (
                <DistributionBars data={top5Tipos} />
              )}
            </CardContent>
          </Card>
          <Card className="border border-border shadow-none py-0 lg:col-span-2">
            <CardHeader className="px-5 py-3 border-b border-border">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                Distribución por estado
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 flex items-center justify-center min-h-[240px]">
              {loading ? (
                <span className="text-sm text-muted-foreground">Cargando...</span>
              ) : estadoData.length === 0 ? (
                <span className="text-sm text-muted-foreground">Sin datos</span>
              ) : (
                <EstadoDonut data={estadoData} centerLabel="Total" centerValue={total} />
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
