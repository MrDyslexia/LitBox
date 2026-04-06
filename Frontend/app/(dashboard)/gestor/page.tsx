"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { CheckCircle, Clock, DollarSign, CalendarDays, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import { formatMonto, formatFecha, type Boleta } from "@/lib/mock-data"
import { boletasApi, normalizeBoleta } from "@/lib/api"
import type { ApiStats } from "@/lib/types"
import { useBoletasSync } from "@/hooks/useBoletasSync"
import { useUser } from "@/contexts/user-context"
import GestorStatsPanel from "@/components/gestor-stats-panel"
import PayModal from "@/components/pay-modal"

const GESTOR_COLOR = "oklch(0.52 0.18 290)"

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
      if (boletasResult.status === "fulfilled") {
        setBoletas(boletasResult.value.items.map(normalizeBoleta))
      } else {
        console.error("Error cargando boletas:", boletasResult.reason)
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

  const porPagar = boletas.filter((b) => b.estado === "aprobada")
  const pagadas = boletas.filter((b) => b.estado === "pagada")

  const oldestUnpaid = porPagar.length > 0
    ? porPagar.reduce((oldest, b) => new Date(b.fecha) < new Date(oldest.fecha) ? b : oldest)
    : null
  const oldestUnpaidDays = oldestUnpaid
    ? Math.floor((Date.now() - new Date(oldestUnpaid.fecha).getTime()) / 86400000)
    : null

  const montoPorPagar = porPagar.reduce((s, b) => s + b.monto, 0)
  const montoPagado = stats?.montoPagado ?? 0

  return (
    <>
    <div className="flex min-h-full">
      <div className="flex-1 min-w-0 p-4 sm:p-6 space-y-4 sm:space-y-6">
      <BreadcrumbNav items={[{ label: "Resumen" }]} />
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">
          Hola, {user.name.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gestiona los pagos de boletas aprobadas por los auditores.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div
          className="rounded-2xl p-4 sm:p-5"
          style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <p className="text-xs font-semibold text-muted-foreground">Por pagar</p>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "oklch(0.94 0.03 290)" }}
            >
              <Clock className="w-4 h-4" style={{ color: GESTOR_COLOR }} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            {loadingData ? "—" : porPagar.length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {loadingData ? "" : formatMonto(montoPorPagar)}
          </p>
        </div>
        <div
          className="rounded-2xl p-4 sm:p-5"
          style={{
            background: "oklch(0.97 0.01 162 / 0.5)",
            border: "1px solid oklch(0.92 0.02 162)",
          }}
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <p className="text-xs font-semibold" style={{ color: "oklch(0.45 0.1 162)" }}>Pagadas</p>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "oklch(0.58 0.14 162 / 0.15)" }}
            >
              <CheckCircle className="w-4 h-4" style={{ color: "oklch(0.58 0.14 162)" }} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            {loadingData ? "—" : pagadas.length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {loadingData ? "" : formatMonto(montoPagado)}
          </p>
        </div>
      </div>

      {/* Monto total */}
      <div
        className="rounded-2xl p-4 sm:p-5 flex items-center justify-between"
        style={{ background: GESTOR_COLOR }}
      >
        <div>
          <p className="text-sm font-medium text-white/70">Pendiente de pago</p>
          <p className="text-3xl sm:text-4xl font-black text-white mt-1 tracking-tight">
            {loadingData ? "—" : formatMonto(montoPorPagar)}
          </p>
          <p className="text-xs text-white/50 mt-1">
            {porPagar.length} boleta{porPagar.length !== 1 ? "s" : ""} aprobada{porPagar.length !== 1 ? "s" : ""}
          </p>
        </div>
        <DollarSign className="w-12 h-12 text-white/20 shrink-0" />
      </div>

      {/* Boletas recientes por pagar */}
      {!loadingData && porPagar.length > 0 && (
        <Card className="border shadow-none">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: GESTOR_COLOR }} />
              Boletas pendientes de pago
            </CardTitle>
            <Link
              href="/gestor/por-pagar"
              className="text-xs font-medium"
              style={{ color: "var(--accent)" }}
            >
              Ver todas
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {porPagar.slice(0, 5).map((boleta) => (
                <button
                  key={boleta.id}
                  className="w-full flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-muted/50 transition-colors text-left"
                  onClick={() => setPayTarget(boleta)}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: GESTOR_COLOR }}
                  >
                    {boleta.empleadoNombre.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{boleta.empleadoNombre}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      {formatFecha(boleta.fecha)} — {boleta.tipo}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-sm font-bold text-foreground">{formatMonto(boleta.monto)}</p>
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: "oklch(0.94 0.03 290)" }}
                    >
                      <Wallet className="w-3.5 h-3.5" style={{ color: GESTOR_COLOR }} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {loadingData && (
        <div className="text-center py-8 text-sm text-muted-foreground">Cargando datos...</div>
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
