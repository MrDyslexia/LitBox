"use client"

import { useState, useEffect, useCallback } from "react"
import { boletasApi, usersApi } from "@/lib/api"
import type { ApiStats } from "@/lib/types"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import AdminStatsPanel from "@/components/admin-stats-panel"

export default function AdminEstadisticasPage() {
  const [stats, setStats] = useState<ApiStats | null>(null)
  const [totalUsuarios, setTotalUsuarios] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [statsResult, usersResult] = await Promise.allSettled([
        boletasApi.stats(),
        usersApi.list({ limit: "100" }),
      ])
      if (statsResult.status === "fulfilled") {
        setStats(statsResult.value)
      } else {
        console.error("Error cargando estadísticas:", statsResult.reason)
      }
      if (usersResult.status === "fulfilled") {
        setTotalUsuarios(usersResult.value.total)
      } else {
        console.error("Error cargando usuarios:", usersResult.reason)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-lg">
      <BreadcrumbNav
        items={[
          { label: "Resumen general", href: "/administrador" },
          { label: "Estadísticas" },
        ]}
      />
      <h1 className="text-xl font-bold text-foreground">Estadísticas del sistema</h1>
      <AdminStatsPanel
        stats={stats}
        loading={loading}
        totalUsuarios={totalUsuarios}
        mobile
      />
    </div>
  )
}
