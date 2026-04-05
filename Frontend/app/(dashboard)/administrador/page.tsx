"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  FileText,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Users,
  ChevronDown,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import { formatMonto, type Boleta } from "@/lib/mock-data"
import { boletasApi, usersApi, normalizeBoleta } from "@/lib/api"
import type { ApiUser, ApiStats } from "@/lib/types"
import { useBoletasSync } from "@/hooks/useBoletasSync"

const roleColors: Record<ApiUser["rol"], string> = {
  empleado: "oklch(0.58 0.14 162)",
  auditor: "oklch(0.62 0.14 72)",
  gestor: "oklch(0.52 0.18 290)",
  administrador: "oklch(0.28 0.1 243)",
}

const roleLabels: Record<ApiUser["rol"], string> = {
  empleado: "Empleado",
  auditor: "Auditor",
  gestor: "Gestor",
  administrador: "Admin",
}

export default function AdminHomePage() {
  const [boletas, setBoletas] = useState<Boleta[]>([])
  const [apiUsers, setApiUsers] = useState<ApiUser[]>([])
  const [stats, setStats] = useState<ApiStats | null>(null)
  const [loadingData, setLoadingData] = useState(true)

  const loadData = useCallback(async () => {
    setLoadingData(true)
    try {
      const [boletasResult, usersResult, statsResult] = await Promise.allSettled([
        boletasApi.list({ limit: "200" }),
        usersApi.list({ limit: "100" }),
        boletasApi.stats(),
      ])
      if (boletasResult.status === "fulfilled") {
        setBoletas(boletasResult.value.items.map(normalizeBoleta))
      } else {
        console.error("Error cargando boletas:", boletasResult.reason)
      }
      if (usersResult.status === "fulfilled") {
        setApiUsers(usersResult.value.items)
      } else {
        console.error("Error cargando usuarios:", usersResult.reason)
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
    totalBoletas: stats?.total ?? boletas.length,
    pendientes: (stats?.pendiente ?? 0) + (stats?.en_revision ?? 0),
    aprobadas: stats?.aprobada ?? 0,
    rechazadas: stats?.rechazada ?? 0,
    montoAprobado: stats?.montoAprobado ?? 0,
    montoPendiente: boletas
      .filter((b) => b.estado === "pendiente" || b.estado === "en_revision")
      .reduce((s, b) => s + b.monto, 0),
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-6xl">
      <BreadcrumbNav items={[{ label: "Resumen general" }]} />
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Panel de administración</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Vista global del sistema de gestión de boletas.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Total boletas", value: displayStats.totalBoletas, icon: <FileText className="w-4 h-4 sm:w-5 sm:h-5" />, color: "var(--primary)", bg: "oklch(0.94 0.03 240)" },
          { label: "Por resolver", value: displayStats.pendientes, icon: <Clock className="w-4 h-4 sm:w-5 sm:h-5" />, color: "oklch(0.62 0.14 72)", bg: "oklch(0.97 0.03 72)" },
          { label: "Aprobadas", value: displayStats.aprobadas, icon: <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />, color: "oklch(0.58 0.14 162)", bg: "oklch(0.95 0.04 162)" },
          { label: "Rechazadas", value: displayStats.rechazadas, icon: <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />, color: "oklch(0.55 0.22 27)", bg: "oklch(0.97 0.02 27)" },
        ].map((s) => (
          <Card key={s.label} className="border shadow-none">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-xs font-medium text-muted-foreground leading-tight">{s.label}</span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: s.bg }}>
                  <span style={{ color: s.color }}>{s.icon}</span>
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-foreground">
                {loadingData ? "—" : s.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Financial summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Card className="border shadow-none" style={{ background: "var(--primary)" }}>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-white/70">Monto total aprobado</p>
              <DollarSign className="w-5 h-5 text-white/30" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white">
              {loadingData ? "—" : formatMonto(displayStats.montoAprobado)}
            </p>
            <p className="text-xs text-white/50 mt-1">{displayStats.aprobadas} boletas aprobadas</p>
          </CardContent>
        </Card>
        <Card className="border shadow-none" style={{ background: "oklch(0.97 0.03 72)" }}>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium" style={{ color: "oklch(0.45 0.1 72)" }}>Monto pendiente</p>
              <TrendingUp className="w-5 h-5" style={{ color: "oklch(0.62 0.14 72)" }} />
            </div>
            <p className="text-2xl sm:text-3xl font-bold" style={{ color: "oklch(0.32 0.12 72)" }}>
              {loadingData ? "—" : formatMonto(displayStats.montoPendiente)}
            </p>
            <p className="text-xs mt-1" style={{ color: "oklch(0.55 0.1 72)" }}>{displayStats.pendientes} boletas en espera</p>
          </CardContent>
        </Card>
      </div>

      {/* User summary */}
      <Card className="border shadow-none">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            Usuarios registrados
          </CardTitle>
          <Link
            href="/administrador/usuarios"
            className="text-xs font-medium flex items-center gap-1"
            style={{ color: "var(--accent)" }}
          >
            Gestionar <ChevronDown className="w-3 h-3 rotate-[-90deg]" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {loadingData ? (
            <div className="px-5 py-6 text-center text-sm text-muted-foreground">Cargando...</div>
          ) : (
            <div className="divide-y divide-border">
              {apiUsers.slice(0, 5).map((u) => (
                <div key={u._id} className="flex items-center gap-3 px-4 sm:px-5 py-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: roleColors[u.rol] }}
                  >
                    {u.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{u.nombre}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white shrink-0"
                    style={{ background: roleColors[u.rol] }}
                  >
                    {roleLabels[u.rol]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
