"use client"

import { useState, useEffect, useCallback } from "react"
import {
  LayoutDashboard,
  ClipboardList,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Search,
  X,
  CalendarDays,
  MessageSquare,
  Filter,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import AppSidebar from "@/components/app-sidebar"
import StatusBadge from "@/components/status-badge"
import { formatMonto, formatFecha, type Boleta, type BoletaStatus } from "@/lib/mock-data"
import { boletasApi, normalizeBoleta } from "@/lib/api"
import type { ApiStats } from "@/lib/types"
import type { User } from "@/app/page"

type View = "dashboard" | "revision"

interface AuditorDashboardProps {
  user: User
  onLogout: () => void
}

export default function AuditorDashboard({ user, onLogout }: AuditorDashboardProps) {
  const [view, setView] = useState<View>("dashboard")
  const [boletas, setBoletas] = useState<Boleta[]>([])
  const [stats, setStats] = useState<ApiStats | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [selected, setSelected] = useState<Boleta | null>(null)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<BoletaStatus | "todas">("todas")
  const [comentario, setComentario] = useState("")
  const [resolving, setResolving] = useState(false)
  const [resolveError, setResolveError] = useState("")

  const loadData = useCallback(async () => {
    setLoadingData(true)
    try {
      const [boletasRes, statsRes] = await Promise.all([
        boletasApi.list({ limit: "100" }),
        boletasApi.stats(),
      ])
      setBoletas(boletasRes.items.map(normalizeBoleta))
      setStats(statsRes)
    } catch {
      // mantener estado vacío
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const pendientes = boletas.filter((b) => b.estado === "pendiente" || b.estado === "en_revision")

  const displayStats = {
    pendientes: (stats?.pendiente ?? 0) + (stats?.en_revision ?? 0),
    aprobadas: stats?.aprobada ?? 0,
    rechazadas: stats?.rechazada ?? 0,
  }

  const filtered = boletas.filter((b) => {
    const matchSearch =
      b.tipo.toLowerCase().includes(search.toLowerCase()) ||
      b.id.toLowerCase().includes(search.toLowerCase()) ||
      b.empleadoNombre.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === "todas" || b.estado === filterStatus
    return matchSearch && matchStatus
  })

  const handleResolution = async (accion: "aprobar" | "rechazar") => {
    if (!selected?._id) return
    setResolving(true)
    setResolveError("")

    try {
      await (accion === "aprobar"
        ? boletasApi.aprobar(selected._id, comentario || undefined)
        : boletasApi.rechazar(selected._id, comentario || undefined))

      await loadData()
      setSelected(null)
      setComentario("")
    } catch (err) {
      setResolveError(err instanceof Error ? err.message : "Error al procesar la resolución")
    } finally {
      setResolving(false)
    }
  }

  const navItems = [
    {
      icon: <LayoutDashboard className="w-4 h-4" />,
      label: "Resumen",
      active: view === "dashboard",
      onClick: () => { setView("dashboard"); setSelected(null) },
    },
    {
      icon: <ClipboardList className="w-4 h-4" />,
      label: "Revisar boletas",
      active: view === "revision",
      onClick: () => { setView("revision"); setSelected(null) },
    },
  ]

  const statusFilters: { value: BoletaStatus | "todas"; label: string }[] = [
    { value: "todas", label: "Todas" },
    { value: "pendiente", label: "Pendiente" },
    { value: "en_revision", label: "En revisión" },
    { value: "aprobada", label: "Aprobada" },
    { value: "rechazada", label: "Rechazada" },
  ]

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AppSidebar
        user={user}
        onLogout={onLogout}
        navItems={navItems}
        roleLabel="Auditor"
        roleColor="oklch(0.62 0.14 72)"
      />

      <main className="flex-1 overflow-y-auto">
        {/* Dashboard */}
        {view === "dashboard" && (
          <div className="p-6 space-y-6 max-w-5xl">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Panel de auditoría</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Gestiona y revisa las solicitudes de reembolso de todos los empleados.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Por revisar", value: displayStats.pendientes, icon: <Clock className="w-5 h-5" />, color: "oklch(0.62 0.14 72)", bg: "oklch(0.97 0.03 72)" },
                { label: "Aprobadas", value: displayStats.aprobadas, icon: <CheckCircle className="w-5 h-5" />, color: "oklch(0.58 0.14 162)", bg: "oklch(0.95 0.04 162)" },
                { label: "Rechazadas", value: displayStats.rechazadas, icon: <XCircle className="w-5 h-5" />, color: "oklch(0.55 0.22 27)", bg: "oklch(0.97 0.02 27)" },
              ].map((stat) => (
                <Card key={stat.label} className="border shadow-none">
                  <CardContent className="p-5">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                      style={{ background: stat.bg }}
                    >
                      <span style={{ color: stat.color }}>{stat.icon}</span>
                    </div>
                    <p className="text-3xl font-bold text-foreground">
                      {loadingData ? "—" : stat.value}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pendientes urgentes */}
            {!loadingData && pendientes.length > 0 && (
              <Card className="border shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ background: "oklch(0.65 0.15 70)" }}
                    />
                    Solicitudes pendientes de revisión
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {pendientes.slice(0, 5).map((boleta) => (
                      <button
                        key={boleta.id}
                        className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-muted/50 transition-colors text-left"
                        onClick={() => { setSelected(boleta); setView("revision") }}
                      >
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ background: "var(--accent)" }}
                        >
                          {boleta.empleadoNombre.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{boleta.empleadoNombre}</p>
                          <p className="text-xs text-muted-foreground">
                            {boleta.tipo} — {formatFecha(boleta.fecha)}
                          </p>
                        </div>
                        <div className="text-right shrink-0 space-y-1">
                          <p className="text-sm font-semibold text-foreground">{formatMonto(boleta.monto)}</p>
                          <StatusBadge status={boleta.estado} size="sm" />
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {loadingData && (
              <div className="text-center py-8 text-sm text-muted-foreground">Cargando datos...</div>
            )}
          </div>
        )}

        {/* Revisión view */}
        {view === "revision" && !selected && (
          <div className="p-6 space-y-5 max-w-5xl">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Revisar boletas</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Selecciona una solicitud para revisar y actualizar su estado.
              </p>
            </div>

            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por empleado, tipo o ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>
              <div className="flex items-center gap-1 p-1 rounded-lg border" style={{ borderColor: "var(--border)" }}>
                <Filter className="w-4 h-4 text-muted-foreground ml-2 mr-1" />
                {statusFilters.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFilterStatus(f.value)}
                    className="text-xs px-3 py-1.5 rounded-md font-medium transition-all"
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

            <div className="space-y-3">
              {loadingData ? (
                <div className="text-center py-12 text-muted-foreground text-sm">Cargando...</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  No se encontraron boletas.
                </div>
              ) : (
                filtered.map((boleta) => (
                  <Card
                    key={boleta.id}
                    className="border shadow-none cursor-pointer hover:shadow-sm transition-all"
                    onClick={() => setSelected(boleta)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ background: "var(--primary)" }}
                        >
                          {boleta.empleadoNombre.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-foreground">{boleta.empleadoNombre}</span>
                            <span className="text-xs text-muted-foreground font-mono">{boleta.id}</span>
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
                        <p className="text-base font-bold text-foreground shrink-0">{formatMonto(boleta.monto)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* Detalle para revisar */}
        {view === "revision" && selected && (
          <div className="p-6 space-y-5 max-w-2xl">
            <button
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => { setSelected(null); setComentario(""); setResolveError("") }}
            >
              <X className="w-4 h-4" /> Volver a la lista
            </button>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground">{selected.tipo}</h1>
                <StatusBadge status={selected.estado} />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Empleado: <span className="font-medium text-foreground">{selected.empleadoNombre}</span>
                {" "}— <span className="font-mono">{selected.id}</span>
              </p>
            </div>

            {/* Imagen */}
            <Card className="border shadow-none overflow-hidden">
              {selected.imageUrl ? (
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}${selected.imageUrl}`}
                  alt="Boleta"
                  className="w-full object-contain max-h-64"
                />
              ) : (
                <div
                  className="h-52 flex items-center justify-center"
                  style={{ background: "var(--secondary)" }}
                >
                  <div className="text-center space-y-2">
                    <FileText className="w-14 h-14 text-muted-foreground mx-auto" />
                    <p className="text-xs text-muted-foreground">Sin imagen adjunta</p>
                  </div>
                </div>
              )}
            </Card>

            <Card className="border shadow-none">
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Monto solicitado", value: formatMonto(selected.monto) },
                    { label: "Fecha del gasto", value: formatFecha(selected.fecha) },
                    { label: "Tipo de gasto", value: selected.tipo },
                    { label: "Correo empleado", value: selected.empleadoEmail },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5 break-all">{item.value}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Descripción del empleado</p>
                  <p className="text-sm text-foreground mt-0.5 leading-relaxed">{selected.descripcion}</p>
                </div>
              </CardContent>
            </Card>

            {/* Acción del auditor */}
            {(selected.estado === "pendiente" || selected.estado === "en_revision") && (
              <Card className="border shadow-none">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" style={{ color: "var(--accent)" }} />
                    <h3 className="text-sm font-semibold text-foreground">Resolución del auditor</h3>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Comentario (opcional)</Label>
                    <textarea
                      className="w-full px-3 py-2 rounded-lg border text-sm bg-background text-foreground resize-none focus:outline-none focus:ring-2"
                      style={{ borderColor: "var(--border)", minHeight: "80px" }}
                      placeholder="Escribe un comentario para el empleado..."
                      value={comentario}
                      onChange={(e) => setComentario(e.target.value)}
                    />
                  </div>
                  {resolveError && (
                    <p className="text-sm text-destructive">{resolveError}</p>
                  )}
                  <div className="flex gap-3">
                    <Button
                      className="flex-1 h-10 font-semibold text-white"
                      style={{ background: "oklch(0.44 0.13 162)" }}
                      onClick={() => handleResolution("aprobar")}
                      disabled={resolving}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {resolving ? "Procesando..." : "Aprobar reembolso"}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 h-10 font-semibold border-destructive"
                      style={{ color: "var(--destructive)", borderColor: "var(--destructive)" }}
                      onClick={() => handleResolution("rechazar")}
                      disabled={resolving}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      {resolving ? "Procesando..." : "Rechazar"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {selected.comentarioAuditor && (
              <Card className="border shadow-none">
                <CardContent className="p-5">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Resolución registrada</p>
                  <p className="text-sm text-foreground leading-relaxed">{selected.comentarioAuditor}</p>
                  {selected.fechaRevision && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Revisado el {formatFecha(selected.fechaRevision)}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
