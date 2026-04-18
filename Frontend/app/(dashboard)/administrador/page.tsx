"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  FileText, TrendingUp, CheckCircle, XCircle, Clock,
  DollarSign, Users, ChevronDown, AlertTriangle, Timer,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import { formatMonto, type Boleta } from "@/lib/mock-data"
import { boletasApi, usersApi, normalizeBoleta } from "@/lib/api"
import type { ApiUser, ApiStats } from "@/lib/types"
import { useBoletasSync } from "@/hooks/useBoletasSync"
import AdminStatsPanel from "@/components/admin-stats-panel"

const roleColors: Record<ApiUser["rol"], string> = {
  empleado:      "oklch(0.52 0.21 28)",
  auditor:       "oklch(0.60 0.14 65)",
  gestor:        "oklch(0.36 0.08 252)",
  administrador: "oklch(0.26 0.065 252)",
}

const roleLabels: Record<ApiUser["rol"], string> = {
  empleado: "Empleado", auditor: "Auditor", gestor: "Gestor", administrador: "Admin",
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

  // Cycle time semáforo: <7d ok, 7-14d alerta, >14d crítico
  const cycleColor =
    tiempoEndToEnd == null  ? "var(--muted-foreground)"
    : tiempoEndToEnd < 7   ? "oklch(0.58 0.14 162)"
    : tiempoEndToEnd <= 14 ? "oklch(0.55 0.14 72)"
                            : "oklch(0.55 0.22 27)"
  const cycleLabel =
    tiempoEndToEnd == null  ? "Sin datos"
    : tiempoEndToEnd < 7   ? "Eficiente"
    : tiempoEndToEnd <= 14 ? "Moderado"
                            : "Lento"

  return (
    <div className="flex min-h-full">
      <div className="flex-1 min-w-0 p-4 sm:p-6 space-y-4 sm:space-y-6">
        <BreadcrumbNav items={[{ label: "Resumen general" }]} />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Panel de administración</h1>
          <p className="text-muted-foreground text-sm mt-1">Vista global del sistema de gestión de boletas.</p>
        </div>

        {/* ── HERO: TASA GLOBAL + CASH EXPOSURE ─────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Tasa global */}
          <div className="rounded-2xl p-5" style={{ background: "var(--primary)" }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-white/70">Tasa de aprobación global</p>
              <TrendingUp className="w-5 h-5 text-white/40" />
            </div>
            <p className="text-5xl font-black text-white tracking-tight">
              {loadingData ? "—" : `${tasaAprobacion}%`}
            </p>
            <div className="w-full h-2 rounded-full overflow-hidden mt-3" style={{ background: "rgba(255,255,255,0.2)" }}>
              <div className="h-full rounded-full" style={{ width: `${loadingData ? 0 : tasaAprobacion}%`, background: "white" }} />
            </div>
            <p className="text-xs text-white/50 mt-2">
              {loadingData ? "" : `${aprobadas + pagadas} de ${resueltas} resueltas`}
            </p>
          </div>

          {/* Cash exposure + atrasadas */}
          <div className="grid grid-rows-2 gap-3">
            <div
              className="rounded-2xl p-4 flex items-center justify-between"
              style={{ background: montoAprobado > 0 ? "oklch(0.97 0.03 72)" : "var(--secondary)", border: `1px solid ${montoAprobado > 0 ? "oklch(0.88 0.07 72)" : "var(--border)"}` }}
            >
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Cash Exposure</p>
                <p className="text-2xl font-black text-foreground tracking-tight mt-1">
                  {loadingData ? "—" : formatMonto(montoAprobado)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{loadingData ? "" : `${aprobadas} sin pagar`}</p>
              </div>
              <DollarSign className="w-8 h-8 shrink-0" style={{ color: montoAprobado > 0 ? "oklch(0.62 0.14 72 / 0.4)" : "var(--border)" }} />
            </div>
            <div
              className="rounded-2xl p-4 flex items-center justify-between"
              style={{ background: atrasadas > 0 ? "oklch(0.97 0.02 27)" : "var(--secondary)", border: `1px solid ${atrasadas > 0 ? "oklch(0.88 0.06 27)" : "var(--border)"}` }}
            >
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Fuera de SLA</p>
                <p className="text-2xl font-black tracking-tight mt-1" style={{ color: atrasadas > 0 ? "oklch(0.45 0.22 27)" : "var(--foreground)" }}>
                  {loadingData ? "—" : atrasadas}
                </p>
                <p className="text-xs mt-0.5" style={{ color: atrasadas > 0 ? "oklch(0.55 0.18 27)" : "var(--muted-foreground)" }}>
                  {loadingData ? "" : atrasadas === 0 ? "Todo al día" : "+3 días sin resolver"}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 shrink-0" style={{ color: atrasadas > 0 ? "oklch(0.55 0.22 27 / 0.3)" : "var(--border)" }} />
            </div>
          </div>
        </div>

        {/* ── KPI GRID ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "Total boletas",  value: loadingData ? "—" : total,      sub: "en el sistema",        icon: FileText,    color: "var(--primary)",           bg: "oklch(0.94 0.02 252)" },
            { label: "Por resolver",   value: loadingData ? "—" : pendientes,  sub: "pendiente + revisión", icon: Clock,       color: "oklch(0.55 0.14 72)",      bg: "oklch(0.97 0.03 72)" },
            { label: "Aprobadas",      value: loadingData ? "—" : aprobadas + pagadas, sub: "incluye pagadas", icon: CheckCircle, color: "oklch(0.58 0.14 162)", bg: "oklch(0.95 0.04 162)" },
            { label: "Rechazadas",     value: loadingData ? "—" : rechazadas,  sub: resueltas > 0 ? `${Math.round((rechazadas / resueltas) * 100)}% del total` : "—", icon: XCircle, color: "oklch(0.55 0.22 27)", bg: "oklch(0.97 0.02 27)" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-4 sm:p-5" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between gap-2 mb-3">
                <p className="text-xs font-semibold text-muted-foreground">{s.label}</p>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: s.bg }}>
                  <s.icon className="w-4 h-4" style={{ color: s.color }} />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* ── EFFICIENCY KPIs ───────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Cycle E2E */}
          <div className="rounded-2xl p-4 sm:p-5" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="text-xs font-semibold text-muted-foreground">Ciclo E2E (creación → pago)</p>
              <Timer className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {loadingData ? "—" : tiempoEndToEnd != null ? `${tiempoEndToEnd.toFixed(1)} días` : "—"}
            </p>
            <p className="text-xs mt-1.5 font-medium" style={{ color: cycleColor }}>{loadingData ? "" : cycleLabel}</p>
          </div>

          {/* Expense per user */}
          <div className="rounded-2xl p-4 sm:p-5" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="text-xs font-semibold text-muted-foreground">Gasto por empleado</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "oklch(0.94 0.02 252)" }}>
                <Users className="w-4 h-4" style={{ color: "var(--primary)" }} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {loadingData ? "—" : apiUsers.length > 0 ? formatMonto(expensePerUser) : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1.5">
              {loadingData ? "" : `promedio · ${apiUsers.length} usuarios`}
            </p>
          </div>

          {/* Tiempo de resolución */}
          <div className="rounded-2xl p-4 sm:p-5" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="text-xs font-semibold text-muted-foreground">Tiempo de revisión</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "oklch(0.94 0.02 252)" }}>
                <Timer className="w-4 h-4" style={{ color: "var(--primary)" }} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {loadingData ? "—" : tiempoResolucion != null ? `${tiempoResolucion.toFixed(1)} días` : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1.5">creación → decisión auditor</p>
          </div>
        </div>

        {/* ── FINANCIERO ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="rounded-2xl p-4 sm:p-5 flex items-center justify-between" style={{ background: "var(--primary)" }}>
            <div>
              <p className="text-sm font-medium text-white/70">Monto total pagado</p>
              <p className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-1">
                {loadingData ? "—" : formatMonto(montoPagado)}
              </p>
              <p className="text-xs text-white/50 mt-1">{loadingData ? "" : `${pagadas} boletas pagadas`}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-white/20 shrink-0" />
          </div>
          <div
            className="rounded-2xl p-4 sm:p-5 flex items-center justify-between"
            style={{ background: "oklch(0.97 0.03 72)", border: "1px solid oklch(0.92 0.05 72)" }}
          >
            <div>
              <p className="text-sm font-medium" style={{ color: "oklch(0.45 0.1 72)" }}>Monto en revisión</p>
              <p className="text-3xl sm:text-4xl font-black tracking-tight mt-1" style={{ color: "oklch(0.32 0.12 72)" }}>
                {loadingData ? "—" : formatMonto(displayStats_montoPendiente(boletas))}
              </p>
              <p className="text-xs mt-1" style={{ color: "oklch(0.55 0.1 72)" }}>
                {loadingData ? "" : `${pendientes} boletas en espera`}
              </p>
            </div>
            <TrendingUp className="w-12 h-12 shrink-0" style={{ color: "oklch(0.62 0.14 72 / 0.25)" }} />
          </div>
        </div>

        {/* ── USUARIOS ──────────────────────────────────────────── */}
        <Card className="border shadow-none">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              Usuarios registrados
            </CardTitle>
            <Link href="/administrador/usuarios" className="text-xs font-medium flex items-center gap-1" style={{ color: "var(--accent)" }}>
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

function displayStats_montoPendiente(boletas: Boleta[]) {
  return boletas
    .filter((b) => b.estado === "pendiente" || b.estado === "en_revision")
    .reduce((s, b) => s + b.monto, 0)
}
