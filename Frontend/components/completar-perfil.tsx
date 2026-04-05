"use client"

import { useState } from "react"
import { FileText, Eye, EyeOff, ChevronDown, LogOut } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { auth } from "@/lib/api"
import type { User } from "@/app/page"

interface CompletarPerfilProps {
  user: User
  onComplete: () => void
  onLogout: () => void
}

export default function CompletarPerfil({ user, onComplete, onLogout }: CompletarPerfilProps) {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [showBancaria, setShowBancaria] = useState(false)
  const [banco, setBanco] = useState("")
  const [tipoCuenta, setTipoCuenta] = useState<"corriente" | "vista" | "ahorro">("corriente")
  const [numeroCuenta, setNumeroCuenta] = useState("")

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [globalError, setGlobalError] = useState("")

  const validate = () => {
    const errs: Record<string, string> = {}
    if (password.length < 8) errs.password = "La contraseña debe tener al menos 8 caracteres."
    if (password !== confirmPassword) errs.confirm = "Las contraseñas no coinciden."
    if (showBancaria && (!banco || !numeroCuenta)) {
      errs.bancaria = "Completa todos los campos bancarios o desmarca la sección."
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGlobalError("")
    if (!validate()) return

    setSaving(true)
    try {
      await auth.completarPerfil({
        password,
        infoBancaria:
          showBancaria && banco && numeroCuenta
            ? { banco, tipoCuenta, numeroCuenta }
            : undefined,
      })
      onComplete()
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "Error al guardar. Inténtalo de nuevo.")
    } finally {
      setSaving(false)
    }
  }

  const passwordStrength = (): { label: string; color: string; width: string } => {
    if (password.length === 0) return { label: "", color: "transparent", width: "0%" }
    if (password.length < 8)   return { label: "Muy corta", color: "oklch(0.55 0.22 27)", width: "25%" }
    if (password.length < 12)  return { label: "Aceptable", color: "oklch(0.62 0.14 72)", width: "60%" }
    return { label: "Segura", color: "oklch(0.58 0.14 162)", width: "100%" }
  }

  const strength = passwordStrength()

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 py-4 shrink-0"
        style={{ background: "oklch(0.13 0.04 243)", borderBottom: "1px solid oklch(0.22 0.055 243)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded flex items-center justify-center"
            style={{ background: "var(--accent)" }}
          >
            <FileText className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-[14px] font-bold text-white tracking-tight">LitBox</span>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Cerrar sesión
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-lg space-y-6">

          {/* Welcome */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Bienvenido, {user.name.split(" ")[0]}
            </h1>
            <p className="text-muted-foreground text-sm mt-1.5">
              Antes de continuar, necesitas configurar tu acceso. Establece una contraseña personal para tu cuenta.
            </p>
          </div>

          <Card className="border shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Configurar acceso</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Nueva contraseña */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    Nueva contraseña <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 8 caracteres"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: "" })) }}
                      className={`h-10 pr-10 ${errors.password ? "border-destructive" : ""}`}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="space-y-1">
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: strength.width, background: strength.color }}
                        />
                      </div>
                      <p className="text-xs" style={{ color: strength.color }}>{strength.label}</p>
                    </div>
                  )}
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>

                {/* Confirmar contraseña */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    Confirmar contraseña <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Repite tu contraseña"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setErrors((p) => ({ ...p, confirm: "" })) }}
                      className={`h-10 pr-10 ${errors.confirm ? "border-destructive" : ""}`}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirm && <p className="text-xs text-destructive">{errors.confirm}</p>}
                </div>

                {/* Info bancaria (opcional) */}
                <div className="border-t pt-4" style={{ borderColor: "var(--border)" }}>
                  <button
                    type="button"
                    className="flex items-center gap-2 text-sm font-medium"
                    style={{ color: "var(--accent)" }}
                    onClick={() => setShowBancaria(!showBancaria)}
                  >
                    <ChevronDown
                      className="w-4 h-4 transition-transform"
                      style={{ transform: showBancaria ? "rotate(180deg)" : "rotate(0deg)" }}
                    />
                    {showBancaria ? "Ocultar" : "Agregar"} información bancaria{" "}
                    <span className="text-muted-foreground font-normal">(opcional)</span>
                  </button>

                  {showBancaria && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium">Banco</Label>
                        <Input
                          placeholder="Ej: Banco de Chile"
                          value={banco}
                          onChange={(e) => setBanco(e.target.value)}
                          className="h-10"
                        />
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
                        <Input
                          placeholder="Ej: 00123456789"
                          value={numeroCuenta}
                          onChange={(e) => setNumeroCuenta(e.target.value)}
                          className="h-10"
                        />
                      </div>
                      {errors.bancaria && (
                        <p className="text-xs text-destructive sm:col-span-3">{errors.bancaria}</p>
                      )}
                    </div>
                  )}
                </div>

                {globalError && <p className="text-sm text-destructive">{globalError}</p>}

                <Button
                  type="submit"
                  className="w-full h-10 font-semibold text-white"
                  style={{ background: "var(--primary)" }}
                  disabled={saving}
                >
                  {saving ? "Guardando..." : "Completar configuración"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
