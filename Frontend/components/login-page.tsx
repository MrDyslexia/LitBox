"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Eye, EyeOff, FileText, Receipt } from "lucide-react"

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<boolean>
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    const success = await onLogin(email, password)
    if (!success) {
      setError("Correo o contraseña incorrectos.")
    }
    setLoading(false)
  }

  const demoAccounts = [
    { label: "Empleado", email: "empleado@empresa.com" },
    { label: "Auditor", email: "auditor@empresa.com" },
    { label: "Gestor", email: "gestor@empresa.com" },
    { label: "Administrador", email: "admin@empresa.com" },
  ]

  return (
    <div className="min-h-screen flex font-sans">
      {/* Left panel — iTransporte-inspired dark navy with branding */}
      <div
        className="hidden lg:flex flex-col w-[42%] shrink-0"
        style={{ background: "var(--primary)" }}
      >
        {/* Top logo strip */}
        <div
          className="flex items-center gap-3 px-10 py-5"
          style={{ background: "oklch(0.13 0.04 243)", borderBottom: "1px solid oklch(0.22 0.055 243)" }}
        >
          <div
            className="w-8 h-8 rounded flex items-center justify-center shrink-0"
            style={{ background: "var(--accent)" }}
          >
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-[14px] font-bold text-white tracking-tight leading-none">LitBox</p>
            <p className="text-[9px] font-semibold tracking-widest uppercase mt-0.5" style={{ color: "var(--accent)" }}>
              Reembolsos
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col justify-between flex-1 px-10 py-12">
          <div className="space-y-8">
            <div
              className="inline-block text-[11px] font-semibold tracking-widest uppercase px-3 py-1 rounded"
              style={{ background: "var(--accent)", color: "white" }}
            >
              Plataforma corporativa
            </div>
            <h1 className="text-[2.4rem] font-bold leading-tight text-white text-balance">
              Gestión de boletas de gastos
            </h1>
            <p className="text-[14px] leading-relaxed" style={{ color: "oklch(0.7 0.03 230)" }}>
              Centraliza, gestiona y haz seguimiento de todos los gastos de tu empresa. Tus empleados suben sus boletas y tú controlas el proceso de reembolso.
            </p>

            {/* Feature list */}
            <div className="space-y-3 pt-2">
              {[
                { num: "01", title: "Subida de comprobantes", desc: "Los empleados fotografían y suben sus boletas fácilmente." },
                { num: "02", title: "Auditoría centralizada", desc: "Los auditores revisan, aprueban o rechazan cada solicitud." },
                { num: "03", title: "Control total", desc: "El administrador tiene visibilidad completa del sistema." },
              ].map((item) => (
                <div key={item.num} className="flex gap-4 items-start">
                  <span
                    className="text-[11px] font-bold shrink-0 mt-0.5"
                    style={{ color: "var(--accent)" }}
                  >
                    {item.num}
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-white">{item.title}</p>
                    <p className="text-[12px] mt-0.5" style={{ color: "oklch(0.62 0.02 230)" }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px]" style={{ color: "oklch(0.42 0.02 230)" }}>
            © {new Date().getFullYear()} LitBox. Todos los derechos reservados.
          </p>
        </div>
      </div>

      {/* Right panel — white, clean login form */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Mobile header */}
        <div
          className="flex lg:hidden items-center gap-2.5 px-6 py-4"
          style={{ background: "var(--primary)", borderBottom: "1px solid oklch(0.22 0.055 243)" }}
        >
          <div
            className="w-7 h-7 rounded flex items-center justify-center shrink-0"
            style={{ background: "var(--accent)" }}
          >
            <FileText className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-[13px] font-bold text-white tracking-tight">LitBox</span>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-[380px] space-y-5">
            <div className="space-y-1">
              <h2 className="text-[1.6rem] font-bold text-foreground">Iniciar sesión</h2>
              <p className="text-[13px] text-muted-foreground">
                Ingresa con tu correo institucional para continuar.
              </p>
            </div>

            <div
              className="rounded-md border p-6 space-y-4"
              style={{ borderColor: "var(--border)", background: "var(--card)" }}
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-[13px] font-medium text-foreground">
                    Correo institucional
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-9 text-[13px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-[13px] font-medium text-foreground">
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-9 pr-10 text-[13px]"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div
                    className="flex items-center gap-2 text-[12px] p-2.5 rounded"
                    style={{ background: "oklch(0.98 0.015 27)", color: "var(--destructive)", border: "1px solid oklch(0.9 0.06 27)" }}
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-9 text-[13px] font-semibold text-white"
                  style={{ background: "var(--primary)" }}
                  disabled={loading}
                >
                  {loading ? "Ingresando..." : "Ingresar al sistema"}
                </Button>
              </form>
            </div>

            {/* Demo accounts */}
            <div
              className="rounded-md border p-4 space-y-2.5"
              style={{ background: "oklch(0.96 0.01 162 / 0.2)", borderColor: "oklch(0.85 0.04 162 / 0.5)" }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "oklch(0.45 0.1 162)" }}>
                Cuentas de demostración — contraseña: demo1234
              </p>
              <div className="flex flex-wrap gap-2">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => setEmail(acc.email)}
                    className="text-[12px] px-3 py-1 rounded border font-medium transition-all"
                    style={{
                      borderColor: "oklch(0.75 0.1 162 / 0.6)",
                      color: "oklch(0.38 0.12 162)",
                      background: "oklch(0.97 0.02 162 / 0.5)",
                    }}
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
  )
}
