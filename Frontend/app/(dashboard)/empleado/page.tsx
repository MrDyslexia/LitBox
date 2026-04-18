"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  FileText, PlusCircle, CheckCircle, XCircle,
  Clock, TrendingUp, Wallet, ChevronRight, Timer,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import PageHeader from "@/components/page-header"
import KpiCard from "@/components/kpi-card"
import StatusBadge from "@/components/status-badge"
import { formatMonto, formatFecha, type Boleta } from "@/lib/mock-data"
import { boletasApi, normalizeBoleta } from "@/lib/api"
import type { ApiStats } from "@/lib/types"
import { useBoletasSync } from "@/hooks/useBoletasSync"
import { useUser } from "@/contexts/user-context"
import EmpleadoStatsPanel from "@/components/empleado-stats-panel"

export default function EmpleadoHomePage() {
  const router = useRouter()
  const { user } = useUser()
  const [boletas, setBoletas]     = useState<Boleta[]>([])
  const [stats, setStats]         = useState<ApiStats | null>(null)
  const [loadingData, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [boletasResult, statsResult] = await Promise.allSettled([
        boletasApi.list({ limit: "100" }),
        boletasApi.stats(),
      ])
      if (boletasResult.status === "fulfilled")
        setBoletas(boletasResult.value.items.map(normalizeBoleta))
      if (statsResult.status === "fulfilled")
        setStats(statsResult.value)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])
  useBoletasSync(loadData)

  const total      = stats?.total ?? boletas.length
  const pendientes = stats?.pendiente ?? 0
  const aprobadas  = stats?.aprobada ?? 0
  const rechazadas = stats?.rechazada ?? 0
  const pagadas    = stats?.pagada ?? 0
  const montoPagado    = stats?.montoPagado ?? 0
  const montoAprobado  = stats?.montoAprobado ?? 0
  const tiempoAvg      = stats?.tiempoPromedioResolucion ?? null
  const boletasMes     = stats?.boletasMes ?? 0

  const pipeline = Math.max(0, montoAprobado - montoPagado)
  const resueltas = aprobadas + pagadas + rechazadas
  const tasaAprobacion = resueltas > 0 ? Math.round(((aprobadas + pagadas) / resueltas) * 100) : null

  const slaTone: "default" | "success" | "warn" | "danger" =
    tiempoAvg == null ? "default"
    : tiempoAvg < 3 ? "success"
    : tiempoAvg <= 5 ? "warn"
    : "danger"
  const slaLabel =
    tiempoAvg == null ? "Sin datos"
    : tiempoAvg < 3 ? "Respuesta rápida"
    : tiempoAvg <= 5 ? "Respuesta normal"
    : "Respuesta lenta"

  return (
    <div className="flex min-h-full">
      <div className="flex-1 min-w-0 p-4 sm:p-6 space-y-5 sm:space-y-6">
        <BreadcrumbNav items={[{ label: "Inicio" }]} />

        <PageHeader
          title={`Hola, ${user.name.split(" ")[0]}`}
          description="Resumen de tus gastos y reembolsos."
          action={
            <Button
              className="h-9 font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => router.push("/empleado/nueva")}
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Nueva boleta</span>
              <span className="sm:hidden">Nueva</span>
            </Button>
          }
        />

        {/* Hero */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <KpiCard
            tone="primary" size="lg" label="Total recibido" icon={CheckCircle}
            value={loadingData ? "—" : formatMonto(montoPagado)}
            sub={loadingData ? "" : `${pagadas} boleta${pagadas !== 1 ? "s" : ""} reembolsada${pagadas !== 1 ? "s" : ""}`}
          />
          <KpiCard
            tone={pipeline > 0 ? "warn" : "muted"}
            size="lg" label="Por cobrar" icon={Wallet}
            value={loadingData ? "—" : formatMonto(pipeline)}
            sub={
              loadingData ? ""
              : pipeline === 0 ? "Sin pendientes de pago"
              : `${aprobadas} aprobada${aprobadas !== 1 ? "s" : ""} sin pagar`
            }
          />
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard
            tone="muted" size="md" label="Total enviadas" icon={FileText}
            value={loadingData ? "—" : total}
            sub={`${boletasMes} este mes`}
          />
          <KpiCard
            tone="warn" size="md" label="Pendientes" icon={Clock}
            value={loadingData ? "—" : pendientes}
            sub="en revisión"
          />
          <KpiCard
            tone="success" size="md" label="Aprobadas" icon={CheckCircle}
            value={loadingData ? "—" : aprobadas + pagadas}
            sub={tasaAprobacion != null ? `${tasaAprobacion}% tasa` : "—"}
          />
          <KpiCard
            tone="danger" size="md" label="Rechazadas" icon={XCircle}
            value={loadingData ? "—" : rechazadas}
            sub={resueltas > 0 ? `${Math.round((rechazadas / resueltas) * 100)}% del total` : "—"}
          />
        </div>

        {/* Tasa + Tiempo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <KpiCard
            tone="muted" size="md" label="Tasa de aprobación" icon={TrendingUp}
            value={loadingData ? "—" : tasaAprobacion != null ? `${tasaAprobacion}%` : "—"}
            sub={
              loadingData ? ""
              : resueltas === 0 ? "Sin boletas resueltas aún"
              : `${aprobadas + pagadas} de ${resueltas} resueltas`
            }
            footer={
              <div className="w-full h-1.5 rounded-full overflow-hidden bg-muted">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: tasaAprobacion != null ? `${tasaAprobacion}%` : "0%", background: "var(--chart-3)" }}
                />
              </div>
            }
          />
          <KpiCard
            tone={slaTone} size="md" label="Tiempo de respuesta" icon={Timer}
            value={loadingData ? "—" : tiempoAvg != null ? `${tiempoAvg.toFixed(1)} días` : "—"}
            sub={loadingData ? "" : slaLabel}
          />
        </div>

        {/* Últimas boletas */}
        <Card className="border border-border shadow-none py-0">
          <CardHeader className="px-4 sm:px-5 py-3 flex flex-row items-center justify-between border-b border-border">
            <CardTitle className="text-sm font-semibold">Últimas boletas</CardTitle>
            <Link
              href="/empleado/boletas"
              className="text-[11px] font-semibold uppercase tracking-[0.12em] flex items-center gap-1 text-accent hover:text-accent/80 transition-colors"
            >
              Ver todas <ChevronRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {loadingData ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">Cargando...</div>
            ) : boletas.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                No tienes boletas aún.{" "}
                <Link href="/empleado/nueva" className="underline text-accent">
                  Crea una
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {boletas.slice(0, 4).map((boleta) => (
                  <Link
                    key={boleta.id}
                    href={`/empleado/boletas/${boleta._id ?? boleta.id}`}
                    className="w-full flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-secondary border border-border">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{boleta.tipo}</p>
                      <p className="text-xs text-muted-foreground">{formatFecha(boleta.fecha)}</p>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <p className="text-sm font-semibold text-foreground tabular-nums">{formatMonto(boleta.monto)}</p>
                      <StatusBadge status={boleta.estado} size="sm" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <EmpleadoStatsPanel stats={stats} loading={loadingData} montoPendienteCobro={pipeline} />
    </div>
  )
}
