"use client"

import { useState, useEffect, useCallback } from "react"
import { CheckCircle2, ImageIcon, ExternalLink, Search, Wallet } from "lucide-react"
import { Input } from "@/components/ui/input"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import StatusBadge from "@/components/status-badge"
import PageHeader from "@/components/page-header"
import KpiCard from "@/components/kpi-card"
import Pagination from "@/components/pagination"
import { UserAvatar } from "@/components/user-avatar"
import { formatMonto, formatFecha, type Boleta } from "@/lib/mock-data"
import { boletasApi, normalizeBoleta } from "@/lib/api"
import type { ApiStats } from "@/lib/types"
import { useBoletasSync } from "@/hooks/useBoletasSync"

const PAGE_SIZE = 20

export default function GestorHistorialPage() {
  const [boletas, setBoletas] = useState<Boleta[]>([])
  const [stats, setStats] = useState<ApiStats | null>(null)
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
        estado: "pagada",
      }
      if (debouncedSearch) params.buscar = debouncedSearch

      const [boletasResult, statsResult] = await Promise.allSettled([
        boletasApi.list(params),
        boletasApi.stats(),
      ])

      if (boletasResult.status === "fulfilled") {
        const items = boletasResult.value.items || []
        setBoletas(items.map(normalizeBoleta))
        setTotalPages(boletasResult.value.totalPages || 1)
        setTotal(boletasResult.value.total || 0)
      }

      if (statsResult.status === "fulfilled") {
        setStats(statsResult.value)
      }
    } catch (err) {
      console.error("Error crítico en carga de historial:", err)
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch])

  useEffect(() => { loadData() }, [loadData])
  useBoletasSync(loadData)

  const montoPagado = stats?.montoPagado ?? 0
  const totalPagadas = stats?.pagadas ?? 0

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-5xl">
      <BreadcrumbNav
        items={[
          { label: "Resumen", href: "/gestor" },
          { label: "Historial de pagos" },
        ]}
      />
      <PageHeader
        title="Historial de pagos"
        description="Registro de todas las boletas reembolsadas desde la plataforma."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <KpiCard
          label="Total reembolsado"
          value={formatMonto(montoPagado)}
          sub={`Acumulado histórico`}
          icon={Wallet}
          tone="primary"
          size="md"
        />
        <KpiCard
          label="Boletas pagadas"
          value={totalPagadas.toString()}
          sub="Operaciones completadas"
          icon={CheckCircle2}
          tone="success"
          size="md"
        />
      </div>

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
          <span className="tabular-nums font-semibold text-foreground">{total}</span> resultado{total === 1 ? "" : "s"}
        </p>
      )}

      <div className="space-y-2">
        {loading && boletas.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground border border-border rounded-xl bg-card">
            Cargando historial...
          </div>
        ) : boletas.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground border border-border rounded-xl bg-card">
            {search ? "No se encontraron coincidencias." : "Aún no hay pagos registrados."}
          </div>
        ) : (
          boletas.map((boleta) => (
            <div
              key={boleta.id}
              className="rounded-xl border border-border bg-card p-4 space-y-3 transition-colors hover:border-foreground/20"
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
                      <p className="text-sm font-semibold text-foreground truncate">{boleta.empleadoNombre}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {boleta.tipo} · <span className="font-mono">{boleta.id}</span>
                      </p>
                    </div>
                    <p className="text-lg font-bold text-foreground shrink-0 tabular-nums">
                      {formatMonto(boleta.monto)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <StatusBadge status="pagada" size="sm" />
                    {boleta.fechaPago && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium tabular-nums">
                        <CheckCircle2 className="w-3 h-3" style={{ color: "var(--status-approved-dot)" }} aria-hidden />
                        Pagado el {formatFecha(boleta.fechaPago)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {boleta.comprobanteUrl && (
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL}${boleta.comprobanteUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-secondary/60 text-[11px] font-semibold uppercase tracking-wider text-foreground hover:bg-secondary transition-colors"
                >
                  <ImageIcon className="w-3.5 h-3.5 shrink-0" aria-hidden />
                  <span className="truncate flex-1">Ver comprobante de transferencia</span>
                  <ExternalLink className="w-3 h-3 shrink-0 opacity-60" aria-hidden />
                </a>
              )}
            </div>
          ))
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
