"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  LayoutDashboard,
  FileText,
  CheckCircle,
  Clock,
  DollarSign,
  CalendarDays,
  Wallet,
  Menu,
  History,
  Upload,
  X,
  ImageIcon,
  ExternalLink,
  Settings,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import AppSidebar from "@/components/app-sidebar"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import StatusBadge from "@/components/status-badge"
import { formatMonto, formatFecha, type Boleta } from "@/lib/mock-data"
import { boletasApi, uploadsApi, normalizeBoleta } from "@/lib/api"
import type { ApiStats } from "@/lib/types"
import type { User } from "@/app/page"
import { useBoletasSync } from "@/hooks/useBoletasSync"
import ConfiguracionPerfil from "@/components/configuracion-perfil"

type View = "dashboard" | "por_pagar" | "historial" | "configuracion"

const GESTOR_COLOR = "oklch(0.52 0.18 290)"

interface GestorDashboardProps {
  user: User
  onLogout: () => void
  onUpdate: (updates: { name: string; email: string; avatar: string }) => void
}

// ─── Modal de confirmación de pago ───────────────────────────────────────────

interface PayModalProps {
  boleta: Boleta
  onConfirm: (comprobante: { url: string; nombre: string; tipo: string; tamano: number }) => Promise<void>
  onClose: () => void
}

function PayModal({ boleta, onConfirm, onClose }: PayModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    setFile(f)
    setError("")
    const url = URL.createObjectURL(f)
    setPreview(url)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleSubmit = async () => {
    if (!file) { setError("Debes adjuntar el comprobante de pago."); return }
    setUploading(true)
    setError("")
    try {
      const result = await uploadsApi.upload(file)
      await onConfirm(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar el pago")
      setUploading(false)
    }
  }

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview) }
  }, [preview])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4" style={{ color: GESTOR_COLOR }} />
            <h2 className="text-sm font-semibold text-foreground">Confirmar pago</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={uploading}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Resumen de la boleta */}
          <div
            className="rounded-xl p-4 space-y-2"
            style={{ background: "var(--muted)" }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{boleta.empleadoNombre}</p>
                <p className="text-xs text-muted-foreground">{boleta.tipo} — <span className="font-mono">{boleta.id}</span></p>
              </div>
              <p className="text-base font-bold text-foreground shrink-0">{formatMonto(boleta.monto)}</p>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{boleta.descripcion}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="w-3 h-3" />
              {formatFecha(boleta.fecha)}
            </div>
          </div>

          {/* Upload comprobante */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              Comprobante de transferencia <span className="text-destructive">*</span>
            </p>

            {preview ? (
              <div className="relative rounded-xl overflow-hidden border" style={{ borderColor: "var(--border)" }}>
                <img
                  src={preview}
                  alt="Comprobante"
                  className="w-full object-contain max-h-48"
                />
                <button
                  className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white shadow"
                  style={{ background: "rgba(0,0,0,0.6)" }}
                  onClick={() => { setFile(null); setPreview(null) }}
                  disabled={uploading}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="px-3 py-2 border-t" style={{ borderColor: "var(--border)" }}>
                  <p className="text-xs text-muted-foreground truncate">{file?.name}</p>
                </div>
              </div>
            ) : (
              <div
                className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
                style={{ borderColor: "var(--border)" }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: "oklch(0.94 0.03 290)" }}
                >
                  <ImageIcon className="w-5 h-5" style={{ color: GESTOR_COLOR }} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">Adjunta el comprobante</p>
                  <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG o PDF — arrastra o haz clic</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-1 h-8 text-xs"
                  type="button"
                  onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
                >
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  Seleccionar archivo
                </Button>
              </div>
            )}

            <input
              ref={inputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Acciones */}
          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              className="flex-1 h-11"
              onClick={onClose}
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 h-11 font-semibold text-white"
              style={{ background: file ? GESTOR_COLOR : undefined }}
              onClick={handleSubmit}
              disabled={uploading || !file}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {uploading ? "Procesando..." : "Confirmar pago"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Dashboard principal ──────────────────────────────────────────────────────

export default function GestorDashboard({ user, onLogout, onUpdate }: GestorDashboardProps) {
  const [view, setView] = useState<View>("dashboard")
  const [boletas, setBoletas] = useState<Boleta[]>([])
  const [stats, setStats] = useState<ApiStats | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [payTarget, setPayTarget] = useState<Boleta | null>(null)
  const [search, setSearch] = useState("")

  const loadData = useCallback(async () => {
    setLoadingData(true)
    try {
      const [boletasResult, statsResult] = await Promise.allSettled([
        boletasApi.list({ limit: "200" }),
        boletasApi.stats(),
      ])
      if (boletasResult.status === "fulfilled") {
        setBoletas(boletasResult.value.items.map(normalizeBoleta))
      } else {
        console.error("Error cargando boletas:", boletasResult.reason)
      }
      if (statsResult.status === "fulfilled") {
        setStats(statsResult.value)
      } else {
        console.error("Error cargando stats:", statsResult.reason)
      }
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])
  useBoletasSync(loadData)

  const porPagar = boletas.filter((b) => b.estado === "aprobada")
  const pagadas = boletas.filter((b) => b.estado === "pagada")

  const filteredPorPagar = porPagar.filter(
    (b) =>
      b.empleadoNombre.toLowerCase().includes(search.toLowerCase()) ||
      b.id.toLowerCase().includes(search.toLowerCase()) ||
      b.tipo.toLowerCase().includes(search.toLowerCase())
  )
  const filteredPagadas = pagadas.filter(
    (b) =>
      b.empleadoNombre.toLowerCase().includes(search.toLowerCase()) ||
      b.id.toLowerCase().includes(search.toLowerCase()) ||
      b.tipo.toLowerCase().includes(search.toLowerCase())
  )

  const handleConfirmPago = async (
    comprobante: { url: string; nombre: string; tipo: string; tamano: number }
  ) => {
    if (!payTarget?._id) return
    await boletasApi.pagar(payTarget._id, comprobante)
    await loadData()
    setPayTarget(null)
  }

  const navItems = [
    {
      icon: <LayoutDashboard className="w-4 h-4" />,
      label: "Resumen",
      active: view === "dashboard",
      onClick: () => setView("dashboard"),
    },
    {
      icon: <Wallet className="w-4 h-4" />,
      label: "Por pagar",
      active: view === "por_pagar",
      onClick: () => setView("por_pagar"),
    },
    {
      icon: <History className="w-4 h-4" />,
      label: "Historial de pagos",
      active: view === "historial",
      onClick: () => setView("historial"),
    },
    {
      icon: <Settings className="w-4 h-4" />,
      label: "Mi perfil",
      active: view === "configuracion",
      onClick: () => setView("configuracion"),
    },
  ]

  const montoPorPagar = porPagar.reduce((s, b) => s + b.monto, 0)
  const montoPagado = stats?.montoPagado ?? 0

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background overflow-hidden">
      {/* Mobile header */}
      <header
        className="md:hidden flex items-center justify-between px-4 py-3 shrink-0"
        style={{ background: "oklch(0.13 0.04 243)", borderBottom: "1px solid oklch(0.22 0.055 243)" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded flex items-center justify-center shrink-0" style={{ background: "var(--accent)" }}>
            <FileText className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-[13px] font-bold text-white tracking-tight">LitBox</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="text-white/80 hover:text-white transition-colors p-1"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" color="white"/>
        </button>
      </header>

      <AppSidebar
        user={user}
        onLogout={onLogout}
        navItems={navItems}
        roleLabel="Gestor"
        roleColor={GESTOR_COLOR}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <main className="flex-1 overflow-y-auto">

        {/* ── Dashboard ───────────────────────────────────────────────────── */}
        {view === "dashboard" && (
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-5xl">
            <BreadcrumbNav items={[{ label: "Resumen" }]} />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                Hola, {user.name.split(" ")[0]}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Gestiona los pagos de boletas aprobadas por los auditores.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <Card className="border shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">Por pagar</span>
                    <Clock className="w-4 h-4" style={{ color: GESTOR_COLOR }} />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{loadingData ? "—" : porPagar.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">{loadingData ? "—" : formatMonto(montoPorPagar)}</p>
                </CardContent>
              </Card>
              <Card className="border shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">Pagadas</span>
                    <CheckCircle className="w-4 h-4" style={{ color: "oklch(0.52 0.14 195)" }} />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{loadingData ? "—" : pagadas.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">{loadingData ? "—" : formatMonto(montoPagado)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Monto total */}
            <Card className="border shadow-none" style={{ background: GESTOR_COLOR }}>
              <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/70">Pendiente de pago</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white mt-1">
                    {loadingData ? "—" : formatMonto(montoPorPagar)}
                  </p>
                  <p className="text-xs text-white/50 mt-1">{porPagar.length} boleta{porPagar.length !== 1 ? "s" : ""} aprobada{porPagar.length !== 1 ? "s" : ""}</p>
                </div>
                <DollarSign className="w-10 h-10 text-white/25" />
              </CardContent>
            </Card>

            {/* Boletas recientes por pagar */}
            {!loadingData && porPagar.length > 0 && (
              <Card className="border shadow-none">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: GESTOR_COLOR }} />
                    Boletas pendientes de pago
                  </CardTitle>
                  <button
                    className="text-xs font-medium"
                    style={{ color: "var(--accent)" }}
                    onClick={() => setView("por_pagar")}
                  >
                    Ver todas
                  </button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {porPagar.slice(0, 5).map((boleta) => (
                      <div key={boleta.id} className="flex items-center gap-3 px-4 sm:px-5 py-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ background: GESTOR_COLOR }}
                        >
                          {boleta.empleadoNombre.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{boleta.empleadoNombre}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            {formatFecha(boleta.fecha)} — {boleta.tipo}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-foreground">{formatMonto(boleta.monto)}</p>
                        </div>
                      </div>
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

        {/* ── Por pagar ───────────────────────────────────────────────────── */}
        {view === "por_pagar" && (
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-w-5xl">
            <BreadcrumbNav
              items={[
                { label: "Resumen", onClick: () => setView("dashboard") },
                { label: "Por pagar" },
              ]}
            />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Por pagar</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Boletas aprobadas pendientes de reembolso al empleado.
              </p>
            </div>

            <Input
              placeholder="Buscar por empleado, tipo o ID..."
              value={search}
              onChange={(e) => { setSearch(e.target.value) }}
              className="h-10"
            />

            <div className="space-y-3">
              {loadingData ? (
                <div className="text-center py-12 text-muted-foreground text-sm">Cargando...</div>
              ) : filteredPorPagar.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  {search ? "No se encontraron boletas." : "No hay boletas pendientes de pago."}
                </div>
              ) : (
                filteredPorPagar.map((boleta) => (
                  <Card key={boleta.id} className="border shadow-none">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5"
                          style={{ background: GESTOR_COLOR }}
                        >
                          {boleta.empleadoNombre.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{boleta.empleadoNombre}</p>
                              <p className="text-xs text-muted-foreground">{boleta.tipo} — <span className="font-mono">{boleta.id}</span></p>
                            </div>
                            <p className="text-base font-bold text-foreground shrink-0">{formatMonto(boleta.monto)}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{boleta.descripcion}</p>
                          <div className="flex items-center justify-between mt-3 gap-3 flex-wrap">
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <CalendarDays className="w-3 h-3" />
                                {formatFecha(boleta.fecha)}
                              </span>
                              <StatusBadge status={boleta.estado} size="sm" />
                            </div>
                            <Button
                              className="h-8 text-xs font-semibold text-white shrink-0"
                              style={{ background: GESTOR_COLOR }}
                              onClick={() => setPayTarget(boleta)}
                            >
                              <Wallet className="w-3.5 h-3.5 mr-1.5" />
                              Registrar pago
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── Historial ───────────────────────────────────────────────────── */}
        {view === "historial" && (
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-w-5xl">
            <BreadcrumbNav
              items={[
                { label: "Resumen", onClick: () => setView("dashboard") },
                { label: "Historial de pagos" },
              ]}
            />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Historial de pagos</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Registro de todas las boletas reembolsadas.
              </p>
            </div>

            <Input
              placeholder="Buscar por empleado, tipo o ID..."
              value={search}
              onChange={(e) => { setSearch(e.target.value) }}
              className="h-10"
            />

            {/* Total pagado */}
            <div
              className="flex items-center justify-between px-4 py-3 rounded-lg"
              style={{ background: "oklch(0.93 0.04 195)" }}
            >
              <span className="text-sm font-medium" style={{ color: "oklch(0.35 0.1 195)" }}>
                Total reembolsado
              </span>
              <span className="text-base font-bold" style={{ color: "oklch(0.35 0.1 195)" }}>
                {formatMonto(montoPagado)}
              </span>
            </div>

            <div className="space-y-3">
              {loadingData ? (
                <div className="text-center py-12 text-muted-foreground text-sm">Cargando...</div>
              ) : filteredPagadas.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  {search ? "No se encontraron resultados." : "Aún no hay pagos registrados."}
                </div>
              ) : (
                filteredPagadas.map((boleta) => (
                  <Card key={boleta.id} className="border shadow-none">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5"
                          style={{ background: "oklch(0.52 0.14 195)" }}
                        >
                          {boleta.empleadoNombre.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{boleta.empleadoNombre}</p>
                              <p className="text-xs text-muted-foreground">{boleta.tipo} — <span className="font-mono">{boleta.id}</span></p>
                            </div>
                            <p className="text-base font-bold text-foreground shrink-0">{formatMonto(boleta.monto)}</p>
                          </div>
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <StatusBadge status="pagada" size="sm" />
                            {boleta.fechaPago && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <CheckCircle className="w-3 h-3" />
                                Pagado el {formatFecha(boleta.fechaPago)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Comprobante adjunto */}
                      {boleta.comprobanteUrl && (
                        <a
                          href={`${process.env.NEXT_PUBLIC_API_URL}${boleta.comprobanteUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors hover:opacity-80"
                          style={{
                            borderColor: "oklch(0.80 0.06 195)",
                            background: "oklch(0.93 0.04 195)",
                            color: "oklch(0.35 0.1 195)",
                          }}
                        >
                          <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate flex-1">Ver comprobante de transferencia</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* Perfil */}
        {view === "configuracion" && (
          <ConfiguracionPerfil user={user} onBack={() => setView("dashboard")} onUpdate={onUpdate} />
        )}
      </main>

      {/* Modal de pago */}
      {payTarget && (
        <PayModal
          boleta={payTarget}
          onConfirm={handleConfirmPago}
          onClose={() => setPayTarget(null)}
        />
      )}
    </div>
  )
}
