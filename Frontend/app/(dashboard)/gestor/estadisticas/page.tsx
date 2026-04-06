"use client"

import { useState, useEffect, useCallback } from "react"
import { boletasApi, normalizeBoleta } from "@/lib/api"
import type { ApiStats } from "@/lib/types"
import type { Boleta } from "@/lib/mock-data"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import GestorStatsPanel from "@/components/gestor-stats-panel"

export default function GestorEstadisticasPage() {
  const [stats, setStats] = useState<ApiStats | null>(null)
  const [aprobadas, setAprobadas] = useState<Boleta[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [statsResult, boletasResult] = await Promise.allSettled([
        boletasApi.stats(),
        boletasApi.list({ limit: "200" }),
      ])
      if (statsResult.status === "fulfilled") {
        setStats(statsResult.value)
      } else {
        console.error("Error cargando estadísticas:", statsResult.reason)
      }
      if (boletasResult.status === "fulfilled") {
        const all = boletasResult.value.items.map(normalizeBoleta)
        setAprobadas(all.filter((b) => b.estado === "aprobada"))
      } else {
        console.error("Error cargando boletas:", boletasResult.reason)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const oldestUnpaid =
    aprobadas.length > 0
      ? aprobadas.reduce((oldest, b) =>
          new Date(b.fecha) < new Date(oldest.fecha) ? b : oldest
        )
      : null
  const oldestUnpaidDays = oldestUnpaid
    ? Math.floor((Date.now() - new Date(oldestUnpaid.fecha).getTime()) / 86400000)
    : null

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-lg">
      <BreadcrumbNav
        items={[
          { label: "Resumen", href: "/gestor" },
          { label: "Estadísticas" },
        ]}
      />
      <h1 className="text-xl font-bold text-foreground">Estadísticas de pagos</h1>
      <GestorStatsPanel
        stats={stats}
        loading={loading}
        oldestUnpaidDays={oldestUnpaidDays}
        mobile
      />
    </div>
  )
}
