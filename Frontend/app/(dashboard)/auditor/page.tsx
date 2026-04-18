"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  CheckCircle, XCircle, Clock, Timer,
  AlertTriangle, BarChart3, ChevronRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import PageHeader from "@/components/page-header"
import StatusBadge from "@/components/status-badge"
import KpiCard from "@/components/kpi-card"
import { formatMonto, formatFecha, type Boleta } from "@/lib/mock-data"
import { UserAvatar } from "@/components/user-avatar"
import { boletasApi, normalizeBoleta } from "@/lib/api"
import type { ApiStats } from "@/lib/types"
import { useBoletasSync } from "@/hooks/useBoletasSync"
import AuditorStatsPanel from "@/components/auditor-stats-panel"

export default function AuditorHomePage() {
  const [boletas, setBoletas] = useState<Boleta[]>([])
  const [stats, setStats] = useState<ApiStats | null>(null)
  const [loadingData, setLoadingData] = useState(true)

  const loadData = useCallback(async () => {
    setLoadingData(true)
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
      setLoadingData(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])
  useBoletasSync(loadData)

  const pendientes    = boletas.filter((b) => b.estado === "pendiente" || b.estado === "en_revision")
  const backlog       = (stats?.pendiente ?? 0) + (stats?.en_revision ?? 0)
  const atrasadas     = stats?.boletasAtrasadas ?? 0
  const resueltasMes  = stats?.resueltasMes ?? 0
  const aprobadasMes  = stats?.aprobadasMes ?? 0
  const rechazadasMes = stats?.rechazadasMes ?? 0
  const tasaMes       = resueltasMes > 0 ? Math.round((aprobadasMes / resueltasMes) * 100) : null
  const tasaRechazo   = resueltasMes > 0 ? Math.round((rechazadasMes / resueltasMes) * 100) : null
  const throughputSem = Math.round(resueltasMes / 4.3)
  const tiempoAvg     = stats?.tiempoPromedioResolucion ?? null

  const slaTone: "default" | "success" | "warn" | "danger" =
    tiempoAvg == null ? "default"
    : tiempoAvg < 2 ? "success"
    : tiempoAvg <= 3 ? "warn"
    : "danger"
  const slaLabel =
    tiempoAvg == null ? "Sin datos"
    : tiempoAvg < 2 ? "Dentro de SLA"
    : tiempoAvg <= 3 ? "En límite"
    : "Fuera de SLA"

  return (
    <div className="flex min-h-full">
      <div className="flex-1 min-w-0 p-4 sm:p-6 space-y-5 sm:space-y-6">
        <BreadcrumbNav items={[{ label: "Resumen" }]} />

        <PageHeader
          title="Panel de auditoría"
          description="Rendimiento y cola de revisión en tiempo real."
          action={
            <Link
              href="/auditor/revision"
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Revisar cola
              <ChevronRight className="w-4 h-4" />
            </Link>
          }
        />

        {/* Hero row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <KpiCard
            tone={backlog > 0 ? "warn" : "muted"}
            size="lg"
            label="Backlog actual"
            icon={Clock}
            value={loadingData ? "—" : backlog}
            sub={
              loadingData ? ""
              : backlog === 0 ? "Cola limpia"
              : `${stats?.pendiente ?? 0} pendiente · ${stats?.en_revision ?? 0} en revisión`
            }
          />
          <KpiCard
            tone={atrasadas > 0 ? "danger" : "muted"}
            size="lg"
            label="Fuera de SLA"
            icon={AlertTriangle}
            value={loadingData ? "—" : atrasadas}
            sub={loadingData ? "" : atrasadas === 0 ? "Al día" : "+3 días sin resolución"}
          />
          <KpiCard
            tone="muted"
            size="lg"
            label="Tasa de aprobación"
            icon={CheckCircle}
            value={loadingData ? "—" : tasaMes != null ? `${tasaMes}%` : "—"}
            sub={
              loadingData ? ""
              : resueltasMes === 0 ? "Sin actividad este mes"
              : `${resueltasMes} resueltas este mes`
            }
            footer={
              <div className="w-full h-1.5 rounded-full overflow-hidden bg-muted">
                <div className="h-full rounded-full" style={{ width: tasaMes != null ? `${tasaMes}%` : "0%", background: "var(--chart-3)" }} />
              </div>
            }
          />
        </div>

        {/* Performance KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard
            tone="primary" size="md" label="Throughput" icon={BarChart3}
            value={loadingData ? "—" : `${throughputSem}/sem`}
            sub={loadingData ? "" : `${resueltasMes} este mes`}
          />
          <KpiCard
            tone={slaTone} size="md" label="Tiempo promedio" icon={Timer}
            value={loadingData ? "—" : tiempoAvg != null ? `${tiempoAvg.toFixed(1)}d` : "—"}
            sub={loadingData ? "" : slaLabel}
          />
          <KpiCard
            tone="success" size="md" label="Aprobadas / mes" icon={CheckCircle}
            value={loadingData ? "—" : aprobadasMes}
            sub="este mes"
          />
          <KpiCard
            tone="danger" size="md" label="Tasa de rechazo" icon={XCircle}
            value={loadingData ? "—" : tasaRechazo != null ? `${tasaRechazo}%` : "—"}
            sub={loadingData ? "" : `${rechazadasMes} rechazadas`}
          />
        </div>

        {/* Cola pendiente */}
        {!loadingData && pendientes.length > 0 && (
          <Card className="border border-border shadow-none py-0">
            <CardHeader className="px-4 sm:px-5 py-3 flex flex-row items-center justify-between border-b border-border">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--chart-4)" }} />
                Cola de revisión
              </CardTitle>
              <Link
                href="/auditor/revision"
                className="text-[11px] font-semibold uppercase tracking-[0.12em] flex items-center gap-1 text-accent hover:text-accent/80 transition-colors"
              >
                Ver todas <ChevronRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {pendientes.slice(0, 5).map((boleta) => {
                  const diasEnCola = Math.floor(
                    (Date.now() - new Date(boleta.fecha).getTime()) / 86400000
                  )
                  const esUrgente = diasEnCola >= 3
                  return (
                    <Link
                      key={boleta.id}
                      href={`/auditor/revision/${boleta._id ?? boleta.id}`}
                      className="w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-muted/40 transition-colors"
                    >
                      <UserAvatar
                        avatar={boleta.empleadoNombre.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        avatarUrl={boleta.empleadoAvatarUrl}
                        name={boleta.empleadoNombre}
                        size={36}
                        roleColor={esUrgente ? "var(--destructive)" : "var(--accent)"}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{boleta.empleadoNombre}</p>
                        <p className="text-xs text-muted-foreground truncate">{boleta.tipo} · {formatFecha(boleta.fecha)}</p>
                      </div>
                      <div className="text-right shrink-0 space-y-1">
                        <p className="text-sm font-semibold text-foreground tabular-nums">{formatMonto(boleta.monto)}</p>
                        <div className="flex items-center gap-1.5 justify-end">
                          {esUrgente && (
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded tabular-nums"
                              style={{ background: "var(--danger-bg)", color: "var(--danger-fg)" }}
                            >
                              {diasEnCola}d
                            </span>
                          )}
                          <StatusBadge status={boleta.estado} size="sm" />
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {!loadingData && pendientes.length === 0 && (
          <div
            className="rounded-xl p-6 text-center border"
            style={{ background: "var(--success-bg)", borderColor: "var(--success-border)" }}
          >
            <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--success-fg)" }} />
            <p className="text-sm font-semibold text-foreground">Cola limpia</p>
            <p className="text-xs text-muted-foreground mt-1">No hay boletas pendientes de revisión.</p>
          </div>
        )}

        {loadingData && (
          <div className="text-center py-8 text-sm text-muted-foreground">Cargando...</div>
        )}
      </div>
      <AuditorStatsPanel stats={stats} loading={loadingData} />
    </div>
  )
}
