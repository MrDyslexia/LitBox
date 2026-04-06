"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, UserPlus, ChevronDown, Trash2, Eye, X, Landmark, Mail, Hash, Calendar, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import { usersApi } from "@/lib/api"
import { formatRutInput, isValidRut } from "@/lib/rut"
import type { ApiUser } from "@/lib/types"
import Pagination from "@/components/pagination"

const PAGE_SIZE = 20

const BANCOS_CHILE = [
  "Banco de Chile",
  "Banco Santander Chile",
  "Banco BCI",
  "BancoEstado",
  "Banco Itaú Chile",
  "Banco BICE",
  "Banco Security",
  "Banco Scotiabank Chile",
  "Banco Internacional",
  "Banco Consorcio",
  "Banco Ripley",
  "Banco Falabella",
  "HSBC Bank Chile",
  "Banco BTG Pactual Chile",
  "Coopeuch",
  "Mercado Pago",
  "Tenpo",
  "MACH",
  "Prepago Los Héroes",
  "Tapp",
]

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

interface NewUserForm {
  primerNombre: string
  segundoNombre: string
  primerApellido: string
  segundoApellido: string
  rut: string
  email: string
  rol: ApiUser["rol"]
  showBancaria: boolean
  banco: string
  tipoCuenta: "corriente" | "vista" | "ahorro"
  numeroCuenta: string
}

const DEFAULT_NEW_USER: NewUserForm = {
  primerNombre: "",
  segundoNombre: "",
  primerApellido: "",
  segundoApellido: "",
  rut: "",
  email: "",
  rol: "empleado",
  showBancaria: false,
  banco: "",
  tipoCuenta: "corriente",
  numeroCuenta: "",
}

export default function AdminUsuariosPage() {
  const [apiUsers, setApiUsers] = useState<ApiUser[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [searchUsers, setSearchUsers] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [showNewUser, setShowNewUser] = useState(false)
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null)
  const [newUser, setNewUser] = useState<NewUserForm>({ ...DEFAULT_NEW_USER })
  const [emailError, setEmailError] = useState("")
  const [rutError, setRutError] = useState("")
  const [savingUser, setSavingUser] = useState(false)
  const [userError, setUserError] = useState("")

  // Debounce search 400ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchUsers), 400)
    return () => clearTimeout(t)
  }, [searchUsers])

  // Reset page when search changes
  useEffect(() => { setPage(1) }, [debouncedSearch])

  const loadData = useCallback(async () => {
    setLoadingData(true)
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(PAGE_SIZE),
      }
      if (debouncedSearch) params.buscar = debouncedSearch

      const result = await usersApi.list(params)
      setApiUsers(result.items)
      setTotalPages(result.totalPages || 1)
      setTotal(result.total || 0)
    } catch (err) {
      console.error("Error cargando usuarios:", err)
    } finally {
      setLoadingData(false)
    }
  }, [page, debouncedSearch])

  useEffect(() => { loadData() }, [loadData])

  const validarEmail = (email: string): boolean => {
    const re = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/
    return re.test(email.trim())
  }

  const resetNewUser = () => {
    setNewUser({ ...DEFAULT_NEW_USER })
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
        primerNombre: newUser.primerNombre,
        segundoNombre: newUser.segundoNombre || undefined,
        primerApellido: newUser.primerApellido,
        segundoApellido: newUser.segundoApellido || undefined,
        rut: newUser.rut,
        email: newUser.email,
        rol: newUser.rol,
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

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-w-4xl">
      <BreadcrumbNav
        items={[
          { label: "Resumen general", href: "/administrador" },
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
          onClick={() => {
            setShowNewUser(!showNewUser)
            setUserError("")
          }}
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
                    onChange={(e) => {
                      setNewUser({ ...newUser, email: e.target.value })
                      setEmailError("")
                    }}
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
                      <select
                        className="w-full h-10 px-3 rounded-lg border text-sm bg-background text-foreground"
                        style={{ borderColor: "var(--border)" }}
                        value={newUser.banco}
                        onChange={(e) => setNewUser({ ...newUser, banco: e.target.value })}
                      >
                        <option value="">Seleccionar banco...</option>
                        {BANCOS_CHILE.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Tipo de cuenta</Label>
                      <select
                        className="w-full h-10 px-3 rounded-lg border text-sm bg-background text-foreground"
                        style={{ borderColor: "var(--border)" }}
                        value={newUser.tipoCuenta}
                        onChange={(e) => setNewUser({ ...newUser, tipoCuenta: e.target.value as "corriente" | "vista" | "ahorro" })}
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
                  onClick={() => {
                    resetNewUser()
                    setShowNewUser(false)
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuario por nombre o correo..."
            value={searchUsers}
            onChange={(e) => setSearchUsers(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        {total > 0 && !loadingData && (
          <p className="text-xs text-muted-foreground">{total} resultado(s)</p>
        )}
      </div>

      {/* Modal detalles de usuario */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedUser(null)} aria-hidden="true" />
          <div className="relative z-10 w-full max-w-md bg-background rounded-xl shadow-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ background: "var(--secondary)", borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ background: roleColors[selectedUser.rol] }}
                >
                  {selectedUser.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{selectedUser.nombre}</p>
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white"
                    style={{ background: roleColors[selectedUser.rol] }}
                  >
                    {roleLabels[selectedUser.rol]}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">RUT</p>
                  <div className="flex items-center gap-1.5 text-foreground">
                    <Hash className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    {selectedUser.rut}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Estado</p>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={
                      selectedUser.activo
                        ? { background: "oklch(0.95 0.04 145)", color: "oklch(0.38 0.12 145)" }
                        : { background: "oklch(0.97 0.02 27)", color: "oklch(0.45 0.18 27)" }
                    }
                  >
                    {selectedUser.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Correo</p>
                <div className="flex items-center gap-1.5 text-foreground">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  {selectedUser.email}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Boletas</p>
                  <p className="text-foreground">{selectedUser.totalBoletas ?? 0}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Registro</p>
                  <div className="flex items-center gap-1.5 text-foreground">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    {new Date(selectedUser.fechaCreacion).toLocaleDateString("es-CL")}
                  </div>
                </div>
              </div>
              {selectedUser.ultimoAcceso && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Último acceso</p>
                  <div className="flex items-center gap-1.5 text-foreground">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    {new Date(selectedUser.ultimoAcceso).toLocaleString("es-CL")}
                  </div>
                </div>
              )}
              {selectedUser.infoBancaria ? (
                <div className="pt-2 mt-1 border-t" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    <Landmark className="w-3.5 h-3.5" />
                    Datos bancarios
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground mb-0.5">Banco</p>
                      <p className="font-medium text-foreground">{selectedUser.infoBancaria.banco}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-0.5">Tipo</p>
                      <p className="font-medium text-foreground capitalize">{selectedUser.infoBancaria.tipoCuenta}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-0.5">N° cuenta</p>
                      <p className="font-medium text-foreground">{selectedUser.infoBancaria.numeroCuenta}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pt-2 mt-1 border-t text-xs text-muted-foreground italic" style={{ borderColor: "var(--border)" }}>
                  Sin datos bancarios registrados.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
              ) : apiUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                apiUsers.map((u) => (
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
                          className="p-1.5 rounded-md transition-colors hover:bg-accent/10 text-muted-foreground hover:text-accent"
                          onClick={() => setSelectedUser(u)}
                          aria-label="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
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

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
