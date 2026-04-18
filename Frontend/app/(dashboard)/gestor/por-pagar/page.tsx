"use client"

import { useState, useEffect, useCallback } from "react"
import { CalendarDays, Wallet, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import StatusBadge from "@/components/status-badge"
import PageHeader from "@/components/page-header"
import Pagination from "@/components/pagination"
import { UserAvatar } from "@/components/user-avatar"
import { formatMonto, formatFecha, type Boleta } from "@/lib/mock-data"
import { boletasApi, normalizeBoleta } from "@/lib/api"
import { useBoletasSync } from "@/hooks/useBoletasSync"
import PayModal from "@/components/pay-modal"

const PAGE_SIZE = 20

export default function GestorPorPagarPage() {
  const [boletas, setBoletas] = useState<Boleta[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [payTarget, setPayTarget] = useState<Boleta | null>(null)
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
        estado: "aprobada",
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

  const handleConfirmPago = async (
    comprobante: { url: string; nombre: string; tipo: string; tamano: number },
  ) => {
    if (!payTarget?._id && !payTarget?.id) return
    const id = payTarget._id ?? payTarget.id
    try {
      await boletasApi.pagar(id, comprobante)
      await loadData()
    } catch (err) {
      console.error("Error al registrar pago:", err)
    } finally {
      setPayTarget(null)
    }
  }

  return (
    <>
      <div className="p-4 sm:p-6 space-y-5 max-w-5xl">
        <BreadcrumbNav
          items={[
            { label: "Resumen", href: "/gestor" },
            { label: "Por pagar" },
          ]}
        />
        <PageHeader
          title="Por pagar"
          description="Boletas aprobadas pendientes de reembolso al empleado."
        />

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
          <Input
            placeholder="Buscar por empleado, tipo o ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        {total > 0 && !loading && (
          <p className="text-xs text-muted-foreground -mt-1">
            <span className="tabular-nums font-semibold text-foreground">{total}</span> por pagar
          </p>
        )}

        <div className="space-y-2">
          {loading && boletas.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground border border-border rounded-xl bg-card">
              Cargando...
            </div>
          ) : boletas.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground border border-border rounded-xl bg-card">
              {search ? "No se encontraron resultados." : "No hay boletas pendientes de pago."}
            </div>
          ) : (
            boletas.map((boleta) => (
              <div
                key={boleta.id}
                className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-accent/40"
              >
                <div className="flex items-start gap-3">
                  <UserAvatar
                    avatar={boleta.empleadoNombre?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "??"}
                    avatarUrl={boleta.empleadoAvatarUrl}
                    name={boleta.empleadoNombre}
                    size={40}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {boleta.empleadoNombre}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {boleta.tipo} · <span className="font-mono">{boleta.id}</span>
                        </p>
                      </div>
                      <p className="text-lg font-bold text-foreground shrink-0 tabular-nums">
                        {formatMonto(boleta.monto)}
                      </p>
                    </div>
                    {boleta.descripcion && (
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                        {boleta.descripcion}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-3 gap-3 flex-wrap">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground tabular-nums">
                          <CalendarDays className="w-3 h-3" aria-hidden />
                          {formatFecha(boleta.fecha)}
                        </span>
                        <StatusBadge status={boleta.estado} size="sm" />
                      </div>
                      <Button
                        size="sm"
                        className="h-8 text-xs font-semibold bg-accent text-accent-foreground hover:bg-accent/90 shrink-0"
                        onClick={() => setPayTarget(boleta)}
                      >
                        <Wallet className="w-3.5 h-3.5 mr-1.5" aria-hidden />
                        Registrar pago
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
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
