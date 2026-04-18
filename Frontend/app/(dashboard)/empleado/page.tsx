"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  FileText, PlusCircle, CheckCircle, XCircle,
  Clock, TrendingUp, Wallet, ChevronRight, Timer,
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
  const [boletas, setBoletas]     = useState<Boleta[]>([])
  const [stats, setStats]         = useState<ApiStats | null>(null)
  const [loadingData, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [boletasResult, statsResult] = await Promise.allSettled([
        boletasApi.list({ limit: "100" }),
        boletasApi.stats(),
      ])
      if (boletasResult.status === "fulfilled")
        setBoletas(boletasResult.value.items.map(normalizeBoleta))
      if (statsResult.status === "fulfilled")
        setStats(statsResult.value)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])
  useBoletasSync(loadData)

  const total      = stats?.total ?? boletas.length
  const pendientes = stats?.pendiente ?? 0
  const aprobadas  = stats?.aprobada ?? 0
  const rechazadas = stats?.rechazada ?? 0
  const pagadas    = stats?.pagada ?? 0
  const montoPagado    = stats?.montoPagado ?? 0
  const montoAprobado  = stats?.montoAprobado ?? 0
  const tiempoAvg      = stats?.tiempoPromedioResolucion ?? null
  const boletasMes     = stats?.boletasMes ?? 0
  const montoMes       = stats?.montoMes ?? 0

  // Pipeline: aprobado pero no cobrado aún
  const pipeline = Math.max(0, montoAprobado - montoPagado)

  // Tasa aprobación global personal
  const resueltas = aprobadas + pagadas + rechazadas
  const tasaAprobacion = resueltas > 0 ? Math.round(((aprobadas + pagadas) / resueltas) * 100) : null

  // SLA recepción: <3d bueno, 3-5d alerta, >5d lento
  const slaColor =
    tiempoAvg == null   ? "var(--muted-foreground)"
    : tiempoAvg < 3    ? "oklch(0.58 0.14 162)"
    : tiempoAvg <= 5   ? "oklch(0.55 0.14 72)"
                        : "oklch(0.55 0.22 27)"
  const slaLabel =
    tiempoAvg == null  ? "Sin datos"
    : tiempoAvg < 3   ? "Respuesta rápida"
    : tiempoAvg <= 5  ? "Respuesta normal"
                      : "Respuesta lenta"

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
              Resumen de tus gastos y reembolsos.
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

        {/* ── HERO: TOTAL RECIBIDO ──────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Total recibido */}
          <div
            className="rounded-2xl p-5 flex items-center justify-between"
            style={{ background: "var(--primary)" }}
          >
            <div>
              <p className="text-sm font-semibold text-white/70">Total recibido</p>
              <p className="text-4xl font-black text-white mt-1 tracking-tight">
                {loadingData ? "—" : formatMonto(montoPagado)}
              </p>
              <p className="text-xs text-white/50 mt-2">
                {loadingData ? "" : `${pagadas} boleta${pagadas !== 1 ? "s" : ""} reembolsada${pagadas !== 1 ? "s" : ""}`}
              </p>
            </div>
            <CheckCircle className="w-12 h-12 text-white/15 shrink-0" />
          </div>

          {/* Pipeline / Por cobrar */}
          <div
            className="rounded-2xl p-5 flex items-center justify-between"
            style={{
              background: pipeline > 0 ? "oklch(0.97 0.03 72)" : "var(--secondary)",
              border: `1px solid ${pipeline > 0 ? "oklch(0.88 0.07 72)" : "var(--border)"}`,
            }}
          >
            <div>
              <p className="text-sm font-semibold" style={{ color: pipeline > 0 ? "oklch(0.45 0.1 72)" : "var(--muted-foreground)" }}>
                Por cobrar
              </p>
              <p className="text-4xl font-black tracking-tight mt-1" style={{ color: pipeline > 0 ? "oklch(0.32 0.12 72)" : "var(--foreground)" }}>
                {loadingData ? "—" : formatMonto(pipeline)}
              </p>
              <p className="text-xs mt-2" style={{ color: pipeline > 0 ? "oklch(0.52 0.1 72)" : "var(--muted-foreground)" }}>
                {loadingData ? "" : pipeline === 0 ? "Sin pendientes de pago" : `${aprobadas} aprobada${aprobadas !== 1 ? "s" : ""} sin pagar`}
              </p>
            </div>
            <Wallet className="w-12 h-12 shrink-0" style={{ color: pipeline > 0 ? "oklch(0.62 0.14 72 / 0.3)" : "var(--border)" }} />
          </div>
        </div>

        {/* ── KPI GRID ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            {
              label: "Total enviadas",
              value: loadingData ? "—" : total,
              sub: `${boletasMes} este mes`,
              icon: FileText,
              color: "var(--primary)",
              bg: "oklch(0.94 0.02 252)",
            },
            {
              label: "Pendientes",
              value: loadingData ? "—" : pendientes,
              sub: "en revisión",
              icon: Clock,
              color: "oklch(0.55 0.14 72)",
              bg: "oklch(0.97 0.03 72)",
            },
            {
              label: "Aprobadas",
              value: loadingData ? "—" : aprobadas + pagadas,
              sub: tasaAprobacion != null ? `${tasaAprobacion}% tasa` : "—",
              icon: CheckCircle,
              color: "oklch(0.58 0.14 162)",
              bg: "oklch(0.95 0.04 162)",
            },
            {
              label: "Rechazadas",
              value: loadingData ? "—" : rechazadas,
              sub: resueltas > 0 ? `${Math.round((rechazadas / resueltas) * 100)}% del total` : "—",
              icon: XCircle,
              color: "oklch(0.55 0.22 27)",
              bg: "oklch(0.97 0.02 27)",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl p-4 sm:p-5"
              style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}
            >
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

        {/* ── TASA + TIEMPO ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Tasa de aprobación */}
          <div className="rounded-2xl p-4 sm:p-5" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-muted-foreground">Tasa de aprobación</p>
              <TrendingUp className="w-4 h-4" style={{ color: "oklch(0.58 0.14 162)" }} />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-foreground tracking-tight mb-2">
              {loadingData ? "—" : tasaAprobacion != null ? `${tasaAprobacion}%` : "—"}
            </p>
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: tasaAprobacion != null ? `${tasaAprobacion}%` : "0%", background: "oklch(0.58 0.14 162)" }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              {loadingData ? "" : resueltas === 0 ? "Sin boletas resueltas aún" : `${aprobadas + pagadas} de ${resueltas} resueltas`}
            </p>
          </div>

          {/* Tiempo promedio de respuesta */}
          <div className="rounded-2xl p-4 sm:p-5" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-muted-foreground">Tiempo de respuesta</p>
              <Timer className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {loadingData ? "—" : tiempoAvg != null ? `${tiempoAvg.toFixed(1)} días` : "—"}
            </p>
            <p className="text-xs mt-1.5 font-medium" style={{ color: slaColor }}>
              {loadingData ? "" : slaLabel}
            </p>
          </div>
        </div>

        {/* ── ÚLTIMAS BOLETAS ───────────────────────────────────── */}
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
                    className="w-full flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-muted/50 transition-colors"
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
      <EmpleadoStatsPanel stats={stats} loading={loadingData} montoPendienteCobro={pipeline} />
    </div>
  )
}
