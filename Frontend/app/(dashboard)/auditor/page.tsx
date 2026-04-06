"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { CheckCircle, XCircle, Clock, Timer, CalendarDays } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import StatusBadge from "@/components/status-badge"
import { formatMonto, formatFecha, type Boleta } from "@/lib/mock-data"
import { boletasApi, normalizeBoleta } from "@/lib/api"
import type { ApiStats } from "@/lib/types"
import { useBoletasSync } from "@/hooks/useBoletasSync"

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
      if (boletasResult.status === "fulfilled") {
        setBoletas(boletasResult.value.items.map(normalizeBoleta))
      } else {
        console.error("Error cargando boletas:", boletasResult.reason)
      }
      if (statsResult.status === "fulfilled") {
        setStats(statsResult.value)
      } else {
        console.error("Error cargando stats:", statsResult.reason)
      }
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useBoletasSync(loadData)

  const pendientes = boletas.filter((b) => b.estado === "pendiente" || b.estado === "en_revision")

  const displayStats = {
    pendientes: (stats?.pendiente ?? 0) + (stats?.en_revision ?? 0),
    aprobadas: stats?.aprobada ?? 0,
    rechazadas: stats?.rechazada ?? 0,
  }

  const resueltasMes = stats?.resueltasMes ?? 0
  const aprobadasMes = stats?.aprobadasMes ?? 0
  const rechazadasMes = stats?.rechazadasMes ?? 0
  const tasaMes = resueltasMes > 0
    ? Math.round((aprobadasMes / resueltasMes) * 100)
    : null

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-5xl">
      <BreadcrumbNav items={[{ label: "Resumen" }]} />
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Panel de auditoría</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gestiona y revisa las solicitudes de reembolso de todos los empleados.
        </p>
      </div>

      {/* Global counts row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: "Por revisar", value: displayStats.pendientes, icon: <Clock className="w-4 h-4 sm:w-5 sm:h-5" />, color: "oklch(0.62 0.14 72)", bg: "oklch(0.97 0.03 72)" },
          { label: "Aprobadas", value: displayStats.aprobadas, icon: <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />, color: "oklch(0.58 0.14 162)", bg: "oklch(0.95 0.04 162)" },
          { label: "Rechazadas", value: displayStats.rechazadas, icon: <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />, color: "oklch(0.55 0.22 27)", bg: "oklch(0.97 0.02 27)" },
        ].map((stat) => (
          <Card key={stat.label} className="border shadow-none">
            <CardContent className="p-3 sm:p-5">
              <div
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mb-2 sm:mb-3"
                style={{ background: stat.bg }}
              >
                <span style={{ color: stat.color }}>{stat.icon}</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">
                {loadingData ? "—" : stat.value}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tasa de aprobacion + tiempo promedio */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Tasa de aprobacion */}
        <Card className="border shadow-none">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-muted-foreground">Tasa de aprobación</p>
              <CheckCircle className="w-4 h-4" style={{ color: "oklch(0.58 0.14 162)" }} />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              {loadingData ? "—" : tasaMes != null ? `${tasaMes}%` : "—"}
            </p>
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: loadingData || tasaMes == null ? "0%" : `${tasaMes}%`,
                  background: "var(--primary)",
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              {loadingData
                ? ""
                : resueltasMes === 0
                ? "Sin actividad este mes"
                : "De las boletas resueltas este mes por ti"}
            </p>
          </CardContent>
        </Card>

        {/* Tiempo promedio */}
        <Card className="border shadow-none">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-muted-foreground">Tiempo promedio de resolución</p>
              <Timer className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-foreground">
              {loadingData
                ? "—"
                : stats?.tiempoPromedioResolucion != null
                ? `${stats.tiempoPromedioResolucion.toFixed(1)} días`
                : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1.5">
              {loadingData
                ? ""
                : stats?.tiempoPromedioResolucion != null
                ? "Promedio de días desde la creación"
                : "Sin datos suficientes"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Personal stats this month */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[
          {
            label: "Resueltas este mes",
            value: resueltasMes,
            icon: <CalendarDays className="w-4 h-4" />,
            color: "var(--primary)",
            bg: "oklch(0.94 0.03 240)",
          },
          {
            label: "Aprobadas este mes",
            value: aprobadasMes,
            icon: <CheckCircle className="w-4 h-4" />,
            color: "oklch(0.58 0.14 162)",
            bg: "oklch(0.95 0.04 162)",
          },
          {
            label: "Rechazadas este mes",
            value: rechazadasMes,
            icon: <XCircle className="w-4 h-4" />,
            color: "oklch(0.55 0.22 27)",
            bg: "oklch(0.97 0.02 27)",
          },
        ].map((stat) => (
          <Card key={stat.label} className="border shadow-none" style={{ background: "var(--muted)/30" }}>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground leading-tight">{stat.label}</span>
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                  style={{ background: stat.bg }}
                >
                  <span style={{ color: stat.color }}>{stat.icon}</span>
                </div>
              </div>
              <p className="text-xl font-bold text-foreground">
                {loadingData ? "—" : stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pendientes urgentes */}
      {!loadingData && pendientes.length > 0 && (
        <Card className="border shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: "oklch(0.65 0.15 70)" }}
              />
              Solicitudes pendientes de revisión
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {pendientes.slice(0, 5).map((boleta) => (
                <Link
                  key={boleta.id}
                  href={`/auditor/revision/${boleta._id ?? boleta.id}`}
                  className="w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-muted/50 transition-colors text-left"
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: "var(--accent)" }}
                  >
                    {boleta.empleadoNombre.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{boleta.empleadoNombre}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {boleta.tipo} — {formatFecha(boleta.fecha)}
                    </p>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <p className="text-sm font-semibold text-foreground">{formatMonto(boleta.monto)}</p>
                    <StatusBadge status={boleta.estado} size="sm" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {loadingData && (
        <div className="text-center py-8 text-sm text-muted-foreground">Cargando datos...</div>
      )}
    </div>
  )
}
