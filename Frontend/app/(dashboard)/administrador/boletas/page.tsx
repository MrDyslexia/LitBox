"use client"

import { useState, useEffect, useCallback } from "react"
import { Search } from "lucide-react"
import { UserAvatar } from "@/components/user-avatar"
import { Input } from "@/components/ui/input"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import StatusBadge from "@/components/status-badge"
import PageHeader from "@/components/page-header"
import FilterChips from "@/components/filter-chips"
import DataTableShell, { TableHeader, Th, Tr, Td } from "@/components/data-table-shell"
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

export default function AdminBoletasPage() {
  const [boletas, setBoletas] = useState<Boleta[]>([])
  const [loading, setLoading] = useState(true)
  const [searchBoletas, setSearchBoletas] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<BoletaStatus | "todas">("todas")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchBoletas), 400)
    return () => clearTimeout(t)
  }, [searchBoletas])

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
      console.error("Error cargando boletas:", err)
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, filterStatus])

  useEffect(() => { loadData() }, [loadData])
  useBoletasSync(loadData)

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-6xl">
      <BreadcrumbNav
        items={[
          { label: "Resumen general", href: "/administrador" },
          { label: "Todas las boletas" },
        ]}
      />
      <PageHeader
        title="Todas las boletas"
        description="Vista completa de las solicitudes de reembolso en el sistema."
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
          <Input
            placeholder="Buscar por empleado, tipo o ID..."
            value={searchBoletas}
            onChange={(e) => setSearchBoletas(e.target.value)}
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

      <DataTableShell>
        <TableHeader>
          <tr>
            <Th className="hidden sm:table-cell">ID</Th>
            <Th>Empleado</Th>
            <Th className="hidden sm:table-cell">Tipo</Th>
            <Th align="right">Monto</Th>
            <Th className="hidden md:table-cell">Fecha</Th>
            <Th>Estado</Th>
          </tr>
        </TableHeader>
        <tbody>
          {loading && boletas.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-16 text-center text-sm text-muted-foreground">
                Cargando boletas...
              </td>
            </tr>
          ) : boletas.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-16 text-center text-sm text-muted-foreground">
                No se encontraron boletas.
              </td>
            </tr>
          ) : (
            boletas.map((b) => (
              <Tr key={b.id}>
                <Td className="hidden sm:table-cell font-mono text-[11px] text-muted-foreground">{b.id}</Td>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <UserAvatar
                      avatar={b.empleadoNombre?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "??"}
                      avatarUrl={b.empleadoAvatarUrl}
                      name={b.empleadoNombre}
                      size={28}
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{b.empleadoNombre}</p>
                      <p className="text-[11px] text-muted-foreground truncate hidden sm:block">{b.empleadoEmail}</p>
                    </div>
                  </div>
                </Td>
                <Td className="hidden sm:table-cell text-muted-foreground">{b.tipo}</Td>
                <Td align="right" className="font-semibold">{formatMonto(b.monto)}</Td>
                <Td className="hidden md:table-cell text-muted-foreground">{formatFecha(b.fecha)}</Td>
                <Td><StatusBadge status={b.estado} size="sm" /></Td>
              </Tr>
            ))
          )}
        </tbody>
      </DataTableShell>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
