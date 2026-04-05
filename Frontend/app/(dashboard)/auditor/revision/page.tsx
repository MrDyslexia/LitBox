"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import Link from "next/link"
import { Search, Filter, CalendarDays } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import StatusBadge from "@/components/status-badge"
import { formatMonto, formatFecha, type Boleta, type BoletaStatus } from "@/lib/mock-data"
import { boletasApi, normalizeBoleta } from "@/lib/api"
import { useBoletasSync } from "@/hooks/useBoletasSync"

const statusFilters: { value: BoletaStatus | "todas"; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "pendiente", label: "Pendiente" },
  { value: "en_revision", label: "En revisión" },
  { value: "aprobada", label: "Aprobada" },
  { value: "rechazada", label: "Rechazada" },
]

export default function AuditorRevisionPage() {
  const [boletas, setBoletas] = useState<Boleta[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<BoletaStatus | "todas">("todas")
  const [totalPages, setTotalPages] = useState(1)
  const mountedRef = useRef(true)

  // 1. Control de montaje para evitar actualizaciones en componentes desmontados
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // 2. Función de carga estabilizada
  const loadData = useCallback(async () => {
    // Si ya tenemos datos, no mostramos el loader de pantalla completa para evitar parpadeos
    if (boletas.length === 0) setLoadingData(true)
    
    try {
      const result = await boletasApi.list({ limit: "100" })
      
      if (!mountedRef.current) return

      if (result && Array.isArray(result.items)) {
        setBoletas(result.items.map(normalizeBoleta))
        setTotalPages(result.totalPages || 1)
      }
    } catch (err) {
      console.error("Error cargando boletas para auditoría:", err)
    } finally {
      if (mountedRef.current) setLoadingData(false)
    }
  }, [boletas.length])

  // 3. Efecto de carga inicial
  useEffect(() => {
    loadData()
  }, [loadData])

  // 4. Sincronización en tiempo real
  useBoletasSync(loadData)

  // 5. Filtrado memorizado (Búsqueda + Estado)
  const filtered = useMemo(() => {
    const searchTerm = search.toLowerCase().trim()

    return boletas.filter((b) => {
      // Filtro de Estado
      const matchStatus = filterStatus === "todas" || b.estado === filterStatus
      if (!matchStatus) return false

      // Filtro de Búsqueda (si existe texto)
      if (!searchTerm) return true

      const tipo = b.tipo?.toLowerCase() || ""
      const id = b.id?.toLowerCase() || ""
      const nombre = b.empleadoNombre?.toLowerCase() || ""

      return (
        tipo.includes(searchTerm) ||
        id.includes(searchTerm) ||
        nombre.includes(searchTerm)
      )
    })
  }, [boletas, search, filterStatus])

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-w-5xl">
      <BreadcrumbNav
        items={[
          { label: "Resumen", href: "/auditor" },
          { label: "Revisar boletas" },
        ]}
      />
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Revisar boletas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Selecciona una solicitud para revisar y actualizar su estado.
        </p>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por empleado, tipo o ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <div className="overflow-x-auto pb-1">
          <div className="flex items-center gap-1 p-1 rounded-lg border w-max" style={{ borderColor: "var(--border)" }}>
            <Filter className="w-4 h-4 text-muted-foreground ml-2 mr-1 shrink-0" />
            {statusFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilterStatus(f.value)}
                className="text-xs px-3 py-2 rounded-md font-medium transition-all whitespace-nowrap"
                style={
                  filterStatus === f.value
                    ? { background: "var(--primary)", color: "white" }
                    : { color: "var(--muted-foreground)" }
                }
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {loadingData && boletas.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Cargando solicitudes...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm border rounded-xl bg-muted/5">
            No se encontraron boletas con los filtros aplicados.
          </div>
        ) : (
          filtered.map((boleta) => (
            <Link
              key={boleta.id}
              href={`/auditor/revision/${boleta._id ?? boleta.id}`}
              className="block"
            >
              <Card className="border shadow-none cursor-pointer hover:shadow-md hover:border-primary/20 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5"
                      style={{ background: "var(--primary)" }}
                    >
                      {boleta.empleadoNombre?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "??"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {boleta.empleadoNombre}
                        </span>
                        <p className="text-base font-bold text-foreground shrink-0">
                          {formatMonto(boleta.monto)}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">{boleta.tipo}</p>
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
        <p className="text-xs text-muted-foreground text-center py-4">
          Mostrando los registros de la página actual ({totalPages} disponibles).
        </p>
      )}
    </div>
  )
}