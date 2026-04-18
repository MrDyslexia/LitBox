"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  FileText, TrendingUp, CheckCircle, XCircle, Clock,
  DollarSign, Users, ChevronRight, AlertTriangle, Timer,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import PageHeader from "@/components/page-header"
import KpiCard from "@/components/kpi-card"
import { formatMonto, type Boleta } from "@/lib/mock-data"
import { UserAvatar } from "@/components/user-avatar"
import { boletasApi, usersApi, normalizeBoleta } from "@/lib/api"
import type { ApiUser, ApiStats } from "@/lib/types"
import { useBoletasSync } from "@/hooks/useBoletasSync"
import AdminStatsPanel from "@/components/admin-stats-panel"

const roleColors: Record<ApiUser["rol"], string> = {
  empleado:      "var(--accent)",
  auditor:       "oklch(0.60 0.14 65)",
  gestor:        "oklch(0.36 0.08 252)",
  administrador: "oklch(0.26 0.065 252)",
}

const roleLabels: Record<ApiUser["rol"], string> = {
  empleado: "Empleado",
  auditor: "Auditor",
  gestor: "Gestor",
  administrador: "Admin",
}

export default function AdminHomePage() {
  const [boletas, setBoletas]   = useState<Boleta[]>([])
  const [apiUsers, setApiUsers] = useState<ApiUser[]>([])
  const [stats, setStats]       = useState<ApiStats | null>(null)
  const [loadingData, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [boletasResult, usersResult, statsResult] = await Promise.allSettled([
        boletasApi.list({ limit: "200" }),
        usersApi.list({ limit: "100" }),
        boletasApi.stats(),
      ])
      if (boletasResult.status === "fulfilled")
        setBoletas(boletasResult.value.items.map(normalizeBoleta))
      if (usersResult.status === "fulfilled")
        setApiUsers(usersResult.value.items)
      if (statsResult.status === "fulfilled")
        setStats(statsResult.value)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])
  useBoletasSync(loadData)

  const total       = stats?.total ?? boletas.length
  const pendientes  = (stats?.pendiente ?? 0) + (stats?.en_revision ?? 0)
  const aprobadas   = stats?.aprobada ?? 0
  const rechazadas  = stats?.rechazada ?? 0
  const pagadas     = stats?.pagada ?? 0
  const atrasadas   = stats?.boletasAtrasadas ?? 0
  const montoAprobado  = stats?.montoAprobado ?? 0
  const montoPagado    = stats?.montoPagado ?? 0
  const tiempoEndToEnd = stats?.tiempoEndToEnd ?? null
  const tiempoResolucion = stats?.tiempoPromedioResolucion ?? null

  const resueltas = aprobadas + pagadas + rechazadas
  const tasaAprobacion = resueltas > 0 ? Math.round(((aprobadas + pagadas) / resueltas) * 100) : 0
  const expensePerUser = apiUsers.length > 0 ? montoPagado / apiUsers.length : 0
  const montoPendiente = boletas
    .filter((b) => b.estado === "pendiente" || b.estado === "en_revision")
    .reduce((s, b) => s + b.monto, 0)

  const cycleLabel =
    tiempoEndToEnd == null  ? "Sin datos"
    : tiempoEndToEnd < 7   ? "Eficiente"
    : tiempoEndToEnd <= 14 ? "Moderado"
                            : "Lento"
  const cycleTone: "default" | "success" | "warn" | "danger" =
    tiempoEndToEnd == null ? "default"
    : tiempoEndToEnd < 7 ? "success"
    : tiempoEndToEnd <= 14 ? "warn"
    : "danger"

  return (
    <div className="flex min-h-full">
      <div className="flex-1 min-w-0 p-4 sm:p-6 space-y-5">
        <BreadcrumbNav items={[{ label: "Resumen general" }]} />

        <PageHeader
          title="Panel de administración"
          description="Vista global del sistema de gestión de boletas."
        />

        {/* Hero — tasa global + cash exposure + SLA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <KpiCard
            tone="primary"
            size="lg"
            label="Tasa de aprobación global"
            icon={TrendingUp}
            value={loadingData ? "—" : `${tasaAprobacion}%`}
            sub={loadingData ? "" : `${aprobadas + pagadas} de ${resueltas} resueltas`}
            footer={
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.2)" }}>
                <div className="h-full rounded-full" style={{ width: `${loadingData ? 0 : tasaAprobacion}%`, background: "#fff" }} />
              </div>
            }
          />
          <div className="grid grid-rows-2 gap-3 sm:gap-4">
            <KpiCard
              tone={montoAprobado > 0 ? "warn" : "muted"}
              size="md"
              label="Cash Exposure"
              icon={DollarSign}
              value={loadingData ? "—" : formatMonto(montoAprobado)}
              sub={loadingData ? "" : `${aprobadas} sin pagar`}
            />
            <KpiCard
              tone={atrasadas > 0 ? "danger" : "muted"}
              size="md"
              label="Fuera de SLA"
              icon={AlertTriangle}
              value={loadingData ? "—" : atrasadas}
              sub={loadingData ? "" : atrasadas === 0 ? "Todo al día" : "+3 días sin resolver"}
            />
          </div>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard
            tone="muted" size="md" label="Total boletas" icon={FileText}
            value={loadingData ? "—" : total} sub="en el sistema"
          />
          <KpiCard
            tone="muted" size="md" label="Por resolver" icon={Clock}
            value={loadingData ? "—" : pendientes} sub="pendiente + revisión"
          />
          <KpiCard
            tone="muted" size="md" label="Aprobadas" icon={CheckCircle}
            value={loadingData ? "—" : aprobadas + pagadas} sub="incluye pagadas"
          />
          <KpiCard
            tone="muted" size="md" label="Rechazadas" icon={XCircle}
            value={loadingData ? "—" : rechazadas}
            sub={resueltas > 0 ? `${Math.round((rechazadas / resueltas) * 100)}% del total` : "—"}
          />
        </div>

        {/* Efficiency KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <KpiCard
            tone={cycleTone}
            size="md"
            label="Ciclo E2E (creación → pago)"
            icon={Timer}
            value={loadingData ? "—" : tiempoEndToEnd != null ? `${tiempoEndToEnd.toFixed(1)} días` : "—"}
            sub={loadingData ? "" : cycleLabel}
          />
          <KpiCard
            tone="muted" size="md" label="Gasto por empleado" icon={Users}
            value={loadingData ? "—" : apiUsers.length > 0 ? formatMonto(expensePerUser) : "—"}
            sub={loadingData ? "" : `promedio · ${apiUsers.length} usuarios`}
          />
          <KpiCard
            tone="muted" size="md" label="Tiempo de revisión" icon={Timer}
            value={loadingData ? "—" : tiempoResolucion != null ? `${tiempoResolucion.toFixed(1)} días` : "—"}
            sub="creación → decisión auditor"
          />
        </div>

        {/* Financiero */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <KpiCard
            tone="primary" size="lg" label="Monto total pagado" icon={CheckCircle}
            value={loadingData ? "—" : formatMonto(montoPagado)}
            sub={loadingData ? "" : `${pagadas} boletas pagadas`}
          />
          <KpiCard
            tone="warn" size="lg" label="Monto en revisión" icon={TrendingUp}
            value={loadingData ? "—" : formatMonto(montoPendiente)}
            sub={loadingData ? "" : `${pendientes} boletas en espera`}
          />
        </div>

        {/* Usuarios */}
        <Card className="border border-border shadow-none py-0">
          <CardHeader className="px-4 sm:px-5 py-3 flex flex-row items-center justify-between border-b border-border">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              Usuarios registrados
            </CardTitle>
            <Link
              href="/administrador/usuarios"
              className="text-[11px] font-semibold uppercase tracking-[0.12em] flex items-center gap-1 text-accent hover:text-accent/80 transition-colors"
            >
              Gestionar <ChevronRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {loadingData ? (
              <div className="px-5 py-6 text-center text-sm text-muted-foreground">Cargando...</div>
            ) : (
              <div className="divide-y divide-border">
                {apiUsers.slice(0, 5).map((u) => (
                  <div key={u._id} className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-muted/40 transition-colors">
                    <UserAvatar
                      avatar={u.avatar}
                      avatarUrl={u.avatarUrl}
                      name={u.nombre}
                      size={32}
                      roleColor={roleColors[u.rol]}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{u.nombre}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <span
                      className="text-[10px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded-full text-white shrink-0"
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
