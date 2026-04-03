"use client"

import { useState, useEffect, useCallback } from "react"
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Upload,
  X,
  ChevronRight,
  CalendarDays,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import AppSidebar from "@/components/app-sidebar"
import StatusBadge from "@/components/status-badge"
import { TIPOS_BOLETA, formatMonto, formatFecha, type Boleta, type BoletaTipo } from "@/lib/mock-data"
import { boletasApi, uploadsApi, normalizeBoleta } from "@/lib/api"
import type { ApiStats } from "@/lib/types"
import type { User } from "@/app/page"

type View = "dashboard" | "historial" | "nueva"

interface EmployeeDashboardProps {
  user: User
  onLogout: () => void
}

export default function EmployeeDashboard({ user, onLogout }: EmployeeDashboardProps) {
  const [view, setView] = useState<View>("dashboard")
  const [search, setSearch] = useState("")
  const [selectedBoleta, setSelectedBoleta] = useState<Boleta | null>(null)
  const [boletas, setBoletas] = useState<Boleta[]>([])
  const [stats, setStats] = useState<ApiStats | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [newForm, setNewForm] = useState({
    tipo: "" as BoletaTipo | "",
    monto: "",
    fecha: "",
    descripcion: "",
    imagen: null as File | null,
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState("")

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
      // mantener estado vacío si falla
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filtered = boletas.filter(
    (b) =>
      b.tipo.toLowerCase().includes(search.toLowerCase()) ||
      b.id.toLowerCase().includes(search.toLowerCase()) ||
      b.descripcion.toLowerCase().includes(search.toLowerCase())
  )

  const navItems = [
    {
      icon: <LayoutDashboard className="w-4 h-4" />,
      label: "Inicio",
      active: view === "dashboard",
      onClick: () => { setView("dashboard"); setSelectedBoleta(null) },
    },
    {
      icon: <FileText className="w-4 h-4" />,
      label: "Mis boletas",
      active: view === "historial",
      onClick: () => { setView("historial"); setSelectedBoleta(null) },
    },
    {
      icon: <PlusCircle className="w-4 h-4" />,
      label: "Nueva boleta",
      active: view === "nueva",
      onClick: () => { setView("nueva"); setSelectedBoleta(null) },
    },
  ]

  const handleSubmitBoleta = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError("")

    try {
      let imagen: { url: string; nombre: string; tipo: string; tamano: number } | undefined

      if (newForm.imagen) {
        imagen = await uploadsApi.upload(newForm.imagen)
      }

      await boletasApi.create({
        tipo: newForm.tipo as string,
        monto: Number(newForm.monto),
        fecha: newForm.fecha,
        descripcion: newForm.descripcion,
        imagen,
      })

      await loadData()
      setSubmitted(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Error al enviar la boleta")
    } finally {
      setSubmitting(false)
    }
  }

  const displayStats = {
    total: stats?.total ?? boletas.length,
    pendientes: stats?.pendiente ?? 0,
    aprobadas: stats?.aprobada ?? 0,
    rechazadas: stats?.rechazada ?? 0,
    totalAprobado: stats?.montoAprobado ?? 0,
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AppSidebar
        user={user}
        onLogout={onLogout}
        navItems={navItems}
        roleLabel="Empleado"
        roleColor="oklch(0.58 0.14 162)"
      />

      <main className="flex-1 overflow-y-auto">
        {/* Dashboard view */}
        {view === "dashboard" && (
          <div className="p-6 space-y-6 max-w-5xl">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Hola, {user.name.split(" ")[0]}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Aquí tienes un resumen de tus boletas de gastos.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total enviadas", value: displayStats.total, icon: <FileText className="w-5 h-5" />, color: "var(--primary)" },
                { label: "Pendientes", value: displayStats.pendientes, icon: <Clock className="w-5 h-5" />, color: "oklch(0.62 0.14 72)" },
                { label: "Aprobadas", value: displayStats.aprobadas, icon: <CheckCircle className="w-5 h-5" />, color: "oklch(0.58 0.14 162)" },
                { label: "Rechazadas", value: displayStats.rechazadas, icon: <XCircle className="w-5 h-5" />, color: "oklch(0.55 0.22 27)" },
              ].map((stat) => (
                <Card key={stat.label} className="border shadow-none">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
                      <span style={{ color: stat.color }}>{stat.icon}</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {loadingData ? "—" : stat.value}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Total reembolsado */}
            <Card className="border shadow-none" style={{ background: "var(--primary)" }}>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/70">Total aprobado para reembolso</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {loadingData ? "—" : formatMonto(displayStats.totalAprobado)}
                  </p>
                </div>
                <CheckCircle className="w-10 h-10 text-white/30" />
              </CardContent>
            </Card>

            {/* Recent */}
            <Card className="border shadow-none">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold">Últimas boletas</CardTitle>
                <button
                  className="text-xs font-medium flex items-center gap-1"
                  style={{ color: "var(--accent)" }}
                  onClick={() => setView("historial")}
                >
                  Ver todas <ChevronRight className="w-3 h-3" />
                </button>
              </CardHeader>
              <CardContent className="p-0">
                {loadingData ? (
                  <div className="px-5 py-8 text-center text-sm text-muted-foreground">Cargando...</div>
                ) : boletas.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                    No tienes boletas aún.{" "}
                    <button className="underline" style={{ color: "var(--accent)" }} onClick={() => setView("nueva")}>
                      Crea una
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {boletas.slice(0, 4).map((boleta) => (
                      <button
                        key={boleta.id}
                        className="w-full flex items-center gap-4 px-5 py-3 hover:bg-muted/50 transition-colors text-left"
                        onClick={() => { setSelectedBoleta(boleta); setView("historial") }}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: "var(--secondary)" }}
                        >
                          <FileText className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{boleta.tipo}</p>
                          <p className="text-xs text-muted-foreground">{formatFecha(boleta.fecha)}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-foreground">{formatMonto(boleta.monto)}</p>
                          <StatusBadge status={boleta.estado} size="sm" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Historial view */}
        {view === "historial" && !selectedBoleta && (
          <div className="p-6 space-y-5 max-w-5xl">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Mis boletas</h1>
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
                    onClick={() => setSelectedBoleta(boleta)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: "var(--secondary)" }}
                        >
                          <FileText className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-foreground">{boleta.tipo}</span>
                            <span className="text-xs text-muted-foreground font-mono">{boleta.id}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{boleta.descripcion}</p>
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <CalendarDays className="w-3 h-3" />
                              {formatFecha(boleta.fecha)}
                            </span>
                            <StatusBadge status={boleta.estado} size="sm" />
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-base font-bold text-foreground">{formatMonto(boleta.monto)}</p>
                          <ChevronRight className="w-4 h-4 text-muted-foreground mt-2 ml-auto" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* Detalle boleta */}
        {view === "historial" && selectedBoleta && (
          <div className="p-6 space-y-5 max-w-2xl">
            <button
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setSelectedBoleta(null)}
            >
              <X className="w-4 h-4" /> Volver al historial
            </button>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground">{selectedBoleta.tipo}</h1>
                <StatusBadge status={selectedBoleta.estado} />
              </div>
              <p className="text-muted-foreground text-sm mt-1 font-mono">{selectedBoleta.id}</p>
            </div>

            <Card className="border shadow-none overflow-hidden">
              {selectedBoleta.imageUrl ? (
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}${selectedBoleta.imageUrl}`}
                  alt="Boleta"
                  className="w-full object-contain max-h-64"
                />
              ) : (
                <div
                  className="h-48 flex items-center justify-center"
                  style={{ background: "var(--secondary)" }}
                >
                  <div className="text-center space-y-2">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto" />
                    <p className="text-xs text-muted-foreground">Sin imagen adjunta</p>
                  </div>
                </div>
              )}
            </Card>

            <Card className="border shadow-none">
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Monto", value: formatMonto(selectedBoleta.monto) },
                    { label: "Fecha de gasto", value: formatFecha(selectedBoleta.fecha) },
                    { label: "Tipo", value: selectedBoleta.tipo },
                    {
                      label: "Fecha de revisión",
                      value: selectedBoleta.fechaRevision ? formatFecha(selectedBoleta.fechaRevision) : "—",
                    },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{item.value}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Descripción</p>
                  <p className="text-sm text-foreground mt-0.5 leading-relaxed">{selectedBoleta.descripcion}</p>
                </div>
                {selectedBoleta.comentarioAuditor && (
                  <div
                    className="p-3 rounded-lg"
                    style={{
                      background: selectedBoleta.estado === "rechazada" ? "oklch(0.97 0.02 27)" : "oklch(0.95 0.04 145)",
                      borderLeft: `3px solid ${selectedBoleta.estado === "rechazada" ? "oklch(0.577 0.245 27.325)" : "oklch(0.56 0.13 145)"}`,
                    }}
                  >
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Comentario del auditor</p>
                    <p className="text-sm text-foreground leading-relaxed">{selectedBoleta.comentarioAuditor}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Nueva boleta */}
        {view === "nueva" && (
          <div className="p-6 space-y-5 max-w-2xl">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Nueva boleta</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Completa el formulario para enviar tu solicitud de reembolso.
              </p>
            </div>

            {submitted ? (
              <Card className="border shadow-none">
                <CardContent className="p-10 text-center space-y-3">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
                    style={{ background: "oklch(0.95 0.04 145)" }}
                  >
                    <CheckCircle className="w-7 h-7" style={{ color: "oklch(0.56 0.13 145)" }} />
                  </div>
                  <h2 className="text-lg font-bold text-foreground">Boleta enviada exitosamente</h2>
                  <p className="text-sm text-muted-foreground">
                    Tu solicitud ha sido registrada y será revisada por el equipo de auditores.
                  </p>
                  <Button
                    className="mt-4 text-white"
                    style={{ background: "var(--primary)" }}
                    onClick={() => {
                      setSubmitted(false)
                      setNewForm({ tipo: "", monto: "", fecha: "", descripcion: "", imagen: null })
                    }}
                  >
                    Enviar otra boleta
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border shadow-none">
                <CardContent className="p-5">
                  <form onSubmit={handleSubmitBoleta} className="space-y-5">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Tipo de gasto</Label>
                      <select
                        className="w-full h-10 px-3 rounded-lg border text-sm bg-background text-foreground"
                        style={{ borderColor: "var(--border)" }}
                        value={newForm.tipo}
                        onChange={(e) => setNewForm({ ...newForm, tipo: e.target.value as BoletaTipo })}
                        required
                      >
                        <option value="">Selecciona un tipo...</option>
                        {TIPOS_BOLETA.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium">Monto (CLP)</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={newForm.monto}
                          onChange={(e) => setNewForm({ ...newForm, monto: e.target.value })}
                          required
                          min="1"
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium">Fecha del gasto</Label>
                        <Input
                          type="date"
                          value={newForm.fecha}
                          onChange={(e) => setNewForm({ ...newForm, fecha: e.target.value })}
                          required
                          className="h-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Descripción</Label>
                      <textarea
                        className="w-full px-3 py-2 rounded-lg border text-sm bg-background text-foreground resize-none focus:outline-none focus:ring-2"
                        style={{ borderColor: "var(--border)", minHeight: "80px" }}
                        placeholder="Describe brevemente el motivo del gasto..."
                        value={newForm.descripcion}
                        onChange={(e) => setNewForm({ ...newForm, descripcion: e.target.value })}
                        required
                        minLength={10}
                      />
                    </div>

                    {/* Upload */}
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Imagen de la boleta</Label>
                      <label
                        className="flex flex-col items-center justify-center gap-2 w-full rounded-lg border-2 border-dashed cursor-pointer transition-colors py-8"
                        style={{
                          borderColor: newForm.imagen ? "var(--accent)" : "var(--border)",
                          background: newForm.imagen ? "oklch(0.96 0.01 185 / 0.2)" : "transparent",
                        }}
                      >
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="sr-only"
                          onChange={(e) => setNewForm({ ...newForm, imagen: e.target.files?.[0] ?? null })}
                        />
                        <Upload
                          className="w-6 h-6"
                          style={{ color: newForm.imagen ? "var(--accent)" : "var(--muted-foreground)" }}
                        />
                        <span className="text-sm text-muted-foreground">
                          {newForm.imagen ? newForm.imagen.name : "Haz clic para subir o arrastra la imagen"}
                        </span>
                        <span className="text-xs text-muted-foreground">JPG, PNG, PDF hasta 5 MB</span>
                      </label>
                    </div>

                    {submitError && (
                      <p className="text-sm text-destructive">{submitError}</p>
                    )}

                    <Button
                      type="submit"
                      className="w-full h-10 font-semibold text-white"
                      style={{ background: "var(--primary)" }}
                      disabled={submitting}
                    >
                      {submitting ? "Enviando..." : "Enviar solicitud de reembolso"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
