"use client"

import { useState, useEffect } from "react"
import { Eye, EyeOff, User as UserIcon, Lock, Landmark, Save } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import { auth } from "@/lib/api"
import type { ApiUser } from "@/lib/types"
import type { User } from "@/app/page"

interface ConfiguracionPerfilProps {
  user: User
  onBack: () => void
  onUpdate: (updates: { name: string; email: string; avatar: string }) => void
  embedded?: boolean  // true = sin breadcrumb ni título propio (para embeber dentro de otra vista)
}

// ─── Sección genérica con título ──────────────────────────────────────────────

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <Card className="border shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

// ─── Mensaje de feedback inline ───────────────────────────────────────────────

function FeedbackMsg({ msg }: { msg: string }) {
  if (!msg) return null
  const isError = msg.toLowerCase().includes("error") || msg.toLowerCase().includes("incorrecta") || msg.toLowerCase().includes("uso")
  return (
    <p className="text-sm font-medium" style={{ color: isError ? "var(--destructive)" : "oklch(0.58 0.14 162)" }}>
      {msg}
    </p>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ConfiguracionPerfil({ user, onBack, onUpdate, embedded = false }: ConfiguracionPerfilProps) {
  const [apiUser, setApiUser] = useState<ApiUser | null>(null)

  // ── Datos personales ──────────────────────────────────────────────────────
  const [nombres, setNombres] = useState({ primerNombre: "", segundoNombre: "", primerApellido: "", segundoApellido: "", email: "" })
  const [savingNombres, setSavingNombres] = useState(false)
  const [msgNombres, setMsgNombres] = useState("")

  // ── Contraseña ────────────────────────────────────────────────────────────
  const [passStep, setPassStep] = useState<"idle" | "codigo_enviado">("idle")
  const [codigoPass, setCodigoPass] = useState("")
  const [pass, setPass] = useState({ nueva: "", confirmar: "" })
  const [showNueva, setShowNueva] = useState(false)
  const [showConfirmar, setShowConfirmar] = useState(false)
  const [sendingCodigo, setSendingCodigo] = useState(false)
  const [savingPass, setSavingPass] = useState(false)
  const [msgPass, setMsgPass] = useState("")

  // ── Info bancaria ──────────────────────────────────────────────────────────
  const [banco, setBanco] = useState("")
  const [tipoCuenta, setTipoCuenta] = useState<"corriente" | "vista" | "ahorro">("corriente")
  const [numeroCuenta, setNumeroCuenta] = useState("")
  const [savingBanco, setSavingBanco] = useState(false)
  const [msgBanco, setMsgBanco] = useState("")

  useEffect(() => {
    auth.me().then((u) => {
      setApiUser(u)
      setNombres({
        primerNombre:   u.primerNombre   ?? "",
        segundoNombre:  u.segundoNombre  ?? "",
        primerApellido: u.primerApellido ?? "",
        segundoApellido: u.segundoApellido ?? "",
        email: u.email,
      })
      setBanco(u.infoBancaria?.banco ?? "")
      setTipoCuenta(u.infoBancaria?.tipoCuenta ?? "corriente")
      setNumeroCuenta(u.infoBancaria?.numeroCuenta ?? "")
    }).catch(() => {})
  }, [])

  const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/

  // ── Guardar datos personales ───────────────────────────────────────────────
  const handleSaveNombres = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsgNombres("")
    if (!nombres.primerNombre.trim() || !nombres.primerApellido.trim()) {
      setMsgNombres("Error: Primer nombre y primer apellido son obligatorios.")
      return
    }
    if (!emailRegex.test(nombres.email.trim())) {
      setMsgNombres("Error: Ingresa un correo electrónico válido.")
      return
    }
    setSavingNombres(true)
    try {
      const updated = await auth.actualizarPerfil({
        primerNombre:    nombres.primerNombre.trim(),
        segundoNombre:   nombres.segundoNombre.trim() || "",
        primerApellido:  nombres.primerApellido.trim(),
        segundoApellido: nombres.segundoApellido.trim() || "",
        email:           nombres.email.trim(),
      })
      setApiUser(updated as ApiUser)
      onUpdate({ name: (updated as ApiUser).nombre, email: (updated as ApiUser).email, avatar: (updated as ApiUser).avatar })
      setMsgNombres("Datos guardados correctamente.")
    } catch (err) {
      setMsgNombres(`Error: ${err instanceof Error ? err.message : "No se pudo guardar"}`)
    } finally {
      setSavingNombres(false)
      setTimeout(() => setMsgNombres(""), 4000)
    }
  }

  // ── Solicitar código de cambio ─────────────────────────────────────────────
  const handleSolicitarCodigo = async () => {
    setSendingCodigo(true)
    setMsgPass("")
    try {
      const res = await auth.solicitarCodigoCambio()
      setPassStep("codigo_enviado")
      setMsgPass(res.mensaje)
    } catch (err) {
      setMsgPass(`Error: ${err instanceof Error ? err.message : "No se pudo enviar el código"}`)
    } finally {
      setSendingCodigo(false)
    }
  }

  // ── Confirmar cambio de contraseña ─────────────────────────────────────────
  const handleConfirmarCambio = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsgPass("")
    if (pass.nueva.length < 8) {
      setMsgPass("Error: La nueva contraseña debe tener al menos 8 caracteres.")
      return
    }
    if (pass.nueva !== pass.confirmar) {
      setMsgPass("Error: Las contraseñas no coinciden.")
      return
    }
    if (codigoPass.length !== 6) {
      setMsgPass("Error: Ingresa el código de 6 dígitos.")
      return
    }
    setSavingPass(true)
    try {
      await auth.confirmarCambioPassword(codigoPass, pass.nueva)
      setPass({ nueva: "", confirmar: "" })
      setCodigoPass("")
      setPassStep("idle")
      setMsgPass("Contraseña actualizada correctamente.")
    } catch (err) {
      setMsgPass(`Error: ${err instanceof Error ? err.message : "No se pudo actualizar"}`)
    } finally {
      setSavingPass(false)
      setTimeout(() => setMsgPass(""), 5000)
    }
  }

  // ── Guardar info bancaria ──────────────────────────────────────────────────
  const handleSaveBanco = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsgBanco("")
    if (!banco.trim() || !numeroCuenta.trim()) {
      setMsgBanco("Error: Completa todos los campos bancarios.")
      return
    }
    setSavingBanco(true)
    try {
      const updated = await auth.actualizarPerfil({
        infoBancaria: { banco: banco.trim(), tipoCuenta, numeroCuenta: numeroCuenta.trim() },
      })
      setApiUser(updated as ApiUser)
      setMsgBanco("Información bancaria guardada.")
    } catch (err) {
      setMsgBanco(`Error: ${err instanceof Error ? err.message : "No se pudo guardar"}`)
    } finally {
      setSavingBanco(false)
      setTimeout(() => setMsgBanco(""), 4000)
    }
  }

  const passStrength = (): { label: string; color: string; width: string } => {
    if (!pass.nueva) return { label: "", color: "transparent", width: "0%" }
    if (pass.nueva.length < 8)  return { label: "Muy corta", color: "oklch(0.55 0.22 27)", width: "25%" }
    if (pass.nueva.length < 12) return { label: "Aceptable", color: "oklch(0.62 0.14 72)", width: "60%" }
    return { label: "Segura", color: "oklch(0.58 0.14 162)", width: "100%" }
  }
  const strength = passStrength()

  return (
    <div className={embedded ? "space-y-5" : "p-4 sm:p-6 space-y-5 max-w-2xl"}>
      {!embedded && (
        <>
          <BreadcrumbNav items={[{ label: "Inicio", onClick: onBack }, { label: "Mi perfil" }]} />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Mi perfil</h1>
            <p className="text-muted-foreground text-sm mt-1">Gestiona tus datos personales y preferencias de cuenta.</p>
          </div>
        </>
      )}

      {/* Sección: Datos personales */}
      <Section icon={<UserIcon className="w-4 h-4 text-muted-foreground" />} title="Datos personales">
        {!apiUser ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : (
          <form onSubmit={handleSaveNombres} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Primer nombre <span className="text-destructive">*</span></Label>
                <Input
                  value={nombres.primerNombre}
                  onChange={(e) => setNombres({ ...nombres, primerNombre: e.target.value })}
                  className="h-10"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Segundo nombre <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                <Input
                  value={nombres.segundoNombre}
                  onChange={(e) => setNombres({ ...nombres, segundoNombre: e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Primer apellido <span className="text-destructive">*</span></Label>
                <Input
                  value={nombres.primerApellido}
                  onChange={(e) => setNombres({ ...nombres, primerApellido: e.target.value })}
                  className="h-10"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Segundo apellido <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                <Input
                  value={nombres.segundoApellido}
                  onChange={(e) => setNombres({ ...nombres, segundoApellido: e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-sm font-medium">Correo electrónico <span className="text-destructive">*</span></Label>
                <Input
                  type="text"
                  value={nombres.email}
                  onChange={(e) => setNombres({ ...nombres, email: e.target.value })}
                  className="h-10"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">RUT</Label>
                <Input value={apiUser.rut} disabled className="h-10 opacity-60 cursor-not-allowed" />
                <p className="text-xs text-muted-foreground">El RUT no puede modificarse.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <Button type="submit" className="h-9 font-semibold text-white" style={{ background: "var(--primary)" }} disabled={savingNombres}>
                <Save className="w-4 h-4 mr-1.5" />
                {savingNombres ? "Guardando..." : "Guardar datos"}
              </Button>
              <FeedbackMsg msg={msgNombres} />
            </div>
          </form>
        )}
      </Section>

      {/* Sección: Contraseña */}
      <Section icon={<Lock className="w-4 h-4 text-muted-foreground" />} title="Cambiar contraseña">
        {passStep === "idle" ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Para cambiar tu contraseña, primero enviaremos un código de verificación a tu correo registrado.
            </p>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                onClick={handleSolicitarCodigo}
                disabled={sendingCodigo}
                className="h-9 font-semibold text-white"
                style={{ background: "var(--primary)" }}
              >
                {sendingCodigo ? "Enviando..." : "Enviar código al correo"}
              </Button>
              <FeedbackMsg msg={msgPass} />
            </div>
          </div>
        ) : (
          <form onSubmit={handleConfirmarCambio} className="space-y-4">
            <div
              className="flex items-start gap-2 text-sm p-3 rounded-lg"
              style={{ background: "oklch(0.95 0.04 162 / 0.3)", color: "oklch(0.38 0.12 162)" }}
            >
              <span className="shrink-0 mt-0.5">✓</span>
              <span>Código enviado a tu correo. Revisa tu bandeja de entrada (y spam). Válido por 15 minutos.</span>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Código de verificación <span className="text-destructive">*</span></Label>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={codigoPass}
                onChange={(e) => setCodigoPass(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="h-10 font-mono tracking-widest text-center text-lg w-40"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Nueva contraseña <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Input
                    type={showNueva ? "text" : "password"}
                    value={pass.nueva}
                    onChange={(e) => setPass({ ...pass, nueva: e.target.value })}
                    className="h-10 pr-10"
                    autoComplete="new-password"
                    placeholder="Mínimo 8 caracteres"
                    required
                  />
                  <button type="button" onClick={() => setShowNueva(!showNueva)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showNueva ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pass.nueva && (
                  <div className="space-y-0.5">
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: strength.width, background: strength.color }} />
                    </div>
                    <p className="text-xs" style={{ color: strength.color }}>{strength.label}</p>
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Confirmar contraseña <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Input
                    type={showConfirmar ? "text" : "password"}
                    value={pass.confirmar}
                    onChange={(e) => setPass({ ...pass, confirmar: e.target.value })}
                    className={`h-10 pr-10 ${pass.confirmar && pass.confirmar !== pass.nueva ? "border-destructive" : ""}`}
                    autoComplete="new-password"
                    required
                  />
                  <button type="button" onClick={() => setShowConfirmar(!showConfirmar)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showConfirmar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pass.confirmar && pass.confirmar !== pass.nueva && (
                  <p className="text-xs text-destructive">Las contraseñas no coinciden.</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1 flex-wrap">
              <Button type="submit" className="h-9 font-semibold text-white" style={{ background: "var(--primary)" }} disabled={savingPass}>
                <Save className="w-4 h-4 mr-1.5" />
                {savingPass ? "Verificando..." : "Cambiar contraseña"}
              </Button>
              <button type="button" onClick={() => { setPassStep("idle"); setMsgPass(""); setCodigoPass(""); setPass({ nueva: "", confirmar: "" }) }} className="text-sm text-muted-foreground hover:text-foreground underline">
                Cancelar
              </button>
              <FeedbackMsg msg={msgPass} />
            </div>
          </form>
        )}
      </Section>

      {/* Sección: Info bancaria */}
      <Section icon={<Landmark className="w-4 h-4 text-muted-foreground" />} title="Información bancaria">
        <form onSubmit={handleSaveBanco} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Banco</Label>
              <Input placeholder="Ej: Banco de Chile" value={banco} onChange={(e) => setBanco(e.target.value)} className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Tipo de cuenta</Label>
              <select
                className="w-full h-10 px-3 rounded-lg border text-sm bg-background text-foreground"
                style={{ borderColor: "var(--border)" }}
                value={tipoCuenta}
                onChange={(e) => setTipoCuenta(e.target.value as any)}
              >
                <option value="corriente">Cuenta Corriente</option>
                <option value="vista">Cuenta Vista</option>
                <option value="ahorro">Cuenta de Ahorro</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Número de cuenta</Label>
              <Input placeholder="Ej: 00123456789" value={numeroCuenta} onChange={(e) => setNumeroCuenta(e.target.value)} className="h-10" />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <Button type="submit" className="h-9 font-semibold text-white" style={{ background: "var(--primary)" }} disabled={savingBanco}>
              <Save className="w-4 h-4 mr-1.5" />
              {savingBanco ? "Guardando..." : "Guardar datos bancarios"}
            </Button>
            <FeedbackMsg msg={msgBanco} />
          </div>
        </form>
      </Section>
    </div>
  )
}
