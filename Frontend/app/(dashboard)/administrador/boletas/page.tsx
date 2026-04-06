"use client"

import { useState, useEffect, useCallback } from "react"
import { Search } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import StatusBadge from "@/components/status-badge"
import { formatMonto, formatFecha, type Boleta, type BoletaStatus } from "@/lib/mock-data"
import { boletasApi, normalizeBoleta } from "@/lib/api"
import { useBoletasSync } from "@/hooks/useBoletasSync"
import Pagination from "@/components/pagination"

const PAGE_SIZE = 20

const statusFilters: { value: BoletaStatus | "todas"; label: string }[] = [
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

  // Debounce search 400ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchBoletas), 400)
    return () => clearTimeout(t)
  }, [searchBoletas])

  // Reset page when search or filter changes
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
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-w-6xl">
      <BreadcrumbNav
        items={[
          { label: "Resumen general", href: "/administrador" },
          { label: "Todas las boletas" },
        ]}
      />
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Todas las boletas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Vista completa de todas las solicitudes de reembolso en el sistema.
        </p>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por empleado, tipo o ID..."
              value={searchBoletas}
              onChange={(e) => setSearchBoletas(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          {total > 0 && !loading && (
            <p className="text-xs text-muted-foreground">{total} resultado(s)</p>
          )}
        </div>
        <div className="overflow-x-auto pb-1">
          <div className="flex items-center gap-1 p-1 rounded-lg border w-max" style={{ borderColor: "var(--border)" }}>
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

      <Card className="border shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--secondary)", borderBottom: "1px solid var(--border)" }}>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Empleado</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Monto</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Fecha</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && boletas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    Cargando boletas...
                  </td>
                </tr>
              ) : boletas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    No se encontraron boletas.
                  </td>
                </tr>
              ) : (
                boletas.map((b) => (
                  <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground hidden sm:table-cell">
                      {b.id}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-foreground">{b.empleadoNombre}</p>
                        <p className="text-xs text-muted-foreground hidden sm:block">{b.empleadoEmail}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground hidden sm:table-cell">{b.tipo}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{formatMonto(b.monto)}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{formatFecha(b.fecha)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.estado} size="sm" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
