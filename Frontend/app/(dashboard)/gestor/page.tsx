"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  CheckCircle, Clock, DollarSign, AlertTriangle,
  TrendingUp, CalendarDays, ChevronRight, Wallet,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import PageHeader from "@/components/page-header"
import KpiCard from "@/components/kpi-card"
import { formatMonto, formatFecha, type Boleta } from "@/lib/mock-data"
import { UserAvatar } from "@/components/user-avatar"
import { boletasApi, normalizeBoleta } from "@/lib/api"
import type { ApiStats } from "@/lib/types"
import { useBoletasSync } from "@/hooks/useBoletasSync"
import { useUser } from "@/contexts/user-context"
import GestorStatsPanel from "@/components/gestor-stats-panel"
import PayModal from "@/components/pay-modal"

const GESTOR_COLOR = "oklch(0.36 0.08 252)"

export default function GestorHomePage() {
  const { user } = useUser()
  const [boletas, setBoletas] = useState<Boleta[]>([])
  const [stats, setStats] = useState<ApiStats | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [payTarget, setPayTarget] = useState<Boleta | null>(null)

  const loadData = useCallback(async () => {
    setLoadingData(true)
    try {
      const [boletasResult, statsResult] = await Promise.allSettled([
        boletasApi.list({ limit: "200" }),
        boletasApi.stats(),
      ])
      if (boletasResult.status === "fulfilled")
        setBoletas(boletasResult.value.items.map(normalizeBoleta))
      if (statsResult.status === "fulfilled")
        setStats(statsResult.value)
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])
  useBoletasSync(loadData)

  const handleConfirmPago = async (
    comprobante: { url: string; nombre: string; tipo: string; tamano: number }
  ) => {
    if (!payTarget?._id && !payTarget?.id) return
    const id = payTarget._id ?? payTarget.id
    try {
      await boletasApi.pagar(id, comprobante)
      await loadData()
    } catch (err) {
      console.error("Error al registrar pago:", err)
    } finally {
      setPayTarget(null)
    }
  }

  const porPagar       = boletas.filter((b) => b.estado === "aprobada")
  const montoPorPagar  = porPagar.reduce((s, b) => s + b.monto, 0)
  const montoPagado    = stats?.montoPagado ?? 0
  const pagadasMes     = stats?.pagadasMes ?? 0
  const montoPagadoMes = stats?.montoPagadoMes ?? 0
  const tiempoEndToEnd = stats?.tiempoEndToEnd ?? null

  const oldestUnpaid = porPagar.length > 0
    ? porPagar.reduce((o, b) => new Date(b.fecha) < new Date(o.fecha) ? b : o)
    : null
  const oldestUnpaidDays = oldestUnpaid
    ? Math.floor((Date.now() - new Date(oldestUnpaid.fecha).getTime()) / 86400000)
    : null

  const dpoTone: "default" | "success" | "warn" | "danger" =
    oldestUnpaidDays == null ? "default"
    : oldestUnpaidDays > 5 ? "danger"
    : oldestUnpaidDays >= 3 ? "warn"
    : "success"

  const cycleTone: "default" | "success" | "warn" | "danger" =
    tiempoEndToEnd == null ? "default"
    : tiempoEndToEnd < 7 ? "success"
    : tiempoEndToEnd <= 14 ? "warn"
    : "danger"

  return (
    <>
      <div className="flex min-h-full">
        <div className="flex-1 min-w-0 p-4 sm:p-6 space-y-5 sm:space-y-6">
          <BreadcrumbNav items={[{ label: "Resumen" }]} />

          <PageHeader
            title={`Hola, ${user.name.split(" ")[0]}`}
            description="Panel de control de pagos y reembolsos."
            action={
              <Link
                href="/gestor/por-pagar"
                className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Por pagar <ChevronRight className="w-4 h-4" />
              </Link>
            }
          />

          {/* Hero Cash Exposure */}
          <KpiCard
            tone="primary"
            size="lg"
            label="Cash Exposure"
            icon={DollarSign}
            value={loadingData ? "—" : formatMonto(montoPorPagar)}
            sub={loadingData ? "" : `${porPagar.length} boleta${porPagar.length !== 1 ? "s" : ""} aprobada${porPagar.length !== 1 ? "s" : ""} sin pagar`}
          />

          {/* KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <KpiCard
              tone={dpoTone} size="md" label="DPO" icon={AlertTriangle}
              value={loadingData ? "—" : oldestUnpaidDays != null ? `${oldestUnpaidDays}d` : "—"}
              sub={
                loadingData ? ""
                : oldestUnpaidDays == null ? "Sin deuda pendiente"
                : oldestUnpaidDays > 5 ? "Pago urgente"
                : oldestUnpaidDays >= 3 ? "Atención requerida"
                : "Al día"
              }
            />
            <KpiCard
              tone="muted" size="md" label="Por pagar" icon={Clock}
              value={loadingData ? "—" : porPagar.length}
              sub="solicitudes pendientes"
            />
            <KpiCard
              tone="success" size="md" label="Pagadas / mes" icon={CalendarDays}
              value={loadingData ? "—" : pagadasMes}
              sub={loadingData ? "" : formatMonto(montoPagadoMes)}
            />
            <KpiCard
              tone={cycleTone} size="md" label="Ciclo de pago" icon={TrendingUp}
              value={loadingData ? "—" : tiempoEndToEnd != null ? `${tiempoEndToEnd.toFixed(1)}d` : "—"}
              sub={
                loadingData ? ""
                : tiempoEndToEnd == null ? "Sin datos"
                : tiempoEndToEnd < 7 ? "Ciclo eficiente"
                : tiempoEndToEnd <= 14 ? "Ciclo moderado"
                : "Ciclo lento"
              }
            />
          </div>

          {/* Cola de pago */}
          {!loadingData && porPagar.length > 0 && (
            <Card className="border border-border shadow-none py-0">
              <CardHeader className="px-4 sm:px-5 py-3 flex flex-row items-center justify-between border-b border-border">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: GESTOR_COLOR }} />
                  Boletas pendientes de pago
                </CardTitle>
                <Link
                  href="/gestor/por-pagar"
                  className="text-[11px] font-semibold uppercase tracking-[0.12em] flex items-center gap-1 text-accent hover:text-accent/80 transition-colors"
                >
                  Ver todas <ChevronRight className="w-3 h-3" />
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {porPagar.slice(0, 5).map((boleta) => {
                    const dias = Math.floor((Date.now() - new Date(boleta.fecha).getTime()) / 86400000)
                    const urgente = dias > 5
                    return (
                      <button
                        key={boleta.id}
                        className="w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-muted/40 transition-colors text-left"
                        onClick={() => setPayTarget(boleta)}
                      >
                        <UserAvatar
                          avatar={boleta.empleadoNombre.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          avatarUrl={boleta.empleadoAvatarUrl}
                          name={boleta.empleadoNombre}
                          size={36}
                          roleColor={urgente ? "var(--destructive)" : GESTOR_COLOR}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{boleta.empleadoNombre}</p>
                          <p className="text-xs text-muted-foreground">{boleta.tipo} · {formatFecha(boleta.fecha)}</p>
                        </div>
                        <div className="text-right shrink-0 space-y-1">
                          <p className="text-sm font-semibold text-foreground tabular-nums">{formatMonto(boleta.monto)}</p>
                          <div className="flex items-center gap-1.5 justify-end">
                            {urgente && (
                              <span
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded tabular-nums"
                                style={{ background: "var(--danger-bg)", color: "var(--danger-fg)" }}
                              >
                                {dias}d
                              </span>
                            )}
                            <Wallet className="w-3.5 h-3.5" style={{ color: GESTOR_COLOR }} />
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {!loadingData && porPagar.length === 0 && (
            <div
              className="rounded-xl p-6 text-center border"
              style={{ background: "var(--success-bg)", borderColor: "var(--success-border)" }}
            >
              <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--success-fg)" }} />
              <p className="text-sm font-semibold text-foreground">Sin pagos pendientes</p>
              <p className="text-xs text-muted-foreground mt-1">Todas las boletas aprobadas han sido pagadas.</p>
            </div>
          )}

          {!loadingData && (
            <KpiCard
              tone="success"
              size="md"
              label="Total reembolsado (histórico)"
              icon={CheckCircle}
              value={formatMonto(montoPagado)}
            />
          )}

          {loadingData && (
            <div className="text-center py-8 text-sm text-muted-foreground">Cargando...</div>
          )}
        </div>
        <GestorStatsPanel stats={stats} loading={loadingData} oldestUnpaidDays={oldestUnpaidDays} />
      </div>

      {payTarget && (
        <PayModal
          boleta={payTarget}
          onConfirm={handleConfirmPago}
          onClose={() => setPayTarget(null)}
        />
      )}
    </>
  )
}
