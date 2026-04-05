"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { CheckCircle, Clock, DollarSign, CalendarDays } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import { formatMonto, formatFecha, type Boleta } from "@/lib/mock-data"
import { boletasApi, normalizeBoleta } from "@/lib/api"
import type { ApiStats } from "@/lib/types"
import { useBoletasSync } from "@/hooks/useBoletasSync"
import { useUser } from "@/contexts/user-context"

const GESTOR_COLOR = "oklch(0.52 0.18 290)"

export default function GestorHomePage() {
  const { user } = useUser()
  const [boletas, setBoletas] = useState<Boleta[]>([])
  const [stats, setStats] = useState<ApiStats | null>(null)
  const [loadingData, setLoadingData] = useState(true)

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

  const porPagar = boletas.filter((b) => b.estado === "aprobada")
  const pagadas = boletas.filter((b) => b.estado === "pagada")

  const montoPorPagar = porPagar.reduce((s, b) => s + b.monto, 0)
  const montoPagado = stats?.montoPagado ?? 0

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-5xl">
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
        <Card className="border shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Por pagar</span>
              <Clock className="w-4 h-4" style={{ color: GESTOR_COLOR }} />
            </div>
            <p className="text-2xl font-bold text-foreground">{loadingData ? "—" : porPagar.length}</p>
            <p className="text-xs text-muted-foreground mt-1">{loadingData ? "—" : formatMonto(montoPorPagar)}</p>
          </CardContent>
        </Card>
        <Card className="border shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Pagadas</span>
              <CheckCircle className="w-4 h-4" style={{ color: "oklch(0.52 0.14 195)" }} />
            </div>
            <p className="text-2xl font-bold text-foreground">{loadingData ? "—" : pagadas.length}</p>
            <p className="text-xs text-muted-foreground mt-1">{loadingData ? "—" : formatMonto(montoPagado)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Monto total */}
      <Card className="border shadow-none" style={{ background: GESTOR_COLOR }}>
        <CardContent className="p-4 sm:p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white/70">Pendiente de pago</p>
            <p className="text-2xl sm:text-3xl font-bold text-white mt-1">
              {loadingData ? "—" : formatMonto(montoPorPagar)}
            </p>
            <p className="text-xs text-white/50 mt-1">{porPagar.length} boleta{porPagar.length !== 1 ? "s" : ""} aprobada{porPagar.length !== 1 ? "s" : ""}</p>
          </div>
          <DollarSign className="w-10 h-10 text-white/25" />
        </CardContent>
      </Card>

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
                <div key={boleta.id} className="flex items-center gap-3 px-4 sm:px-5 py-3">
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
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-foreground">{formatMonto(boleta.monto)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {loadingData && (
        <div className="text-center py-8 text-sm text-muted-foreground">Cargando datos...</div>
      )}
    </div>
  )
}
