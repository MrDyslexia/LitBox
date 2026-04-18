"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  CheckCircle, Clock, DollarSign, AlertTriangle,
  TrendingUp, CalendarDays, ChevronRight, Wallet,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import BreadcrumbNav from "@/components/breadcrumb-nav"
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

  // DPO semáforo: <3d ok, 3-5d alerta, >5d crítico
  const dpoOk   = oldestUnpaidDays != null && oldestUnpaidDays < 3
  const dpoWarn = oldestUnpaidDays != null && oldestUnpaidDays >= 3 && oldestUnpaidDays <= 5
  const dpoBad  = oldestUnpaidDays != null && oldestUnpaidDays > 5
  const dpoColor  = dpoOk ? "oklch(0.58 0.14 162)" : dpoWarn ? "oklch(0.55 0.14 72)" : dpoBad ? "oklch(0.55 0.22 27)" : "var(--muted-foreground)"
  const dpoBg     = dpoOk ? "var(--secondary)" : dpoWarn ? "oklch(0.97 0.03 72)" : dpoBad ? "oklch(0.97 0.02 27)" : "var(--secondary)"
  const dpoBorder = dpoOk ? "var(--border)" : dpoWarn ? "oklch(0.88 0.07 72)" : dpoBad ? "oklch(0.88 0.06 27)" : "var(--border)"
  const dpoLabel  = oldestUnpaidDays == null ? "Sin deuda pendiente"
    : dpoOk ? "Al día" : dpoWarn ? "Atención requerida" : "Pago urgente"

  // Payment cycle semáforo: <7d ok, 7-14d alerta, >14d crítico
  const cycleColor =
    tiempoEndToEnd == null   ? "var(--muted-foreground)"
    : tiempoEndToEnd < 7    ? "oklch(0.58 0.14 162)"
    : tiempoEndToEnd <= 14  ? "oklch(0.55 0.14 72)"
                             : "oklch(0.55 0.22 27)"
  const cycleLabel =
    tiempoEndToEnd == null  ? "Sin datos"
    : tiempoEndToEnd < 7   ? "Ciclo eficiente"
    : tiempoEndToEnd <= 14 ? "Ciclo moderado"
                            : "Ciclo lento"

  return (
    <>
    <div className="flex min-h-full">
      <div className="flex-1 min-w-0 p-4 sm:p-6 space-y-4 sm:space-y-6">
        <BreadcrumbNav items={[{ label: "Resumen" }]} />

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Hola, {user.name.split(" ")[0]}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Panel de control de pagos y reembolsos.
            </p>
          </div>
          <Link
            href="/gestor/por-pagar"
            className="shrink-0 flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-semibold text-white"
            style={{ background: "var(--primary)" }}
          >
            Por pagar
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* ── HERO: CASH EXPOSURE ───────────────────────────────── */}
        <div
          className="rounded-2xl p-5 sm:p-6 flex items-center justify-between"
          style={{ background: GESTOR_COLOR }}
        >
          <div>
            <p className="text-sm font-semibold text-white/70">Cash Exposure</p>
            <p className="text-4xl sm:text-5xl font-black text-white mt-1 tracking-tight">
              {loadingData ? "—" : formatMonto(montoPorPagar)}
            </p>
            <p className="text-xs text-white/50 mt-2">
              {loadingData ? "" : `${porPagar.length} boleta${porPagar.length !== 1 ? "s" : ""} aprobada${porPagar.length !== 1 ? "s" : ""} sin pagar`}
            </p>
          </div>
          <DollarSign className="w-14 h-14 text-white/15 shrink-0" />
        </div>

        {/* ── KPI ROW ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">

          {/* DPO */}
          <div className="rounded-2xl p-4 sm:p-5" style={{ background: dpoBg, border: `1px solid ${dpoBorder}` }}>
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="text-xs font-semibold text-muted-foreground">DPO</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: dpoBad ? "oklch(0.55 0.22 27 / 0.12)" : dpoWarn ? "oklch(0.55 0.14 72 / 0.15)" : "var(--muted)" }}>
                <AlertTriangle className="w-4 h-4" style={{ color: dpoColor }} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {loadingData ? "—" : oldestUnpaidDays != null ? `${oldestUnpaidDays}d` : "—"}
            </p>
            <p className="text-xs mt-1.5 font-medium" style={{ color: dpoColor }}>
              {loadingData ? "" : dpoLabel}
            </p>
          </div>

          {/* Boletas por pagar */}
          <div className="rounded-2xl p-4 sm:p-5" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="text-xs font-semibold text-muted-foreground">Por pagar</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "oklch(0.94 0.02 252)" }}>
                <Clock className="w-4 h-4" style={{ color: GESTOR_COLOR }} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {loadingData ? "—" : porPagar.length}
            </p>
            <p className="text-xs text-muted-foreground mt-1.5">solicitudes pendientes</p>
          </div>

          {/* Pagadas este mes */}
          <div className="rounded-2xl p-4 sm:p-5" style={{ background: "oklch(0.97 0.01 162 / 0.6)", border: "1px solid oklch(0.92 0.02 162)" }}>
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="text-xs font-semibold text-muted-foreground">Pagadas / mes</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "oklch(0.58 0.14 162 / 0.15)" }}>
                <CalendarDays className="w-4 h-4" style={{ color: "oklch(0.58 0.14 162)" }} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {loadingData ? "—" : pagadasMes}
            </p>
            <p className="text-xs text-muted-foreground mt-1.5">
              {loadingData ? "" : formatMonto(montoPagadoMes)}
            </p>
          </div>

          {/* Payment cycle time */}
          <div className="rounded-2xl p-4 sm:p-5" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="text-xs font-semibold text-muted-foreground">Ciclo de pago</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--muted)" }}>
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {loadingData ? "—" : tiempoEndToEnd != null ? `${tiempoEndToEnd.toFixed(1)}d` : "—"}
            </p>
            <p className="text-xs mt-1.5 font-medium" style={{ color: cycleColor }}>
              {loadingData ? "" : cycleLabel}
            </p>
          </div>
        </div>

        {/* ── COLA DE PAGO ──────────────────────────────────────── */}
        {!loadingData && porPagar.length > 0 && (
          <Card className="border shadow-none">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: GESTOR_COLOR }} />
                Boletas pendientes de pago
              </CardTitle>
              <Link href="/gestor/por-pagar" className="text-xs font-medium flex items-center gap-1" style={{ color: "var(--accent)" }}>
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
                      className="w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-muted/50 transition-colors text-left"
                      onClick={() => setPayTarget(boleta)}
                    >
                      <UserAvatar
                        avatar={boleta.empleadoNombre.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        avatarUrl={boleta.empleadoAvatarUrl}
                        name={boleta.empleadoNombre}
                        size={36}
                        roleColor={urgente ? "oklch(0.55 0.22 27)" : GESTOR_COLOR}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{boleta.empleadoNombre}</p>
                        <p className="text-xs text-muted-foreground">{boleta.tipo} · {formatFecha(boleta.fecha)}</p>
                      </div>
                      <div className="text-right shrink-0 space-y-1">
                        <p className="text-sm font-semibold text-foreground">{formatMonto(boleta.monto)}</p>
                        <div className="flex items-center gap-1.5 justify-end">
                          {urgente && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "oklch(0.97 0.02 27)", color: "oklch(0.45 0.22 27)" }}>
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
            className="rounded-2xl p-6 text-center"
            style={{ background: "oklch(0.97 0.01 162 / 0.4)", border: "1px solid oklch(0.92 0.02 162)" }}
          >
            <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: "oklch(0.58 0.14 162)" }} />
            <p className="text-sm font-semibold text-foreground">Sin pagos pendientes</p>
            <p className="text-xs text-muted-foreground mt-1">Todas las boletas aprobadas han sido pagadas.</p>
          </div>
        )}

        {/* Resumen histórico */}
        {!loadingData && (
          <div
            className="rounded-2xl p-4 sm:p-5 flex items-center justify-between"
            style={{ background: "oklch(0.97 0.01 162 / 0.5)", border: "1px solid oklch(0.92 0.02 162)" }}
          >
            <div>
              <p className="text-sm font-medium" style={{ color: "oklch(0.45 0.1 162)" }}>Total reembolsado (histórico)</p>
              <p className="text-3xl font-black tracking-tight mt-1" style={{ color: "oklch(0.32 0.12 162)" }}>
                {formatMonto(montoPagado)}
              </p>
            </div>
            <CheckCircle className="w-12 h-12 shrink-0" style={{ color: "oklch(0.58 0.14 162 / 0.3)" }} />
          </div>
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
