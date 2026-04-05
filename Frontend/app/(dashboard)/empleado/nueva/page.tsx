"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, Upload } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import { TIPOS_BOLETA, type BoletaTipo } from "@/lib/mock-data"
import { boletasApi, uploadsApi, ApiError } from "@/lib/api"

export default function NuevaBoletaPage() {
  const router = useRouter()
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

  const handleSubmitBoleta = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError("")

    // Validar que la fecha no sea futura
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const selectedDate = new Date(newForm.fecha + "T00:00:00")
    if (selectedDate > today) {
      setSubmitError("La fecha del gasto no puede ser posterior a hoy.")
      setSubmitting(false)
      return
    }

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

      setSubmitted(true)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setSubmitError("Tu usuario está inactivo y no tiene permitido generar nuevas boletas. Por favor, comunícate con la administración.")
      } else {
        setSubmitError(err instanceof Error ? err.message : "Error al enviar la boleta")
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-w-2xl">
      <BreadcrumbNav
        items={[
          { label: "Inicio", href: "/empleado" },
          { label: "Nueva boleta" },
        ]}
      />
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Nueva boleta</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Completa el formulario para enviar tu solicitud de reembolso.
        </p>
      </div>

      {submitted ? (
        <Card className="border shadow-none">
          <CardContent className="p-8 sm:p-10 text-center space-y-3">
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
          <CardContent className="p-4 sm:p-5">
            <form onSubmit={handleSubmitBoleta} className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Tipo de gasto</Label>
                <select
                  className="w-full h-11 px-3 rounded-lg border text-sm bg-background text-foreground"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Monto (CLP)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newForm.monto}
                    onChange={(e) => setNewForm({ ...newForm, monto: e.target.value })}
                    required
                    min="1"
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Fecha del gasto</Label>
                  <Input
                    type="date"
                    value={newForm.fecha}
                    max={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setNewForm({ ...newForm, fecha: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Descripción</Label>
                <textarea
                  className="w-full px-3 py-2.5 rounded-lg border text-sm bg-background text-foreground resize-none focus:outline-none focus:ring-2"
                  style={{ borderColor: "var(--border)", minHeight: "90px" }}
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
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          setSubmitError("El archivo no puede superar los 5 MB.")
                          e.target.value = ""
                          return
                        }
                        if (!file.type.match(/^image\/|^application\/pdf$/)) {
                          setSubmitError("Solo se permiten imágenes (JPG, PNG) o PDF.")
                          e.target.value = ""
                          return
                        }
                        setSubmitError("")
                      }
                      setNewForm({ ...newForm, imagen: file })
                    }}
                  />
                  <Upload
                    className="w-7 h-7"
                    style={{ color: newForm.imagen ? "var(--accent)" : "var(--muted-foreground)" }}
                  />
                  <span className="text-sm text-muted-foreground text-center px-4">
                    {newForm.imagen ? newForm.imagen.name : "Toca para subir o arrastra la imagen"}
                  </span>
                  <span className="text-xs text-muted-foreground">JPG, PNG, PDF hasta 5 MB</span>
                </label>
              </div>

              {submitError && (
                <p className="text-sm text-destructive">{submitError}</p>
              )}

              <Button
                type="submit"
                className="w-full h-11 font-semibold text-white"
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
  )
}
