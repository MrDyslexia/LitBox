"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  FileText,
  PlusCircle,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import BreadcrumbNav from "@/components/breadcrumb-nav"
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

  const displayStats = {
    total: stats?.total ?? boletas.length,
    pendientes: stats?.pendiente ?? 0,
    aprobadas: stats?.aprobada ?? 0,
    rechazadas: stats?.rechazada ?? 0,
    totalAprobado: stats?.montoAprobado ?? 0,
  }

  const montoPendienteCobro = Math.max(0, (stats?.montoAprobado ?? 0) - (stats?.montoPagado ?? 0))

  return (
    <div className="flex min-h-full">
      <div className="flex-1 min-w-0 p-4 sm:p-6 space-y-4 sm:space-y-6">
      <BreadcrumbNav items={[{ label: "Inicio" }]} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Hola, {user.name.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Aquí tienes un resumen de tus boletas de gastos.
          </p>
        </div>
        <Button
          className="shrink-0 h-9 font-semibold text-white text-sm"
          style={{ background: "var(--primary)" }}
          onClick={() => router.push("/empleado/nueva")}
        >
          <PlusCircle className="w-4 h-4 mr-1.5" />
          <span className="hidden sm:inline">Nueva boleta</span>
          <span className="sm:hidden">Nueva</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            label: "Total enviadas",
            value: displayStats.total,
            icon: FileText,
            accentColor: "var(--primary)",
            accentBg: "oklch(0.94 0.03 240)",
          },
          {
            label: "Pendientes",
            value: displayStats.pendientes,
            icon: Clock,
            accentColor: "oklch(0.55 0.14 72)",
            accentBg: "oklch(0.97 0.03 72)",
          },
          {
            label: "Aprobadas",
            value: displayStats.aprobadas,
            icon: CheckCircle,
            accentColor: "oklch(0.58 0.14 162)",
            accentBg: "oklch(0.95 0.04 162)",
          },
          {
            label: "Rechazadas",
            value: displayStats.rechazadas,
            icon: XCircle,
            accentColor: "oklch(0.55 0.22 27)",
            accentBg: "oklch(0.97 0.02 27)",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl p-4 sm:p-5"
            style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="text-xs font-semibold text-muted-foreground">{stat.label}</p>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: stat.accentBg }}
              >
                <stat.icon className="w-4 h-4" style={{ color: stat.accentColor }} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {loadingData ? "—" : stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Total reembolsado */}
      <div
        className="rounded-2xl p-4 sm:p-5 flex items-center justify-between"
        style={{ background: "var(--primary)" }}
      >
        <div>
          <p className="text-sm font-medium text-white/70">Total aprobado para reembolso</p>
          <p className="text-3xl sm:text-4xl font-black text-white mt-1 tracking-tight">
            {loadingData ? "—" : formatMonto(displayStats.totalAprobado)}
          </p>
        </div>
        <CheckCircle className="w-12 h-12 text-white/20 shrink-0" />
      </div>

      {/* Recent */}
      <Card className="border shadow-none">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Últimas boletas</CardTitle>
          <Link
            href="/empleado/boletas"
            className="text-xs font-medium flex items-center gap-1"
            style={{ color: "var(--accent)" }}
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
              <Link href="/empleado/nueva" className="underline" style={{ color: "var(--accent)" }}>
                Crea una
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {boletas.slice(0, 4).map((boleta) => (
                <Link
                  key={boleta.id}
                  href={`/empleado/boletas/${boleta._id ?? boleta.id}`}
                  className="w-full flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-muted/50 transition-colors text-left"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "var(--secondary)" }}
                  >
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{boleta.tipo}</p>
                    <p className="text-xs text-muted-foreground">{formatFecha(boleta.fecha)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-foreground">{formatMonto(boleta.monto)}</p>
                    <StatusBadge status={boleta.estado} size="sm" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
      <EmpleadoStatsPanel
        stats={stats}
        loading={loadingData}
        montoPendienteCobro={montoPendienteCobro}
      />
    </div>
  )
}
