"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Eye, EyeOff, FileText, CheckCircle, ArrowLeft } from "lucide-react"
import { auth } from "@/lib/api"

// ── Hero slides ───────────────────────────────────────────────────────────────
// Imágenes de Santiago de Chile — Wikimedia Commons (CC) y Unsplash

const SLIDE_DURATION = 7000

const SLIDES = [
  {
    image: "/santiago.jpg",
    imagePosition: "center 30%",
    badge: "Plataforma Corporativa",
    title: ["Gestión de boletas", "centralizada."],
    description: "Centraliza, gestiona y haz seguimiento de todos los gastos corporativos en un solo lugar.",
    items: [
      { num: "01", title: "Subida de comprobantes", desc: "Los empleados fotografían y suben sus boletas fácilmente." },
      { num: "02", title: "Auditoría centralizada", desc: "Los auditores revisan, aprueban o rechazan cada solicitud." },
      { num: "03", title: "Control total", desc: "El administrador tiene visibilidad completa del sistema." },
    ],
  },
  {
    image: "/santiago2.webp",
    imagePosition: "center center",
    badge: "Quiénes somos",
    title: ["Consultoría vial y", "de transporte urbano."],
    description: "Somos un equipo de profesionales con más de 12 años desarrollando proyectos de ingeniería vial, ambiental y transporte urbano en Chile, Perú y Colombia.",
    items: [
      { num: "+500", title: "Proyectos aprobados", desc: "Proyectos urbanos y viales aprobados exitosamente." },
      { num: "+1.000", title: "Estudios de impacto", desc: "Estudios EISTU, IVB e IMIV aprobados ante organismos." },
      { num: "+12", title: "Años de experiencia", desc: "Operando desde 2008 con presencia en 3 países." },
    ],
  },
  {
    image: "/santiago.jpg",
    imagePosition: "center 60%",
    badge: "Nuestra Visión",
    title: ["Ciudades más amables,", "movilidad sustentable."],
    description: "«Soñamos con barrios y comunas más amables, con la infraestructura necesaria para permitir la convivencia vial entre distintos modos de transporte.»",
    items: [
      { num: "01", title: "Área Vial", desc: "Optimización de sistemas de transporte y planes de movilidad urbana." },
      { num: "02", title: "Área Ambiental", desc: "Estudios que resguardan el ciclo de vida y las normativas vigentes." },
      { num: "03", title: "Área Estratégica", desc: "Asesoría IMIV y Ley de Aportes al Espacio Público." },
    ],
  },
]

function HeroPanel() {
  const [current, setCurrent] = useState(0)
  const [fading, setFading] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setProgress(0)
    const start = Date.now()
    const raf = setInterval(() => {
      const elapsed = Date.now() - start
      setProgress(Math.min((elapsed / SLIDE_DURATION) * 100, 100))
    }, 50)
    return () => clearInterval(raf)
  }, [current])

  useEffect(() => {
    const t = setInterval(() => {
      setFading(true)
      setTimeout(() => {
        setCurrent((p) => (p + 1) % SLIDES.length)
        setFading(false)
      }, 500)
    }, SLIDE_DURATION)
    return () => clearInterval(t)
  }, [])

  const goTo = (i: number) => {
    if (i === current || fading) return
    setFading(true)
    setTimeout(() => { setCurrent(i); setFading(false) }, 500)
  }

  const slide = SLIDES[current]

  return (
    <div
      className="hidden xl:flex flex-col w-[45%] shrink-0 relative overflow-hidden"
      style={{ background: "#050c1a" }}
    >
      {/* Background images — crossfade */}
      {SLIDES.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0"
          style={{ opacity: i === current ? 1 : 0, transition: "opacity 800ms ease-in-out" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.image} alt="" draggable={false} className="w-full h-full object-cover select-none" style={{ objectPosition: s.imagePosition }} />
          {/* Left-heavy overlay: dark on left for text, lighter on right to show city */}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(100deg, rgba(5,12,26,0.96) 0%, rgba(6,14,30,0.88) 35%, rgba(8,18,40,0.72) 60%, rgba(10,22,50,0.45) 100%)",
            }}
          />
          {/* Bottom vignette */}
          <div
            className="absolute inset-x-0 bottom-0 h-48 pointer-events-none"
            style={{ background: "linear-gradient(to top, rgba(5,12,26,0.80) 0%, transparent 100%)" }}
          />
        </div>
      ))}

      {/* Accent glow top-right */}
      <div
        className="absolute top-0 right-0 w-80 h-80 pointer-events-none"
        style={{ background: "radial-gradient(circle at 85% 15%, rgba(217,66,20,0.16) 0%, transparent 60%)" }}
      />

      {/* Brand bar */}
      <div
        className="relative z-10 flex items-center justify-between px-10 py-5 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://www.itransporte.cl/wp-content/uploads/2019/11/logo.png"
          alt="ITransporte"
          className="h-7 w-auto"
          style={{ filter: "brightness(0) invert(1)", opacity: 0.92 }}
        />
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
          style={{ background: "rgba(217,66,20,0.13)", borderColor: "rgba(217,66,20,0.32)" }}
        >
          <div className="w-5 h-5 rounded flex items-center justify-center shrink-0" style={{ background: "#D94214" }}>
            <FileText className="w-2.5 h-2.5 text-white" />
          </div>
          <span className="text-white text-[11px] font-semibold tracking-widest uppercase">LitBox</span>
        </div>
      </div>

      {/* Auto-play progress bar */}
      <div className="relative z-10 h-[2px] shrink-0" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div
          className="absolute inset-y-0 left-0"
          style={{
            width: `${progress}%`,
            background: "#D94214",
            transition: "width 50ms linear",
          }}
        />
      </div>

      {/* Animated content */}
      <div className="relative z-10 flex flex-col justify-between flex-1 px-10 py-9 min-h-0">

        {/* Text block */}
        <div
          style={{
            opacity: fading ? 0 : 1,
            transform: fading ? "translateY(12px)" : "translateY(0)",
            transition: "opacity 500ms ease, transform 500ms ease",
          }}
          className="flex flex-col gap-7"
        >
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.14em] uppercase px-3 py-1.5 rounded-full border self-start"
            style={{ background: "rgba(217,66,20,0.12)", borderColor: "rgba(217,66,20,0.35)", color: "#F4A47A" }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#D94214" }} />
            {slide.badge}
          </div>

          {/* Title */}
          <div>
            <h1 className="text-[2.75rem] font-bold leading-[1.12] text-white tracking-tight">
              {slide.title[0]}
            </h1>
            <h1 className="text-[2.75rem] font-bold leading-[1.12] tracking-tight" style={{ color: "#D94214" }}>
              {slide.title[1]}
            </h1>
          </div>

          {/* Description */}
          <p className="text-[14px] leading-[1.65] max-w-[300px]" style={{ color: "rgba(255,255,255,0.55)" }}>
            {slide.description}
          </p>

          {/* Divider */}
          <div className="w-10 h-[2px] rounded-full" style={{ background: "#D94214", opacity: 0.6 }} />

          {/* Items */}
          <div className="flex flex-col">
            {slide.items.map((item, idx) => (
              <div
                key={item.num}
                className="flex items-start gap-5 py-3.5"
                style={{ borderTop: idx > 0 ? "1px solid rgba(255,255,255,0.07)" : "none" }}
              >
                <span
                  className="font-mono font-black text-[11px] shrink-0 mt-0.5 w-10"
                  style={{ color: "#D94214" }}
                >
                  {item.num}
                </span>
                <div>
                  <p className="text-[13.5px] font-semibold leading-tight" style={{ color: "rgba(255,255,255,0.92)" }}>
                    {item.title}
                  </p>
                  <p className="text-[12px] mt-1 leading-snug" style={{ color: "rgba(255,255,255,0.40)" }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 shrink-0">
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.20)" }}>
            © {new Date().getFullYear()} LitBox · ITransporte
          </p>
          <div className="flex gap-2 items-center">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                aria-label={`Slide ${i + 1}`}
                onClick={() => goTo(i)}
                style={{
                  height: 5,
                  borderRadius: 9999,
                  background: i === current ? "#D94214" : "rgba(255,255,255,0.18)",
                  width: i === current ? 24 : 5,
                  transition: "all 400ms ease",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

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


  const MobileHeader = () => (
    <div
      className="flex xl:hidden items-center gap-3 px-5 py-3.5 border-b"
      style={{ background: "#0a1628", borderColor: "rgba(255,255,255,0.07)" }}
    >
      <img
        src="https://www.itransporte.cl/wp-content/uploads/2019/11/logo.png"
        alt="ITransporte"
        className="h-5 w-auto"
        style={{ filter: "brightness(0) invert(1)", opacity: 0.88 }}
      />
      <div className="h-3.5 w-px" style={{ background: "rgba(255,255,255,0.2)" }} />
      <div className="flex items-center gap-1.5">
        <div
          className="w-5 h-5 rounded flex items-center justify-center shrink-0"
          style={{ background: "#D94214" }}
        >
          <FileText className="w-2.5 h-2.5 text-white" />
        </div>
        <span className="text-white text-[12px] font-semibold">LitBox</span>
      </div>
    </div>
  )

  // ── STEP: login ───────────────────────────────────────────────────────────

  if (step === "login") {
    return (
      <div className="min-h-screen flex font-sans">
        <HeroPanel />
        <div className="flex-1 flex flex-col bg-background">
          <MobileHeader />
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-[400px] space-y-8">
              <div className="space-y-1.5">
                <h2 className="text-[1.9rem] font-bold tracking-tight text-foreground">Iniciar sesión</h2>
                <p className="text-[13.5px] text-muted-foreground">
                  Ingresa con tu correo institucional para continuar.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[13px] font-semibold">Correo institucional</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 text-[14px]"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-[13px] font-semibold">Contraseña</Label>
                    <button
                      type="button"
                      onClick={() => { setStep("forgot_email"); setForgotEmail(email) }}
                      className="text-[12px] font-medium transition-colors cursor-pointer hover:underline text-primary"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11 pr-10 text-[14px]"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {loginError && (
                  <div
                    className="flex items-center gap-2.5 text-[13px] px-3.5 py-3 rounded-lg"
                    style={{
                      background: "oklch(0.97 0.015 27)",
                      color: "var(--destructive)",
                      border: "1px solid oklch(0.88 0.06 27)",
                    }}
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />{loginError}
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full h-11 text-[14px] font-semibold cursor-pointer"
                  disabled={loginLoading}
                >
                  {loginLoading ? "Verificando..." : "Ingresar al sistema"}
                </Button>
              </form>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Demo
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="space-y-2.5">
                  <p className="text-[12px] text-muted-foreground text-center">
                    Contraseña:{" "}
                    <code className="font-mono px-1.5 py-0.5 rounded bg-muted text-foreground text-[11px]">
                      demo1234
                    </code>
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {demoAccounts.map((acc) => (
                      <button
                        key={acc.email}
                        type="button"
                        onClick={() => setEmail(acc.email)}
                        className="text-[12px] px-3 py-2.5 rounded-lg border font-medium transition-all cursor-pointer text-left hover:border-primary hover:text-primary border-border text-muted-foreground"
                      >
                        {acc.label}
                      </button>
                    ))}
                  </div>
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
        <HeroPanel />
        <div className="flex-1 flex flex-col bg-background">
          <MobileHeader />
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-[400px] space-y-8">
              <button
                onClick={resetForgot}
                className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Volver al inicio de sesión
              </button>
              <div className="space-y-1.5">
                <h2 className="text-[1.9rem] font-bold tracking-tight text-foreground">Recuperar contraseña</h2>
                <p className="text-[13.5px] text-muted-foreground">
                  Ingresa tu correo y te enviaremos un código de verificación.
                </p>
              </div>
              <form onSubmit={handleSolicitarCodigo} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-[13px] font-semibold">Correo institucional</Label>
                  <Input
                    type="email"
                    placeholder="usuario@empresa.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    className="h-11 text-[14px]"
                  />
                </div>
                {forgotMsg && <p className="text-[13px] text-destructive">{forgotMsg}</p>}
                <Button
                  type="submit"
                  className="w-full h-11 text-[14px] font-semibold cursor-pointer"
                  disabled={sendingCodigo}
                >
                  {sendingCodigo ? "Enviando..." : "Enviar código de verificación"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── STEP: forgot_codigo ───────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex font-sans">
      <HeroPanel />
      <div className="flex-1 flex flex-col bg-background">
        <MobileHeader />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-[420px] space-y-8">
            <button
              onClick={() => setStep("forgot_email")}
              className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Cambiar correo
            </button>
            <div className="space-y-1.5">
              <h2 className="text-[1.9rem] font-bold tracking-tight text-foreground">Nueva contraseña</h2>
              <p className="text-[13.5px] text-muted-foreground">
                Código enviado a <strong className="text-foreground">{forgotEmail}</strong>. Elige una nueva contraseña.
              </p>
            </div>

            {recoverSuccess ? (
              <div className="text-center space-y-5 py-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                  style={{ background: "oklch(0.95 0.04 145)" }}
                >
                  <CheckCircle className="w-8 h-8" style={{ color: "oklch(0.56 0.13 145)" }} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-[1.1rem] font-bold text-foreground">¡Contraseña restablecida!</h3>
                  <p className="text-[13.5px] text-muted-foreground">
                    Ya puedes iniciar sesión con tu nueva contraseña.
                  </p>
                </div>
                <Button onClick={resetForgot} className="font-semibold cursor-pointer">
                  Ir al inicio de sesión
                </Button>
              </div>
            ) : (
              <form onSubmit={handleRecuperar} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-[13px] font-semibold">
                    Código de verificación <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="h-11 font-mono tracking-widest text-center text-lg w-40"
                    required
                  />
                  <p className="text-[12px] text-muted-foreground">El código expira en 15 minutos.</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px] font-semibold">
                    Nueva contraseña <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showNewPass ? "text" : "password"}
                      placeholder="Mínimo 8 caracteres"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      className="h-11 pr-10 text-[14px]"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      aria-label={showNewPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {newPass && (
                    <div className="space-y-1">
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: strength.width, background: strength.color }}
                        />
                      </div>
                      <p className="text-[12px]" style={{ color: strength.color }}>{strength.label}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px] font-semibold">
                    Confirmar contraseña <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showConfirmPass ? "text" : "password"}
                      placeholder="Repite tu contraseña"
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      className={`h-11 pr-10 text-[14px] ${confirmPass && confirmPass !== newPass ? "border-destructive" : ""}`}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      aria-label={showConfirmPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    >
                      {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPass && confirmPass !== newPass && (
                    <p className="text-[12px] text-destructive">Las contraseñas no coinciden.</p>
                  )}
                </div>
                {recoverMsg && (
                  <div
                    className="flex items-center gap-2.5 text-[13px] px-3.5 py-3 rounded-lg"
                    style={{
                      background: "oklch(0.97 0.015 27)",
                      color: "var(--destructive)",
                      border: "1px solid oklch(0.88 0.06 27)",
                    }}
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />{recoverMsg}
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full h-11 text-[14px] font-semibold cursor-pointer"
                  disabled={savingPass}
                >
                  {savingPass ? "Verificando..." : "Restablecer contraseña"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
