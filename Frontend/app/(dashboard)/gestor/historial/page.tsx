"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { CheckCircle, ImageIcon, ExternalLink } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import StatusBadge from "@/components/status-badge"
import { formatMonto, formatFecha, type Boleta } from "@/lib/mock-data"
import { boletasApi, normalizeBoleta } from "@/lib/api"
import type { ApiStats } from "@/lib/types"
import { useBoletasSync } from "@/hooks/useBoletasSync"

export default function GestorHistorialPage() {
  const [boletas, setBoletas] = useState<Boleta[]>([])
  const [stats, setStats] = useState<ApiStats | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [search, setSearch] = useState("")
  const [totalPages, setTotalPages] = useState(1)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const loadData = useCallback(async () => {
    // Solo activamos loading si no hay datos previos para evitar parpadeos molestos
    if (boletas.length === 0) setLoadingData(true)
    
    try {
      const [boletasResult, statsResult] = await Promise.allSettled([
        boletasApi.list({ limit: "100" }),
        boletasApi.stats(),
      ])

      if (!mountedRef.current) return

      if (boletasResult.status === "fulfilled") {
        const items = boletasResult.value.items || []
        setBoletas(items.map(normalizeBoleta))
        setTotalPages(boletasResult.value.totalPages || 1)
      }

      if (statsResult.status === "fulfilled") {
        setStats(statsResult.value)
      }
    } catch (err) {
      console.error("Error crítico en carga de historial:", err)
    } finally {
      if (mountedRef.current) setLoadingData(false)
    }
  }, [boletas.length])

  // Carga inicial
  useEffect(() => {
    loadData()
  }, [loadData])

  // Sincronización en tiempo real
  useBoletasSync(loadData)

  // Filtrado optimizado y seguro
  const filteredPagadas = useMemo(() => {
    const searchTerm = search.toLowerCase().trim()
    
    return boletas.filter((b) => {
      // 1. Solo las pagadas
      if (b.estado !== "pagada") return false
      
      // 2. Filtro de búsqueda
      if (!searchTerm) return true
      
      const nombre = b.empleadoNombre?.toLowerCase() || ""
      const id = b.id?.toLowerCase() || ""
      const tipo = b.tipo?.toLowerCase() || ""
      
      return nombre.includes(searchTerm) || id.includes(searchTerm) || tipo.includes(searchTerm)
    })
  }, [boletas, search])

  const montoPagado = stats?.montoPagado ?? 0

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-w-5xl">
      <BreadcrumbNav
        items={[
          { label: "Resumen", href: "/gestor" },
          { label: "Historial de pagos" },
        ]}
      />
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Historial de pagos</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Registro de todas las boletas reembolsadas.
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

      {/* Card de Total Pagado con mejor contraste */}
      <div
        className="flex items-center justify-between px-4 py-4 rounded-xl border"
        style={{ 
          background: "oklch(0.97 0.01 195)",
          borderColor: "oklch(0.90 0.02 195)"
        }}
      >
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider font-semibold opacity-70" style={{ color: "oklch(0.35 0.1 195)" }}>
            Total reembolsado
          </span>
          <span className="text-2xl font-black" style={{ color: "oklch(0.35 0.1 195)" }}>
            {formatMonto(montoPagado)}
          </span>
        </div>
        <div className="p-2 rounded-full bg-white/50">
           <CheckCircle className="w-6 h-6" style={{ color: "oklch(0.50 0.15 195)" }} />
        </div>
      </div>

      <div className="space-y-3">
        {loadingData && boletas.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Cargando historial...</div>
        ) : filteredPagadas.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm border rounded-lg bg-muted/5">
            {search ? "No se encontraron coincidencias." : "Aún no hay pagos registrados en el sistema."}
          </div>
        ) : (
          filteredPagadas.map((boleta) => (
            <Card key={boleta.id} className="border shadow-none overflow-hidden hover:border-muted-foreground/20 transition-all">
              <CardContent className="p-0">
                <div className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5"
                      style={{ background: "oklch(0.52 0.14 195)" }}
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
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <StatusBadge status="pagada" size="sm" />
                        {boleta.fechaPago && (
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            Pagado el {formatFecha(boleta.fechaPago)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sección de Comprobante */}
                  {boleta.comprobanteUrl && (
                    <a
                      href={`${process.env.NEXT_PUBLIC_API_URL}${boleta.comprobanteUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg border text-[11px] font-bold transition-all hover:bg-white active:scale-[0.98]"
                      style={{
                        borderColor: "oklch(0.85 0.04 195)",
                        background: "oklch(0.96 0.02 195)",
                        color: "oklch(0.35 0.1 195)",
                      }}
                    >
                      <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate flex-1 uppercase tracking-tight">Ver comprobante de transferencia</span>
                      <ExternalLink className="w-3 h-3 shrink-0 opacity-50" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <p className="text-xs text-muted-foreground text-center py-4">
          Mostrando resultados de {totalPages} páginas.
        </p>
      )}
    </div>
  )
}