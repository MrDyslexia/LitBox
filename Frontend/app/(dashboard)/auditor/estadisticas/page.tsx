"use client"

import { useState, useEffect, useCallback } from "react"
import { boletasApi } from "@/lib/api"
import type { ApiStats } from "@/lib/types"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import AuditorStatsPanel from "@/components/auditor-stats-panel"

export default function AuditorEstadisticasPage() {
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

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-lg">
      <BreadcrumbNav
        items={[
          { label: "Resumen", href: "/auditor" },
          { label: "Estadísticas" },
        ]}
      />
      <h1 className="text-xl font-bold text-foreground">Estadísticas de auditoría</h1>
      <AuditorStatsPanel stats={stats} loading={loading} mobile />
    </div>
  )
}
