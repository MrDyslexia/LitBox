"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, Eye, EyeOff, FileText, CheckCircle, ArrowLeft } from "lucide-react"
import { auth } from "@/lib/api"

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<boolean>
}

type Step = "login" | "forgot_email" | "forgot_codigo"

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [step, setStep] = useState<Step>("login")

  // ── Login ─────────────────────────────────────────────────────────────────
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)

  // ── Olvidé contraseña ─────────────────────────────────────────────────────
  const [forgotEmail, setForgotEmail] = useState("")
  const [sendingCodigo, setSendingCodigo] = useState(false)
  const [forgotMsg, setForgotMsg] = useState("")

  // ── Código + nueva contraseña ─────────────────────────────────────────────
  const [codigo, setCodigo] = useState("")
  const [newPass, setNewPass] = useState("")
  const [confirmPass, setConfirmPass] = useState("")
  const [showNewPass, setShowNewPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [savingPass, setSavingPass] = useState(false)
  const [recoverMsg, setRecoverMsg] = useState("")
  const [recoverSuccess, setRecoverSuccess] = useState(false)

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")
    setLoginLoading(true)
    const ok = await onLogin(email, password)
    if (!ok) setLoginError("Correo o contraseña incorrectos.")
    setLoginLoading(false)
  }

  const handleSolicitarCodigo = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotMsg("")
    setSendingCodigo(true)
    try {
      const res = await auth.solicitarRecuperacion(forgotEmail)
      setForgotMsg(res.mensaje)
      setStep("forgot_codigo")
    } catch {
      setForgotMsg("Error al enviar el código. Inténtalo de nuevo.")
    } finally {
      setSendingCodigo(false)
    }
  }

  const handleRecuperar = async (e: React.FormEvent) => {
    e.preventDefault()
    setRecoverMsg("")
    if (newPass.length < 8) { setRecoverMsg("La contraseña debe tener al menos 8 caracteres."); return }
    if (newPass !== confirmPass) { setRecoverMsg("Las contraseñas no coinciden."); return }
    if (codigo.length !== 6) { setRecoverMsg("Ingresa el código de 6 dígitos."); return }
    setSavingPass(true)
    try {
      await auth.recuperarPassword(forgotEmail, codigo, newPass)
      setRecoverSuccess(true)
    } catch (err) {
      setRecoverMsg(err instanceof Error ? err.message : "Código inválido o expirado.")
    } finally {
      setSavingPass(false)
    }
  }

  const resetForgot = () => {
    setStep("login")
    setForgotEmail("")
    setCodigo("")
    setNewPass("")
    setConfirmPass("")
    setForgotMsg("")
    setRecoverMsg("")
    setRecoverSuccess(false)
  }

  const passStrength = () => {
    if (!newPass) return { label: "", color: "transparent", width: "0%" }
    if (newPass.length < 8)  return { label: "Muy corta", color: "oklch(0.55 0.22 27)", width: "25%" }
    if (newPass.length < 12) return { label: "Aceptable", color: "oklch(0.62 0.14 72)", width: "60%" }
    return { label: "Segura", color: "oklch(0.58 0.14 162)", width: "100%" }
  }
  const strength = passStrength()

  const demoAccounts = [
    { label: "Empleado",       email: "empleado@empresa.com" },
    { label: "Auditor",        email: "auditor@empresa.com" },
    { label: "Gestor",         email: "gestor@empresa.com" },
    { label: "Administrador",  email: "admin@empresa.com" },
  ]

  // ── Left panel (compartido) ───────────────────────────────────────────────

  const LeftPanel = () => (
    <div className="hidden lg:flex flex-col w-[42%] shrink-0" style={{ background: "var(--primary)" }}>
      <div className="flex items-center gap-3 px-10 py-5" style={{ background: "oklch(0.13 0.04 243)", borderBottom: "1px solid oklch(0.22 0.055 243)" }}>
        <div className="w-8 h-8 rounded flex items-center justify-center shrink-0" style={{ background: "var(--accent)" }}>
          <FileText className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-[14px] font-bold text-white tracking-tight leading-none">LitBox</p>
          <p className="text-[9px] font-semibold tracking-widest uppercase mt-0.5" style={{ color: "var(--accent)" }}>Reembolsos</p>
        </div>
      </div>
      <div className="flex flex-col justify-between flex-1 px-10 py-12">
        <div className="space-y-8">
          <div className="inline-block text-[11px] font-semibold tracking-widest uppercase px-3 py-1 rounded" style={{ background: "var(--accent)", color: "white" }}>
            Plataforma corporativa
          </div>
          <h1 className="text-[2.4rem] font-bold leading-tight text-white text-balance">Gestión de boletas de gastos</h1>
          <p className="text-[14px] leading-relaxed" style={{ color: "oklch(0.7 0.03 230)" }}>
            Centraliza, gestiona y haz seguimiento de todos los gastos de tu empresa.
          </p>
          <div className="space-y-3 pt-2">
            {[
              { num: "01", title: "Subida de comprobantes", desc: "Los empleados fotografían y suben sus boletas fácilmente." },
              { num: "02", title: "Auditoría centralizada", desc: "Los auditores revisan, aprueban o rechazan cada solicitud." },
              { num: "03", title: "Control total", desc: "El administrador tiene visibilidad completa del sistema." },
            ].map((item) => (
              <div key={item.num} className="flex gap-4 items-start">
                <span className="text-[11px] font-bold shrink-0 mt-0.5" style={{ color: "var(--accent)" }}>{item.num}</span>
                <div>
                  <p className="text-[13px] font-semibold text-white">{item.title}</p>
                  <p className="text-[12px] mt-0.5" style={{ color: "oklch(0.62 0.02 230)" }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-[11px]" style={{ color: "oklch(0.42 0.02 230)" }}>© {new Date().getFullYear()} LitBox. Todos los derechos reservados.</p>
      </div>
    </div>
  )

  const MobileHeader = () => (
    <div className="flex lg:hidden items-center gap-2.5 px-6 py-4" style={{ background: "var(--primary)", borderBottom: "1px solid oklch(0.22 0.055 243)" }}>
      <div className="w-7 h-7 rounded flex items-center justify-center shrink-0" style={{ background: "var(--accent)" }}>
        <FileText className="w-3.5 h-3.5 text-white" />
      </div>
      <span className="text-[13px] font-bold text-white tracking-tight">LitBox</span>
    </div>
  )

  // ── STEP: login ───────────────────────────────────────────────────────────

  if (step === "login") {
    return (
      <div className="min-h-screen flex font-sans">
        <LeftPanel />
        <div className="flex-1 flex flex-col bg-background">
          <MobileHeader />
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-[380px] space-y-5">
              <div className="space-y-1">
                <h2 className="text-[1.6rem] font-bold text-foreground">Iniciar sesión</h2>
                <p className="text-[13px] text-muted-foreground">Ingresa con tu correo institucional para continuar.</p>
              </div>

              <div className="rounded-md border p-6 space-y-4" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-[13px] font-medium">Correo institucional</Label>
                    <Input id="email" type="email" placeholder="usuario@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-9 text-[13px]" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-[13px] font-medium">Contraseña</Label>
                      <button type="button" onClick={() => { setStep("forgot_email"); setForgotEmail(email) }} className="text-[12px] underline" style={{ color: "var(--accent)" }}>
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                    <div className="relative">
                      <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-9 pr-10 text-[13px]" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  {loginError && (
                    <div className="flex items-center gap-2 text-[12px] p-2.5 rounded" style={{ background: "oklch(0.98 0.015 27)", color: "var(--destructive)", border: "1px solid oklch(0.9 0.06 27)" }}>
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />{loginError}
                    </div>
                  )}
                  <Button type="submit" className="w-full h-9 text-[13px] font-semibold text-white" style={{ background: "var(--primary)" }} disabled={loginLoading}>
                    {loginLoading ? "Ingresando..." : "Ingresar al sistema"}
                  </Button>
                </form>
              </div>

              <div className="rounded-md border p-4 space-y-2.5" style={{ background: "oklch(0.96 0.01 162 / 0.2)", borderColor: "oklch(0.85 0.04 162 / 0.5)" }}>
                <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "oklch(0.45 0.1 162)" }}>
                  Cuentas de demostración — contraseña: demo1234
                </p>
                <div className="flex flex-wrap gap-2">
                  {demoAccounts.map((acc) => (
                    <button key={acc.email} type="button" onClick={() => setEmail(acc.email)}
                      className="text-[12px] px-3 py-1 rounded border font-medium transition-all"
                      style={{ borderColor: "oklch(0.75 0.1 162 / 0.6)", color: "oklch(0.38 0.12 162)", background: "oklch(0.97 0.02 162 / 0.5)" }}>
                      {acc.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── STEP: forgot_email ────────────────────────────────────────────────────

  if (step === "forgot_email") {
    return (
      <div className="min-h-screen flex font-sans">
        <LeftPanel />
        <div className="flex-1 flex flex-col bg-background">
          <MobileHeader />
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-[380px] space-y-5">
              <button onClick={resetForgot} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" /> Volver al inicio de sesión
              </button>
              <div className="space-y-1">
                <h2 className="text-[1.6rem] font-bold text-foreground">Recuperar contraseña</h2>
                <p className="text-[13px] text-muted-foreground">Ingresa tu correo y te enviaremos un código de verificación.</p>
              </div>
              <Card className="border shadow-none">
                <CardContent className="p-6">
                  <form onSubmit={handleSolicitarCodigo} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-[13px] font-medium">Correo institucional</Label>
                      <Input type="email" placeholder="usuario@empresa.com" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required className="h-9 text-[13px]" />
                    </div>
                    {forgotMsg && (
                      <p className="text-xs text-destructive">{forgotMsg}</p>
                    )}
                    <Button type="submit" className="w-full h-9 text-[13px] font-semibold text-white" style={{ background: "var(--primary)" }} disabled={sendingCodigo}>
                      {sendingCodigo ? "Enviando..." : "Enviar código de verificación"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── STEP: forgot_codigo ───────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex font-sans">
      <LeftPanel />
      <div className="flex-1 flex flex-col bg-background">
        <MobileHeader />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-[400px] space-y-5">
            <button onClick={() => setStep("forgot_email")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" /> Cambiar correo
            </button>
            <div className="space-y-1">
              <h2 className="text-[1.6rem] font-bold text-foreground">Nueva contraseña</h2>
              <p className="text-[13px] text-muted-foreground">Ingresa el código enviado a <strong>{forgotEmail}</strong> y elige una nueva contraseña.</p>
            </div>

            {recoverSuccess ? (
              <Card className="border shadow-none">
                <CardContent className="p-8 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto" style={{ background: "oklch(0.95 0.04 145)" }}>
                    <CheckCircle className="w-7 h-7" style={{ color: "oklch(0.56 0.13 145)" }} />
                  </div>
                  <h3 className="text-base font-bold text-foreground">¡Contraseña restablecida!</h3>
                  <p className="text-sm text-muted-foreground">Ya puedes iniciar sesión con tu nueva contraseña.</p>
                  <Button onClick={resetForgot} className="mt-2 text-white font-semibold" style={{ background: "var(--primary)" }}>
                    Ir al inicio de sesión
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border shadow-none">
                <CardContent className="p-6">
                  <form onSubmit={handleRecuperar} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-[13px] font-medium">Código de verificación <span className="text-destructive">*</span></Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="000000"
                        value={codigo}
                        onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="h-10 font-mono tracking-widest text-center text-lg w-40"
                        required
                      />
                      <p className="text-xs text-muted-foreground">El código expira en 15 minutos.</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[13px] font-medium">Nueva contraseña <span className="text-destructive">*</span></Label>
                      <div className="relative">
                        <Input type={showNewPass ? "text" : "password"} placeholder="Mínimo 8 caracteres" value={newPass} onChange={(e) => setNewPass(e.target.value)} className="h-9 pr-10 text-[13px]" autoComplete="new-password" required />
                        <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      {newPass && (
                        <div className="space-y-0.5">
                          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: strength.width, background: strength.color }} />
                          </div>
                          <p className="text-xs" style={{ color: strength.color }}>{strength.label}</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[13px] font-medium">Confirmar contraseña <span className="text-destructive">*</span></Label>
                      <div className="relative">
                        <Input type={showConfirmPass ? "text" : "password"} placeholder="Repite tu contraseña" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} className={`h-9 pr-10 text-[13px] ${confirmPass && confirmPass !== newPass ? "border-destructive" : ""}`} autoComplete="new-password" required />
                        <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showConfirmPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      {confirmPass && confirmPass !== newPass && <p className="text-xs text-destructive">Las contraseñas no coinciden.</p>}
                    </div>
                    {recoverMsg && (
                      <div className="flex items-center gap-2 text-[12px] p-2.5 rounded" style={{ background: "oklch(0.98 0.015 27)", color: "var(--destructive)", border: "1px solid oklch(0.9 0.06 27)" }}>
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />{recoverMsg}
                      </div>
                    )}
                    <Button type="submit" className="w-full h-9 text-[13px] font-semibold text-white" style={{ background: "var(--primary)" }} disabled={savingPass}>
                      {savingPass ? "Verificando..." : "Restablecer contraseña"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
