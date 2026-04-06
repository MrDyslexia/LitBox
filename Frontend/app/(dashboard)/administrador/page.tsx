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
  Timer,
  CalendarDays,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import { formatMonto, type Boleta } from "@/lib/mock-data"
import { boletasApi, usersApi, normalizeBoleta } from "@/lib/api"
import type { ApiUser, ApiStats } from "@/lib/types"
import { useBoletasSync } from "@/hooks/useBoletasSync"
import AdminStatsPanel from "@/components/admin-stats-panel"

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

  const aprobadas = stats?.aprobada ?? 0
  const pagadas = stats?.pagada ?? 0
  const rechazadas = stats?.rechazada ?? 0
  const tasaAprobacion = Math.round(
    ((aprobadas + pagadas) / Math.max(aprobadas + pagadas + rechazadas, 1)) * 100
  )

  return (
    <div className="flex min-h-full">
      <div className="flex-1 min-w-0 p-4 sm:p-6 space-y-4 sm:space-y-6">
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
          {
            label: "Total boletas",
            value: displayStats.totalBoletas,
            icon: FileText,
            accentColor: "var(--primary)",
            accentBg: "oklch(0.94 0.03 240)",
          },
          {
            label: "Por resolver",
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
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl p-4 sm:p-5"
            style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="text-xs font-semibold text-muted-foreground">{s.label}</p>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: s.accentBg }}
              >
                <s.icon className="w-4 h-4" style={{ color: s.accentColor }} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {loadingData ? "—" : s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Financial summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div
          className="rounded-2xl p-4 sm:p-5 flex items-center justify-between"
          style={{ background: "var(--primary)" }}
        >
          <div>
            <p className="text-sm font-medium text-white/70">Monto total aprobado</p>
            <p className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-1">
              {loadingData ? "—" : formatMonto(displayStats.montoAprobado)}
            </p>
            <p className="text-xs text-white/50 mt-1">{displayStats.aprobadas} boletas aprobadas</p>
          </div>
          <DollarSign className="w-12 h-12 text-white/20 shrink-0" />
        </div>
        <div
          className="rounded-2xl p-4 sm:p-5 flex items-center justify-between"
          style={{ background: "oklch(0.97 0.03 72)", border: "1px solid oklch(0.92 0.05 72)" }}
        >
          <div>
            <p className="text-sm font-medium" style={{ color: "oklch(0.45 0.1 72)" }}>Monto pendiente</p>
            <p
              className="text-3xl sm:text-4xl font-black tracking-tight mt-1"
              style={{ color: "oklch(0.32 0.12 72)" }}
            >
              {loadingData ? "—" : formatMonto(displayStats.montoPendiente)}
            </p>
            <p className="text-xs mt-1" style={{ color: "oklch(0.55 0.1 72)" }}>
              {displayStats.pendientes} boletas en espera
            </p>
          </div>
          <TrendingUp className="w-12 h-12 shrink-0" style={{ color: "oklch(0.62 0.14 72 / 0.25)" }} />
        </div>
      </div>

      {/* New KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Tasa de aprobacion */}
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
          <p className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            {loadingData ? "—" : `${tasaAprobacion}%`}
          </p>
          <div className="w-full h-1.5 rounded-full overflow-hidden mt-2" style={{ background: "var(--muted)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: loadingData ? "0%" : `${tasaAprobacion}%`, background: "var(--primary)" }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            {loadingData ? "" : `${aprobadas + pagadas} de ${aprobadas + pagadas + rechazadas} resueltas`}
          </p>
        </div>

        {/* Tiempo promedio */}
        <div
          className="rounded-2xl p-4 sm:p-5"
          style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <p className="text-xs font-semibold text-muted-foreground">Tiempo promedio</p>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "oklch(0.94 0.03 240)" }}
            >
              <Timer className="w-4 h-4" style={{ color: "var(--primary)" }} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
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
              ? "De creación a revisión"
              : "Sin datos suficientes"}
          </p>
        </div>

        {/* Boletas este mes */}
        <div
          className="rounded-2xl p-4 sm:p-5"
          style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <p className="text-xs font-semibold text-muted-foreground">Boletas este mes</p>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "oklch(0.94 0.03 290)" }}
            >
              <CalendarDays className="w-4 h-4" style={{ color: "oklch(0.52 0.18 290)" }} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            {loadingData ? "—" : stats?.boletasMes ?? 0}
          </p>
          <p className="text-xs text-muted-foreground mt-1.5">
            {loadingData ? "" : formatMonto(stats?.montoMes ?? 0)}
          </p>
        </div>
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
      <AdminStatsPanel stats={stats} loading={loadingData} totalUsuarios={apiUsers.length} />
    </div>
  )
}
