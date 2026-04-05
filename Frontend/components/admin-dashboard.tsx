"use client"

import { useState, useEffect, useCallback } from "react"
import {
  LayoutDashboard,
  Users,
  FileText,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Trash2,
  UserPlus,
  ChevronDown,
  DollarSign,
  Menu,
  Settings,
  Mail,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import AppSidebar from "@/components/app-sidebar"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import StatusBadge from "@/components/status-badge"
import { formatMonto, formatFecha, type Boleta, type BoletaStatus } from "@/lib/mock-data"
import { boletasApi, usersApi, configApi, normalizeBoleta } from "@/lib/api"
import { formatRutInput, isValidRut } from "@/lib/rut"
import type { ApiUser, ApiStats, NotificacionesConfig } from "@/lib/types"
import type { User } from "@/app/page"
import ConfiguracionPerfil from "@/components/configuracion-perfil"
import { useBoletasSync } from "@/hooks/useBoletasSync"

type View = "dashboard" | "boletas" | "usuarios" | "configuracion"

const roleColors: Record<ApiUser["rol"], string> = {
  empleado: "oklch(0.58 0.14 162)",
  auditor: "oklch(0.62 0.14 72)",
  gestor: "oklch(0.52 0.18 290)",
  administrador: "oklch(0.28 0.1 243)",
}

const roleLabels: Record<ApiUser["rol"], string> = {
  empleado: "Empleado",
  auditor: "Auditor",
  gestor: "Gestor",
  administrador: "Admin",
}

interface AdminDashboardProps {
  user: User
  onLogout: () => void
  onUpdate: (updates: { name: string; email: string; avatar: string }) => void
}

export default function AdminDashboard({ user, onLogout, onUpdate }: AdminDashboardProps) {
  const [view, setView] = useState<View>("dashboard")
  const [boletas, setBoletas] = useState<Boleta[]>([])
  const [apiUsers, setApiUsers] = useState<ApiUser[]>([])
  const [stats, setStats] = useState<ApiStats | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [searchBoletas, setSearchBoletas] = useState("")
  const [searchUsers, setSearchUsers] = useState("")
  const [filterStatus, setFilterStatus] = useState<BoletaStatus | "todas">("todas")
  const [showNewUser, setShowNewUser] = useState(false)
  const [newUser, setNewUser] = useState({
    primerNombre: "",
    segundoNombre: "",
    primerApellido: "",
    segundoApellido: "",
    rut: "",
    email: "",
    rol: "empleado" as ApiUser["rol"],
    showBancaria: false,
    banco: "",
    tipoCuenta: "corriente" as "corriente" | "vista" | "ahorro",
    numeroCuenta: "",
  })
  const [emailError, setEmailError] = useState("")
  const [rutError, setRutError] = useState("")
  const [savingUser, setSavingUser] = useState(false)
  const [userError, setUserError] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notifConfig, setNotifConfig] = useState<NotificacionesConfig | null>(null)
  const [savingNotif, setSavingNotif] = useState(false)
  const [notifMsg, setNotifMsg] = useState("")

  const loadNotifConfig = useCallback(async () => {
    try {
      const cfg = await configApi.getNotificaciones()
      setNotifConfig(cfg)
    } catch {
      // silencioso — no rompe el dashboard
    }
  }, [])

  const handleSaveNotif = async () => {
    if (!notifConfig) return
    setSavingNotif(true)
    setNotifMsg("")
    try {
      await configApi.updateNotificaciones(notifConfig)
      setNotifMsg("Configuración guardada correctamente.")
    } catch {
      setNotifMsg("Error al guardar. Inténtalo de nuevo.")
    } finally {
      setSavingNotif(false)
      setTimeout(() => setNotifMsg(""), 3000)
    }
  }

  const loadData = useCallback(async () => {
    setLoadingData(true)
    try {
      const [boletasResult, usersResult, statsResult] = await Promise.allSettled([
        boletasApi.list({ limit: "200" }),
        usersApi.list({ limit: "100" }),
        boletasApi.stats(),
      ])
      if (boletasResult.status === "fulfilled") {
        setBoletas(boletasResult.value.items.map(normalizeBoleta))
      } else {
        console.error("Error cargando boletas:", boletasResult.reason)
      }
      if (usersResult.status === "fulfilled") {
        setApiUsers(usersResult.value.items)
      } else {
        console.error("Error cargando usuarios:", usersResult.reason)
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

  useEffect(() => {
    loadData()
    loadNotifConfig()
  }, [loadData, loadNotifConfig])

  // Actualización en tiempo real: re-fetcha cuando el backend emite un evento
  useBoletasSync(loadData)

  const displayStats = {
    totalBoletas: stats?.total ?? boletas.length,
    pendientes: (stats?.pendiente ?? 0) + (stats?.en_revision ?? 0),
    aprobadas: stats?.aprobada ?? 0,
    rechazadas: stats?.rechazada ?? 0,
    montoAprobado: stats?.montoAprobado ?? 0,
    montoPendiente: boletas
      .filter((b) => b.estado === "pendiente" || b.estado === "en_revision")
      .reduce((s, b) => s + b.monto, 0),
  }

  const filteredBoletas = boletas.filter((b) => {
    const matchSearch =
      b.tipo.toLowerCase().includes(searchBoletas.toLowerCase()) ||
      b.id.toLowerCase().includes(searchBoletas.toLowerCase()) ||
      b.empleadoNombre.toLowerCase().includes(searchBoletas.toLowerCase())
    const matchStatus = filterStatus === "todas" || b.estado === filterStatus
    return matchSearch && matchStatus
  })

  const filteredUsers = apiUsers.filter(
    (u) =>
      u.nombre.toLowerCase().includes(searchUsers.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUsers.toLowerCase())
  )

  const validarEmail = (email: string): boolean => {
    const re = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/
    return re.test(email.trim())
  }

  const resetNewUser = () => {
    setNewUser({
      primerNombre: "", segundoNombre: "", primerApellido: "", segundoApellido: "",
      rut: "", email: "", rol: "empleado", showBancaria: false,
      banco: "", tipoCuenta: "corriente", numeroCuenta: "",
    })
    setEmailError("")
    setRutError("")
    setUserError("")
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError("")
    setRutError("")
    setUserError("")

    if (!validarEmail(newUser.email)) {
      setEmailError("Ingresa un correo electrónico válido.")
      return
    }
    if (!isValidRut(newUser.rut)) {
      setRutError("RUT inválido")
      return
    }

    setSavingUser(true)
    try {
      const infoBancaria =
        newUser.showBancaria && newUser.banco && newUser.numeroCuenta
          ? { banco: newUser.banco, tipoCuenta: newUser.tipoCuenta, numeroCuenta: newUser.numeroCuenta }
          : undefined

      await usersApi.create({
        primerNombre:   newUser.primerNombre,
        segundoNombre:  newUser.segundoNombre || undefined,
        primerApellido: newUser.primerApellido,
        segundoApellido: newUser.segundoApellido || undefined,
        rut:   newUser.rut,
        email: newUser.email,
        rol:   newUser.rol,
        infoBancaria,
      })
      await loadData()
      resetNewUser()
      setShowNewUser(false)
    } catch (err) {
      setUserError(err instanceof Error ? err.message : "Error al crear usuario")
    } finally {
      setSavingUser(false)
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm("¿Eliminar este usuario?")) return
    try {
      await usersApi.delete(id)
      setApiUsers((prev) => prev.filter((u) => u._id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al eliminar")
    }
  }

  const handleToggleUser = async (id: string) => {
    try {
      await usersApi.toggleStatus(id)
      setApiUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, activo: !u.activo } : u))
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al cambiar estado")
    }
  }

  const navItems = [
    {
      icon: <LayoutDashboard className="w-4 h-4" />,
      label: "Resumen general",
      active: view === "dashboard",
      onClick: () => setView("dashboard"),
    },
    {
      icon: <FileText className="w-4 h-4" />,
      label: "Todas las boletas",
      active: view === "boletas",
      onClick: () => setView("boletas"),
    },
    {
      icon: <Users className="w-4 h-4" />,
      label: "Gestión de usuarios",
      active: view === "usuarios",
      onClick: () => setView("usuarios"),
    },
    {
      icon: <Settings className="w-4 h-4" />,
      label: "Configuración",
      active: view === "configuracion",
      onClick: () => setView("configuracion"),
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
    <div className="flex flex-col md:flex-row h-screen bg-background overflow-hidden">
      {/* Mobile top header */}
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
        roleLabel="Administrador"
        roleColor="oklch(0.28 0.1 243)"
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <main className="flex-1 overflow-y-auto">
        {/* Dashboard */}
        {view === "dashboard" && (
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-6xl">
            <BreadcrumbNav items={[{ label: "Resumen general" }]} />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Panel de administración</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Vista global del sistema de gestión de boletas.
              </p>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: "Total boletas", value: displayStats.totalBoletas, icon: <FileText className="w-4 h-4 sm:w-5 sm:h-5" />, color: "var(--primary)", bg: "oklch(0.94 0.03 240)" },
                { label: "Por resolver", value: displayStats.pendientes, icon: <Clock className="w-4 h-4 sm:w-5 sm:h-5" />, color: "oklch(0.62 0.14 72)", bg: "oklch(0.97 0.03 72)" },
                { label: "Aprobadas", value: displayStats.aprobadas, icon: <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />, color: "oklch(0.58 0.14 162)", bg: "oklch(0.95 0.04 162)" },
                { label: "Rechazadas", value: displayStats.rechazadas, icon: <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />, color: "oklch(0.55 0.22 27)", bg: "oklch(0.97 0.02 27)" },
              ].map((s) => (
                <Card key={s.label} className="border shadow-none">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <span className="text-xs font-medium text-muted-foreground leading-tight">{s.label}</span>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: s.bg }}>
                        <span style={{ color: s.color }}>{s.icon}</span>
                      </div>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">
                      {loadingData ? "—" : s.value}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Financial summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Card className="border shadow-none" style={{ background: "var(--primary)" }}>
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-white/70">Monto total aprobado</p>
                    <DollarSign className="w-5 h-5 text-white/30" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-white">
                    {loadingData ? "—" : formatMonto(displayStats.montoAprobado)}
                  </p>
                  <p className="text-xs text-white/50 mt-1">{displayStats.aprobadas} boletas aprobadas</p>
                </CardContent>
              </Card>
              <Card className="border shadow-none" style={{ background: "oklch(0.97 0.03 72)" }}>
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium" style={{ color: "oklch(0.45 0.1 72)" }}>Monto pendiente</p>
                    <TrendingUp className="w-5 h-5" style={{ color: "oklch(0.62 0.14 72)" }} />
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold" style={{ color: "oklch(0.32 0.12 72)" }}>
                    {loadingData ? "—" : formatMonto(displayStats.montoPendiente)}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "oklch(0.55 0.1 72)" }}>{displayStats.pendientes} boletas en espera</p>
                </CardContent>
              </Card>
            </div>

            {/* User summary */}
            <Card className="border shadow-none">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  Usuarios registrados
                </CardTitle>
                <button
                  className="text-xs font-medium flex items-center gap-1"
                  style={{ color: "var(--accent)" }}
                  onClick={() => setView("usuarios")}
                >
                  Gestionar <ChevronDown className="w-3 h-3 rotate-[-90deg]" />
                </button>
              </CardHeader>
              <CardContent className="p-0">
                {loadingData ? (
                  <div className="px-5 py-6 text-center text-sm text-muted-foreground">Cargando...</div>
                ) : (
                  <div className="divide-y divide-border">
                    {apiUsers.slice(0, 5).map((u) => (
                      <div key={u._id} className="flex items-center gap-3 px-4 sm:px-5 py-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ background: roleColors[u.rol] }}
                        >
                          {u.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{u.nombre}</p>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        </div>
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white shrink-0"
                          style={{ background: roleColors[u.rol] }}
                        >
                          {roleLabels[u.rol]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Boletas view */}
        {view === "boletas" && (
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-w-6xl">
            <BreadcrumbNav
              items={[
                { label: "Resumen general", onClick: () => setView("dashboard") },
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
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por empleado, tipo o ID..."
                  value={searchBoletas}
                  onChange={(e) => setSearchBoletas(e.target.value)}
                  className="pl-9 h-10"
                />
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
                    {loadingData ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground text-sm">Cargando...</td>
                      </tr>
                    ) : filteredBoletas.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground text-sm">
                          No se encontraron boletas.
                        </td>
                      </tr>
                    ) : (
                      filteredBoletas.map((b) => (
                        <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground hidden sm:table-cell">{b.id}</td>
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
          </div>
        )}

        {/* Usuarios view */}
        {view === "usuarios" && (
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-w-4xl">
            <BreadcrumbNav
              items={[
                { label: "Resumen general", onClick: () => setView("dashboard") },
                { label: "Gestión de usuarios" },
              ]}
            />
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Gestión de usuarios</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Administra los accesos y roles de todos los usuarios.
                </p>
              </div>
              <Button
                className="h-9 font-semibold text-white shrink-0"
                style={{ background: "var(--primary)" }}
                onClick={() => { setShowNewUser(!showNewUser); setUserError("") }}
              >
                <UserPlus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Nuevo usuario</span>
              </Button>
            </div>

            {showNewUser && (
              <Card className="border shadow-none" style={{ borderColor: "var(--accent)" }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Crear nuevo usuario</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddUser} className="space-y-5">

                    {/* Nombres */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Datos personales</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-sm font-medium">Primer nombre <span className="text-destructive">*</span></Label>
                          <Input
                            placeholder="Ej: Juan"
                            value={newUser.primerNombre}
                            onChange={(e) => setNewUser({ ...newUser, primerNombre: e.target.value })}
                            required
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-sm font-medium">Segundo nombre <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                          <Input
                            placeholder="Ej: Andrés"
                            value={newUser.segundoNombre}
                            onChange={(e) => setNewUser({ ...newUser, segundoNombre: e.target.value })}
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-sm font-medium">Primer apellido <span className="text-destructive">*</span></Label>
                          <Input
                            placeholder="Ej: Pérez"
                            value={newUser.primerApellido}
                            onChange={(e) => setNewUser({ ...newUser, primerApellido: e.target.value })}
                            required
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-sm font-medium">Segundo apellido <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                          <Input
                            placeholder="Ej: González"
                            value={newUser.segundoApellido}
                            onChange={(e) => setNewUser({ ...newUser, segundoApellido: e.target.value })}
                            className="h-10"
                          />
                        </div>
                      </div>
                    </div>

                    {/* RUT + Email + Rol */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium">RUT <span className="text-destructive">*</span></Label>
                        <Input
                          placeholder="12.345.678-9"
                          value={newUser.rut}
                          onChange={(e) => {
                            const formatted = formatRutInput(e.target.value)
                            const valid = formatted ? isValidRut(formatted) : true
                            setNewUser({ ...newUser, rut: formatted })
                            setRutError(formatted && !valid ? "RUT inválido" : "")
                          }}
                          required
                          className={`h-10 ${rutError ? "border-destructive" : newUser.rut && isValidRut(newUser.rut) ? "border-green-500" : ""}`}
                        />
                        {rutError
                          ? <p className="text-xs text-destructive">{rutError}</p>
                          : newUser.rut && isValidRut(newUser.rut) && (
                            <p className="text-xs text-green-600">RUT válido</p>
                          )
                        }
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium">Correo electrónico <span className="text-destructive">*</span></Label>
                        <Input
                          type="text"
                          placeholder="usuario@empresa.com"
                          value={newUser.email}
                          onChange={(e) => { setNewUser({ ...newUser, email: e.target.value }); setEmailError("") }}
                          onBlur={() => {
                            if (newUser.email && !validarEmail(newUser.email)) {
                              setEmailError("Ingresa un correo electrónico válido.")
                            }
                          }}
                          required
                          className={`h-10 ${emailError ? "border-destructive" : ""}`}
                        />
                        {emailError && <p className="text-xs text-destructive">{emailError}</p>}
                      </div>
                      <div className="space-y-1.5 sm:col-span-2 sm:max-w-[calc(50%-8px)]">
                        <Label className="text-sm font-medium">Rol <span className="text-destructive">*</span></Label>
                        <select
                          className="w-full h-10 px-3 rounded-lg border text-sm bg-background text-foreground"
                          style={{ borderColor: "var(--border)" }}
                          value={newUser.rol}
                          onChange={(e) => setNewUser({ ...newUser, rol: e.target.value as ApiUser["rol"] })}
                        >
                          <option value="empleado">Empleado</option>
                          <option value="auditor">Auditor</option>
                          <option value="gestor">Gestor</option>
                          <option value="administrador">Administrador</option>
                        </select>
                      </div>
                    </div>

                    {/* Info bancaria (opcional) */}
                    <div>
                      <button
                        type="button"
                        className="flex items-center gap-2 text-sm font-medium"
                        style={{ color: "var(--accent)" }}
                        onClick={() => setNewUser({ ...newUser, showBancaria: !newUser.showBancaria })}
                      >
                        <ChevronDown
                          className="w-4 h-4 transition-transform"
                          style={{ transform: newUser.showBancaria ? "rotate(180deg)" : "rotate(0deg)" }}
                        />
                        {newUser.showBancaria ? "Ocultar" : "Agregar"} información bancaria (opcional)
                      </button>

                      {newUser.showBancaria && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium">Banco</Label>
                            <Input
                              placeholder="Ej: Banco de Chile"
                              value={newUser.banco}
                              onChange={(e) => setNewUser({ ...newUser, banco: e.target.value })}
                              className="h-10"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium">Tipo de cuenta</Label>
                            <select
                              className="w-full h-10 px-3 rounded-lg border text-sm bg-background text-foreground"
                              style={{ borderColor: "var(--border)" }}
                              value={newUser.tipoCuenta}
                              onChange={(e) => setNewUser({ ...newUser, tipoCuenta: e.target.value as any })}
                            >
                              <option value="corriente">Cuenta Corriente</option>
                              <option value="vista">Cuenta Vista</option>
                              <option value="ahorro">Cuenta de Ahorro</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium">Número de cuenta</Label>
                            <Input
                              placeholder="Ej: 00123456789"
                              value={newUser.numeroCuenta}
                              onChange={(e) => setNewUser({ ...newUser, numeroCuenta: e.target.value })}
                              className="h-10"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      La contraseña se genera automáticamente y se envía al correo del usuario.
                    </p>

                    {userError && <p className="text-sm text-destructive">{userError}</p>}
                    <div className="flex gap-3">
                      <Button
                        type="submit"
                        className="h-10 font-semibold text-white"
                        style={{ background: "var(--primary)" }}
                        disabled={savingUser}
                      >
                        {savingUser ? "Creando..." : "Crear usuario"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10"
                        onClick={() => { resetNewUser(); setShowNewUser(false) }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuario por nombre o correo..."
                value={searchUsers}
                onChange={(e) => setSearchUsers(e.target.value)}
                className="pl-9 h-10"
              />
            </div>

            <Card className="border shadow-none overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "var(--secondary)", borderBottom: "1px solid var(--border)" }}>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Usuario</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Correo</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rol</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Boletas</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Estado</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Acc.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loadingData ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground text-sm">Cargando...</td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground text-sm">
                          No se encontraron usuarios.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u._id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                                style={{ background: roleColors[u.rol] }}
                              >
                                {u.avatar}
                              </div>
                              <span className="font-medium text-foreground truncate max-w-[100px] sm:max-w-none">{u.primerNombre} {u.primerApellido}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell">{u.email}</td>
                          <td className="px-4 py-3">
                            <span
                              className="text-[10px] font-semibold px-2 py-1 rounded-full text-white"
                              style={{ background: roleColors[u.rol] }}
                            >
                              {roleLabels[u.rol]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-foreground hidden sm:table-cell">{u.totalBoletas ?? 0}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleToggleUser(u._id)}
                              className="text-xs font-medium px-2 py-0.5 rounded-full transition-opacity hover:opacity-70 whitespace-nowrap"
                              style={
                                u.activo
                                  ? { background: "oklch(0.95 0.04 145)", color: "oklch(0.38 0.12 145)" }
                                  : { background: "oklch(0.97 0.02 27)", color: "oklch(0.45 0.18 27)" }
                              }
                              title="Click para cambiar estado"
                            >
                              {u.activo ? "Activo" : "Inactivo"}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                className="p-1.5 rounded-md transition-colors hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteUser(u._id)}
                                aria-label="Eliminar usuario"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
        {/* Configuración view */}
        {view === "configuracion" && (
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-w-2xl">
            <BreadcrumbNav
              items={[
                { label: "Resumen general", onClick: () => setView("dashboard") },
                { label: "Configuración" },
              ]}
            />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Configuración</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Gestiona tu perfil y las preferencias de notificaciones.
              </p>
            </div>

            {/* Datos de perfil */}
            <ConfiguracionPerfil user={user} onBack={() => setView("dashboard")} onUpdate={onUpdate} embedded />

            <Card className="border shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Notificaciones por email
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {notifConfig === null ? (
                  <p className="text-sm text-muted-foreground">Cargando configuración...</p>
                ) : (
                  <>
                    {(
                      [
                        { key: "creacion",   label: "Boleta creada",   desc: "Recibir aviso cuando un empleado crea una nueva boleta." },
                        { key: "aprobacion", label: "Boleta aprobada", desc: "Recibir aviso cuando un auditor aprueba una boleta." },
                        { key: "rechazo",    label: "Boleta rechazada", desc: "Recibir aviso cuando un auditor rechaza una boleta." },
                        { key: "atraso",     label: "Atraso en revisión", desc: "Recibir recordatorios de boletas sin resolver (avisos 1 y 2). El tercer aviso siempre se envía." },
                      ] as { key: keyof NotificacionesConfig; label: string; desc: string }[]
                    ).map(({ key, label, desc }) => (
                      <div key={key} className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                        </div>
                        <button
                          role="switch"
                          aria-checked={notifConfig[key]}
                          onClick={() =>
                            setNotifConfig((prev) => prev ? { ...prev, [key]: !prev[key] } : prev)
                          }
                          className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none"
                          style={{
                            background: notifConfig[key] ? "var(--primary)" : "oklch(0.82 0.01 240)",
                          }}
                        >
                          <span
                            className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform"
                            style={{ transform: notifConfig[key] ? "translateX(20px)" : "translateX(0px)" }}
                          />
                        </button>
                      </div>
                    ))}

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={handleSaveNotif}
                        disabled={savingNotif}
                        className="h-9 px-4 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-60"
                        style={{ background: "var(--primary)" }}
                      >
                        {savingNotif ? "Guardando..." : "Guardar cambios"}
                      </button>
                      {notifMsg && (
                        <span
                          className="text-sm font-medium"
                          style={{ color: notifMsg.startsWith("Error") ? "var(--destructive)" : "oklch(0.58 0.14 162)" }}
                        >
                          {notifMsg}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
