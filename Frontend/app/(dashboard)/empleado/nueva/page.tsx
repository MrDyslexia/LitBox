"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, Upload } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import PageHeader from "@/components/page-header"
import { TipoGastoIcon } from "@/components/tipo-gasto-icon"
import { useTiposGasto } from "@/hooks/useTiposGasto"
import { boletasApi, uploadsApi, ApiError } from "@/lib/api"

export default function NuevaBoletaPage() {
  const router = useRouter()
  const { tiposActivos, loading: loadingTipos } = useTiposGasto()
  const [newForm, setNewForm] = useState({
    tipo: "" as string,
    monto: "",
    fecha: "",
    descripcion: "",
    imagen: null as File | null,
  })
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState("")

  useEffect(() => {
    if (!newForm.imagen) { setPreviewUrl(null); return }
    if (newForm.imagen.type === "application/pdf") { setPreviewUrl("pdf"); return }
    const url = URL.createObjectURL(newForm.imagen)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [newForm.imagen])

  const handleSubmitBoleta = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError("")

    if (!newForm.tipo) {
      setSubmitError("Selecciona un tipo de gasto.")
      setSubmitting(false)
      return
    }

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
    <div className="p-4 sm:p-6 space-y-5 max-w-2xl">
      <BreadcrumbNav
        items={[
          { label: "Inicio", href: "/empleado" },
          { label: "Nueva boleta" },
        ]}
      />
      <PageHeader
        title="Nueva boleta"
        description="Completa el formulario para enviar tu solicitud de reembolso."
      />

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
                setPreviewUrl(null)
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
                <div className={tiposActivos.length > 9
                  ? "overflow-y-auto rounded-lg border border-border p-1.5 max-h-[180px] sm:max-h-[138px]"
                  : ""
                }>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {loadingTipos ? (
                      <div className="col-span-full text-sm text-muted-foreground py-3">Cargando tipos...</div>
                    ) : tiposActivos.map((t) => (
                      <button
                        key={t._id}
                        type="button"
                        onClick={() => setNewForm({ ...newForm, tipo: t.nombre })}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all text-left"
                        style={newForm.tipo === t.nombre
                          ? { background: "var(--primary)", borderColor: "var(--primary)", color: "white" }
                          : { background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }
                        }
                      >
                        <TipoGastoIcon
                          icono={t.icono}
                          className="w-4 h-4 shrink-0"
                          style={{ color: newForm.tipo === t.nombre ? "white" : "var(--muted-foreground)" }}
                        />
                        <span className="truncate">{t.nombre}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {!newForm.tipo && <p className="text-xs text-muted-foreground">Selecciona un tipo de gasto</p>}
                <input type="hidden" value={newForm.tipo} required />
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
                <label className="block w-full cursor-pointer">
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

                  {previewUrl && previewUrl !== "pdf" ? (
                    /* Preview imagen */
                    <div
                      className="relative w-full rounded-lg border-2 overflow-hidden"
                      style={{ borderColor: "var(--accent)" }}
                    >
                      <img
                        src={previewUrl}
                        alt="Vista previa"
                        className="w-full max-h-64 object-contain bg-muted"
                      />
                      <div
                        className="absolute bottom-0 left-0 right-0 px-3 py-2 flex items-center justify-between"
                        style={{ background: "rgba(0,0,0,0.55)" }}
                      >
                        <span className="text-white text-xs truncate">{newForm.imagen?.name}</span>
                        <span className="text-white/70 text-xs shrink-0 ml-2">Toca para cambiar</span>
                      </div>
                    </div>
                  ) : previewUrl === "pdf" ? (
                    /* Preview PDF */
                    <div
                      className="flex items-center gap-3 w-full rounded-lg border-2 px-4 py-5"
                      style={{ borderColor: "var(--accent)", background: "oklch(0.97 0.01 27 / 0.3)" }}
                    >
                      <Upload className="w-8 h-8 shrink-0" style={{ color: "var(--accent)" }} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{newForm.imagen?.name}</p>
                        <p className="text-xs text-muted-foreground">PDF · Toca para cambiar</p>
                      </div>
                    </div>
                  ) : (
                    /* Estado vacío */
                    <div
                      className="flex flex-col items-center justify-center gap-2 w-full rounded-lg border-2 border-dashed py-10 transition-colors"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <Upload className="w-7 h-7 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Toca para subir o arrastra la imagen</span>
                      <span className="text-xs text-muted-foreground">JPG, PNG, PDF hasta 5 MB</span>
                    </div>
                  )}
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
