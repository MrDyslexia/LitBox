"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  CheckCircle, XCircle, Clock, Timer,
  AlertTriangle, TrendingUp, BarChart3, ChevronRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import StatusBadge from "@/components/status-badge"
import { formatMonto, formatFecha, type Boleta } from "@/lib/mock-data"
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

  const pendientes   = boletas.filter((b) => b.estado === "pendiente" || b.estado === "en_revision")
  const backlog      = (stats?.pendiente ?? 0) + (stats?.en_revision ?? 0)
  const atrasadas    = stats?.boletasAtrasadas ?? 0
  const resueltasMes = stats?.resueltasMes ?? 0
  const aprobadasMes = stats?.aprobadasMes ?? 0
  const rechazadasMes = stats?.rechazadasMes ?? 0
  const tasaMes      = resueltasMes > 0 ? Math.round((aprobadasMes / resueltasMes) * 100) : null
  const tasaRechazo  = resueltasMes > 0 ? Math.round((rechazadasMes / resueltasMes) * 100) : null
  const throughputSem = Math.round(resueltasMes / 4.3)
  const tiempoAvg    = stats?.tiempoPromedioResolucion ?? null

  // SLA semáforo: <2d bueno, 2-3d alerta, >3d crítico
  const slaColor =
    tiempoAvg == null   ? "var(--muted-foreground)"
    : tiempoAvg < 2     ? "oklch(0.58 0.14 162)"
    : tiempoAvg <= 3    ? "oklch(0.55 0.14 72)"
                        : "oklch(0.55 0.22 27)"
  const slaLabel =
    tiempoAvg == null   ? "Sin datos"
    : tiempoAvg < 2     ? "Dentro de SLA"
    : tiempoAvg <= 3    ? "En límite"
                        : "Fuera de SLA"

  return (
    <div className="flex min-h-full">
      <div className="flex-1 min-w-0 p-4 sm:p-6 space-y-4 sm:space-y-6">
        <BreadcrumbNav items={[{ label: "Resumen" }]} />

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Panel de auditoría</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Rendimiento y cola de revisión en tiempo real.
            </p>
          </div>
          <Link
            href="/auditor/revision"
            className="shrink-0 flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-semibold text-white"
            style={{ background: "var(--primary)" }}
          >
            Revisar cola
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* ── KPI HERO ROW ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">

          {/* Backlog */}
          <div
            className="rounded-2xl p-4 sm:p-5"
            style={{
              background: backlog > 0 ? "oklch(0.97 0.03 72)" : "var(--secondary)",
              border: `1px solid ${backlog > 0 ? "oklch(0.88 0.07 72)" : "var(--border)"}`,
            }}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="text-xs font-semibold text-muted-foreground">Backlog actual</p>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: backlog > 0 ? "oklch(0.55 0.14 72 / 0.15)" : "var(--muted)" }}
              >
                <Clock className="w-4 h-4" style={{ color: backlog > 0 ? "oklch(0.55 0.14 72)" : "var(--muted-foreground)" }} />
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-black tracking-tight" style={{ color: backlog > 0 ? "oklch(0.38 0.12 72)" : "var(--foreground)" }}>
              {loadingData ? "—" : backlog}
            </p>
            <p className="text-xs mt-1.5" style={{ color: backlog > 0 ? "oklch(0.52 0.1 72)" : "var(--muted-foreground)" }}>
              {loadingData ? "" : backlog === 0 ? "Cola limpia" : `${stats?.pendiente ?? 0} pendiente · ${stats?.en_revision ?? 0} en revisión`}
            </p>
          </div>

          {/* Atrasadas SLA */}
          <div
            className="rounded-2xl p-4 sm:p-5"
            style={{
              background: atrasadas > 0 ? "oklch(0.97 0.02 27)" : "var(--secondary)",
              border: `1px solid ${atrasadas > 0 ? "oklch(0.88 0.06 27)" : "var(--border)"}`,
            }}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="text-xs font-semibold text-muted-foreground">Fuera de SLA</p>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: atrasadas > 0 ? "oklch(0.55 0.22 27 / 0.12)" : "var(--muted)" }}
              >
                <AlertTriangle className="w-4 h-4" style={{ color: atrasadas > 0 ? "oklch(0.55 0.22 27)" : "var(--muted-foreground)" }} />
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-black tracking-tight" style={{ color: atrasadas > 0 ? "oklch(0.45 0.22 27)" : "var(--foreground)" }}>
              {loadingData ? "—" : atrasadas}
            </p>
            <p className="text-xs mt-1.5" style={{ color: atrasadas > 0 ? "oklch(0.55 0.18 27)" : "var(--muted-foreground)" }}>
              {loadingData ? "" : atrasadas === 0 ? "Al día" : "+3 días sin resolución"}
            </p>
          </div>

          {/* Tasa aprobación mes */}
          <div
            className="rounded-2xl p-4 sm:p-5"
            style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="text-xs font-semibold text-muted-foreground">Tasa de aprobación</p>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "oklch(0.95 0.04 162)" }}
              >
                <CheckCircle className="w-4 h-4" style={{ color: "oklch(0.58 0.14 162)" }} />
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
              {loadingData ? "—" : tasaMes != null ? `${tasaMes}%` : "—"}
            </p>
            <div className="mt-2 space-y-1">
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: tasaMes != null ? `${tasaMes}%` : "0%", background: "oklch(0.58 0.14 162)" }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {loadingData ? "" : resueltasMes === 0 ? "Sin actividad este mes" : `${resueltasMes} resueltas este mes`}
              </p>
            </div>
          </div>
        </div>

        {/* ── PERFORMANCE KPIs ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* Throughput semanal */}
          <div
            className="rounded-2xl p-4 sm:p-5"
            style={{ background: "var(--primary)" }}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="text-xs font-semibold text-white/70">Throughput</p>
              <BarChart3 className="w-4 h-4 text-white/40" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {loadingData ? "—" : `${throughputSem}/sem`}
            </p>
            <p className="text-xs text-white/50 mt-1.5">
              {loadingData ? "" : `${resueltasMes} este mes`}
            </p>
          </div>

          {/* Tiempo promedio + SLA */}
          <div
            className="rounded-2xl p-4 sm:p-5"
            style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="text-xs font-semibold text-muted-foreground">Tiempo promedio</p>
              <Timer className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {loadingData ? "—" : tiempoAvg != null ? `${tiempoAvg.toFixed(1)}d` : "—"}
            </p>
            <p className="text-xs mt-1.5 font-medium" style={{ color: slaColor }}>
              {loadingData ? "" : slaLabel}
            </p>
          </div>

          {/* Aprobadas mes */}
          <div
            className="rounded-2xl p-4 sm:p-5"
            style={{ background: "oklch(0.97 0.01 162 / 0.6)", border: "1px solid oklch(0.92 0.02 162)" }}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="text-xs font-semibold text-muted-foreground">Aprobadas / mes</p>
              <CheckCircle className="w-4 h-4" style={{ color: "oklch(0.58 0.14 162)" }} />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {loadingData ? "—" : aprobadasMes}
            </p>
            <p className="text-xs text-muted-foreground mt-1.5">este mes</p>
          </div>

          {/* Tasa de rechazo */}
          <div
            className="rounded-2xl p-4 sm:p-5"
            style={{ background: "oklch(0.97 0.02 27 / 0.6)", border: "1px solid oklch(0.92 0.04 27)" }}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="text-xs font-semibold text-muted-foreground">Tasa de rechazo</p>
              <XCircle className="w-4 h-4" style={{ color: "oklch(0.55 0.22 27)" }} />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {loadingData ? "—" : tasaRechazo != null ? `${tasaRechazo}%` : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1.5">
              {loadingData ? "" : `${rechazadasMes} rechazadas`}
            </p>
          </div>
        </div>

        {/* ── COLA PENDIENTE ────────────────────────────────────────── */}
        {!loadingData && pendientes.length > 0 && (
          <Card className="border shadow-none">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "oklch(0.55 0.14 72)" }} />
                Cola de revisión
              </CardTitle>
              <Link
                href="/auditor/revision"
                className="text-xs font-medium flex items-center gap-1"
                style={{ color: "var(--accent)" }}
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
                      className="w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-muted/50 transition-colors"
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ background: esUrgente ? "oklch(0.55 0.22 27)" : "var(--accent)" }}
                      >
                        {boleta.empleadoNombre.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{boleta.empleadoNombre}</p>
                        <p className="text-xs text-muted-foreground">{boleta.tipo} · {formatFecha(boleta.fecha)}</p>
                      </div>
                      <div className="text-right shrink-0 space-y-1">
                        <p className="text-sm font-semibold text-foreground">{formatMonto(boleta.monto)}</p>
                        <div className="flex items-center gap-1.5 justify-end">
                          {esUrgente && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "oklch(0.97 0.02 27)", color: "oklch(0.45 0.22 27)" }}>
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
            className="rounded-2xl p-6 text-center"
            style={{ background: "oklch(0.97 0.01 162 / 0.4)", border: "1px solid oklch(0.92 0.02 162)" }}
          >
            <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: "oklch(0.58 0.14 162)" }} />
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
