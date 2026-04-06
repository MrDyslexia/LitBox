"use client"

import { useState, useEffect, useCallback } from "react"
import { boletasApi } from "@/lib/api"
import type { ApiStats } from "@/lib/types"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import EmpleadoStatsPanel from "@/components/empleado-stats-panel"
import { formatMonto } from "@/lib/mock-data"

export default function EmpleadoEstadisticasPage() {
  const [stats, setStats] = useState<ApiStats | null>(null)
  const [loading, setLoading] = useState(true)

  const loadStats = useCallback(async () => {
    setLoading(true)
    try {
      const result = await boletasApi.stats()
      setStats(result)
    } catch (err) {
      console.error("Error cargando estadísticas:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const montoPendienteCobro = Math.max(
    0,
    (stats?.montoAprobado ?? 0) - (stats?.montoPagado ?? 0)
  )

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-lg">
      <BreadcrumbNav
        items={[
          { label: "Inicio", href: "/empleado" },
          { label: "Estadísticas" },
        ]}
      />
      <h1 className="text-xl font-bold text-foreground">Mis estadísticas</h1>
      <EmpleadoStatsPanel
        stats={stats}
        loading={loading}
        montoPendienteCobro={montoPendienteCobro}
        mobile
      />
    </div>
  )
}
