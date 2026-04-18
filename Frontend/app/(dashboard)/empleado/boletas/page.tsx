"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Search, CalendarDays, ChevronRight } from "lucide-react"
import { TipoGastoIcon } from "@/components/tipo-gasto-icon"
import { useTiposGasto } from "@/hooks/useTiposGasto"
import { Input } from "@/components/ui/input"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import StatusBadge from "@/components/status-badge"
import PageHeader from "@/components/page-header"
import Pagination from "@/components/pagination"
import { formatMonto, formatFecha, type Boleta } from "@/lib/mock-data"
import { boletasApi, normalizeBoleta } from "@/lib/api"
import { useBoletasSync } from "@/hooks/useBoletasSync"

const PAGE_SIZE = 20

export default function EmpleadoBoletasPage() {
  const { getIcono } = useTiposGasto()
  const [boletas, setBoletas] = useState<Boleta[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

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
    <div className="p-4 sm:p-6 space-y-5 max-w-4xl">
      <BreadcrumbNav
        items={[
          { label: "Inicio", href: "/empleado" },
          { label: "Mis boletas" },
        ]}
      />
      <PageHeader
        title="Mis boletas"
        description="Historial completo de los gastos que has enviado."
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
        <Input
          placeholder="Buscar por tipo, ID o descripción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      {total > 0 && !loading && (
        <p className="text-xs text-muted-foreground -mt-1">
          <span className="tabular-nums font-semibold text-foreground">{total}</span> resultado{total === 1 ? "" : "s"}
        </p>
      )}

      <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
        {loading && boletas.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Cargando tus boletas...</div>
        ) : boletas.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No se encontraron boletas.</div>
        ) : (
          boletas.map((boleta) => (
            <Link
              key={boleta.id}
              href={`/empleado/boletas/${boleta._id ?? boleta.id}`}
              className="group flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-secondary border border-border flex items-center justify-center shrink-0 text-foreground">
                <TipoGastoIcon icono={getIcono(boleta.tipo)} className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground truncate">{boleta.tipo}</p>
                  <p className="text-base font-bold text-foreground shrink-0 tabular-nums">
                    {formatMonto(boleta.monto)}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {boleta.descripcion || "Sin descripción"}
                </p>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground tabular-nums">
                    <CalendarDays className="w-3 h-3" aria-hidden />
                    {formatFecha(boleta.fecha)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                    {boleta.id}
                  </span>
                  <StatusBadge status={boleta.estado} size="sm" />
                </div>
              </div>

              <ChevronRight
                className="w-4 h-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-hidden
              />
            </Link>
          ))
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
