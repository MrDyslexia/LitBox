"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Search, CalendarDays, ChevronRight } from "lucide-react"
import { TipoGastoIcon } from "@/components/tipo-gasto-icon"
import { useTiposGasto } from "@/hooks/useTiposGasto"
import { UserAvatar } from "@/components/user-avatar"
import { Input } from "@/components/ui/input"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import StatusBadge from "@/components/status-badge"
import PageHeader from "@/components/page-header"
import FilterChips from "@/components/filter-chips"
import Pagination from "@/components/pagination"
import { formatMonto, formatFecha, type Boleta, type BoletaStatus } from "@/lib/mock-data"
import { boletasApi, normalizeBoleta } from "@/lib/api"
import { useBoletasSync } from "@/hooks/useBoletasSync"

const PAGE_SIZE = 20

const statusFilters: ReadonlyArray<{ value: BoletaStatus | "todas"; label: string }> = [
  { value: "todas", label: "Todas" },
  { value: "pendiente", label: "Pendiente" },
  { value: "en_revision", label: "En revisión" },
  { value: "aprobada", label: "Aprobada" },
  { value: "rechazada", label: "Rechazada" },
]

export default function AuditorRevisionPage() {
  const { getIcono } = useTiposGasto()
  const [boletas, setBoletas] = useState<Boleta[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<BoletaStatus | "todas">("todas")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => { setPage(1) }, [debouncedSearch, filterStatus])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(PAGE_SIZE),
      }
      if (debouncedSearch) params.buscar = debouncedSearch
      if (filterStatus !== "todas") params.estado = filterStatus

      const result = await boletasApi.list(params)
      if (result && Array.isArray(result.items)) {
        setBoletas(result.items.map(normalizeBoleta))
        setTotalPages(result.totalPages || 1)
        setTotal(result.total || 0)
      }
    } catch (err) {
      console.error("Error cargando boletas para auditoría:", err)
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, filterStatus])

  useEffect(() => { loadData() }, [loadData])
  useBoletasSync(loadData)

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-5xl">
      <BreadcrumbNav
        items={[
          { label: "Resumen", href: "/auditor" },
          { label: "Revisar boletas" },
        ]}
      />
      <PageHeader
        title="Revisar boletas"
        description="Selecciona una solicitud para revisar y actualizar su estado."
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
          <Input
            placeholder="Buscar por empleado, tipo o ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <FilterChips options={statusFilters} value={filterStatus} onChange={setFilterStatus} />
      </div>

      {total > 0 && !loading && (
        <p className="text-xs text-muted-foreground -mt-1">
          <span className="tabular-nums font-semibold text-foreground">{total}</span> resultado{total === 1 ? "" : "s"}
        </p>
      )}

      <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
        {loading && boletas.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Cargando solicitudes...</div>
        ) : boletas.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No se encontraron boletas con los filtros aplicados.
          </div>
        ) : (
          boletas.map((boleta) => (
            <Link
              key={boleta.id}
              href={`/auditor/revision/${boleta._id ?? boleta.id}`}
              className="group flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors"
            >
              <UserAvatar
                avatar={boleta.empleadoNombre?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "??"}
                avatarUrl={boleta.empleadoAvatarUrl}
                name={boleta.empleadoNombre}
                size={36}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground truncate">{boleta.empleadoNombre}</p>
                  <p className="text-base font-bold text-foreground shrink-0 tabular-nums">
                    {formatMonto(boleta.monto)}
                  </p>
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <TipoGastoIcon icono={getIcono(boleta.tipo)} className="w-3 h-3 shrink-0" />
                  {boleta.tipo}
                  <span className="text-border">·</span>
                  <span className="font-mono">{boleta.id}</span>
                </p>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground tabular-nums">
                    <CalendarDays className="w-3 h-3" aria-hidden />
                    {formatFecha(boleta.fecha)}
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
