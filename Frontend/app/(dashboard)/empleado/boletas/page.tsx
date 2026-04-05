"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import Link from "next/link"
import { Search, FileText, CalendarDays } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import StatusBadge from "@/components/status-badge"
import { formatMonto, formatFecha, type Boleta } from "@/lib/mock-data"
import { boletasApi, normalizeBoleta } from "@/lib/api"
import { useBoletasSync } from "@/hooks/useBoletasSync"

export default function EmpleadoBoletasPage() {
  const [boletas, setBoletas] = useState<Boleta[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [search, setSearch] = useState("")
  const [totalPages, setTotalPages] = useState(1)
  const mountedRef = useRef(true)

  // 1. Control del ciclo de vida para evitar fugas de memoria
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // 2. Función de carga estabilizada con useCallback
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

  // 3. Solo una carga inicial controlada
  useEffect(() => {
    loadData()
  }, [loadData])

  // 4. Sincronización (el hook interno debe manejar la estabilidad de loadData)
  useBoletasSync(loadData)

  // 5. Filtrado seguro y optimizado
  const filtered = useMemo(() => {
    const searchTerm = search.toLowerCase().trim()
    
    if (!searchTerm) return boletas

    return boletas.filter((b) => {
      const tipo = b.tipo?.toLowerCase() || ""
      const id = b.id?.toLowerCase() || ""
      const descripcion = b.descripcion?.toLowerCase() || ""
      
      return (
        tipo.includes(searchTerm) ||
        id.includes(searchTerm) ||
        descripcion.includes(searchTerm)
      )
    })
  }, [boletas, search])

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-w-5xl">
      <BreadcrumbNav
        items={[
          { label: "Inicio", href: "/empleado" },
          { label: "Mis boletas" },
        ]}
      />
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Mis boletas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Historial completo de tus gastos enviados.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por tipo, ID o descripción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      <div className="space-y-3">
        {loadingData && boletas.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Cargando tus boletas...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No se encontraron boletas.
          </div>
        ) : (
          filtered.map((boleta) => (
            <Link
              key={boleta.id}
              href={`/empleado/boletas/${boleta._id ?? boleta.id}`}
              className="block"
            >
              <Card className="border shadow-none cursor-pointer hover:shadow-sm transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "var(--secondary)" }}
                    >
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {boleta.tipo}
                        </span>
                        <p className="text-base font-bold text-foreground shrink-0">
                          {formatMonto(boleta.monto)}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {boleta.descripcion}
                      </p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarDays className="w-3 h-3" />
                          {formatFecha(boleta.fecha)}
                        </span>
                        <StatusBadge status={boleta.estado} size="sm" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          Mostrando los primeros 100 registros de {totalPages} páginas.
        </p>
      )}
    </div>
  )
}