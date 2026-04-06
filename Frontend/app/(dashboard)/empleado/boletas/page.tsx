"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Search, FileText, CalendarDays } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import StatusBadge from "@/components/status-badge"
import { formatMonto, formatFecha, type Boleta } from "@/lib/mock-data"
import { boletasApi, normalizeBoleta } from "@/lib/api"
import { useBoletasSync } from "@/hooks/useBoletasSync"
import Pagination from "@/components/pagination"

const PAGE_SIZE = 20

export default function EmpleadoBoletasPage() {
  const [boletas, setBoletas] = useState<Boleta[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Debounce search 400ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  // Reset page when search changes
  useEffect(() => { setPage(1) }, [debouncedSearch])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(PAGE_SIZE),
      }
      if (debouncedSearch) params.buscar = debouncedSearch

      const result = await boletasApi.list(params)

      if (result && Array.isArray(result.items)) {
        setBoletas(result.items.map(normalizeBoleta))
        setTotalPages(result.totalPages || 1)
        setTotal(result.total || 0)
      }
    } catch (err) {
      console.error("Error cargando boletas:", err)
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch])

  useEffect(() => { loadData() }, [loadData])

  useBoletasSync(loadData)

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

      <div className="space-y-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por tipo, ID o descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        {total > 0 && !loading && (
          <p className="text-xs text-muted-foreground">{total} resultado(s)</p>
        )}
      </div>

      <div className="space-y-3">
        {loading && boletas.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Cargando tus boletas...
          </div>
        ) : boletas.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No se encontraron boletas.
          </div>
        ) : (
          boletas.map((boleta) => (
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

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
