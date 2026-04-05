"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { CalendarDays, Wallet } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import StatusBadge from "@/components/status-badge"
import { formatMonto, formatFecha, type Boleta } from "@/lib/mock-data"
import { boletasApi, normalizeBoleta } from "@/lib/api"
import { useBoletasSync } from "@/hooks/useBoletasSync"
import PayModal from "@/components/pay-modal"

const GESTOR_COLOR = "oklch(0.52 0.18 290)"

export default function GestorPorPagarPage() {
  const [boletas, setBoletas] = useState<Boleta[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [search, setSearch] = useState("")
  const [payTarget, setPayTarget] = useState<Boleta | null>(null)
  const [totalPages, setTotalPages] = useState(1)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const loadData = useCallback(async () => {
    setLoadingData(true)
    try {
      const result = await boletasApi.list({ limit: "100" })
      if (!mountedRef.current) return
      
      if (result && Array.isArray(result.items)) {
        setBoletas(result.items.map(normalizeBoleta))
        setTotalPages(result.totalPages || 1)
      }
    } catch (err) {
      console.error("Error cargando boletas:", err)
    } finally {
      if (mountedRef.current) setLoadingData(false)
    }
  }, [])

  // Carga inicial estable
  useEffect(() => {
    loadData()
  }, [loadData])

  // Sincronización estable
  useBoletasSync(loadData)

  // Memorizamos el filtrado para evitar procesar la lista en cada pequeño cambio de UI
  const filteredPorPagar = useMemo(() => {
    const searchTerm = search.toLowerCase().trim()
    
    return boletas.filter((b) => {
      // Primero: Solo mostrar las aprobadas (por pagar)
      if (b.estado !== "aprobada") return false
      
      // Segundo: Aplicar búsqueda si existe
      if (!searchTerm) return true
      
      const matchName = (b.empleadoNombre?.toLowerCase() || "").includes(searchTerm)
      const matchId = (b.id?.toLowerCase() || "").includes(searchTerm)
      const matchTipo = (b.tipo?.toLowerCase() || "").includes(searchTerm)
      
      return matchName || matchId || matchTipo
    })
  }, [boletas, search])

  const handleConfirmPago = async (
    comprobante: { url: string; nombre: string; tipo: string; tamano: number }
  ) => {
    if (!payTarget?._id && !payTarget?.id) return
    const id = payTarget._id ?? payTarget.id
    
    try {
      await boletasApi.pagar(id, comprobante)
      // Recargar datos tras el pago
      await loadData()
    } catch (err) {
      console.error("Error al registrar pago:", err)
    } finally {
      setPayTarget(null)
    }
  }

  return (
    <>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-w-5xl">
        <BreadcrumbNav
          items={[
            { label: "Resumen", href: "/gestor" },
            { label: "Por pagar" },
          ]}
        />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Por pagar</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Boletas aprobadas pendientes de reembolso al empleado.
          </p>
        </div>

        <div className="relative">
          <Input
            placeholder="Buscar por empleado, tipo o ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10"
          />
        </div>

        <div className="space-y-3">
          {loadingData && boletas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">Cargando...</div>
          ) : filteredPorPagar.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm border rounded-lg bg-muted/10">
              {search ? "No se encontraron resultados para tu búsqueda." : "No hay boletas pendientes de pago."}
            </div>
          ) : (
            filteredPorPagar.map((boleta) => (
              <Card key={boleta.id} className="border shadow-none hover:border-muted-foreground/20 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5"
                      style={{ background: GESTOR_COLOR }}
                    >
                      {boleta.empleadoNombre?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "??"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{boleta.empleadoNombre}</p>
                          <p className="text-xs text-muted-foreground">
                            {boleta.tipo} — <span className="font-mono text-[10px]">{boleta.id}</span>
                          </p>
                        </div>
                        <p className="text-base font-bold text-foreground shrink-0">{formatMonto(boleta.monto)}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 italic">
                        {boleta.descripcion || "Sin descripción"}
                      </p>
                      <div className="flex items-center justify-between mt-3 gap-3 flex-wrap">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <CalendarDays className="w-3 h-3" />
                            {formatFecha(boleta.fecha)}
                          </span>
                          <StatusBadge status={boleta.estado} size="sm" />
                        </div>
                        <Button
                          className="h-8 text-xs font-semibold text-white shrink-0"
                          style={{ background: GESTOR_COLOR }}
                          onClick={() => setPayTarget(boleta)}
                        >
                          <Wallet className="w-3.5 h-3.5 mr-1.5" />
                          Registrar pago
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <p className="text-xs text-muted-foreground text-center py-2">
            Mostrando resultados de {totalPages} páginas disponibles.
          </p>
        )}
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