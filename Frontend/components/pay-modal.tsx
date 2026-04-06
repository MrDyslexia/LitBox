"use client"

import { useState, useEffect, useRef } from "react"
import { Wallet, X, ImageIcon, Upload, CheckCircle, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatMonto, formatFecha, type Boleta } from "@/lib/mock-data"
import { uploadsApi } from "@/lib/api"

const GESTOR_COLOR = "oklch(0.52 0.18 290)"

interface PayModalProps {
  boleta: Boleta
  onConfirm: (comprobante: { url: string; nombre: string; tipo: string; tamano: number }) => Promise<void>
  onClose: () => void
}

export default function PayModal({ boleta, onConfirm, onClose }: PayModalProps) {
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

  // Lock body scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && !uploading) onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [uploading, onClose])

  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview) }
  }, [preview])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!uploading ? onClose : undefined}
      />

      {/* Panel — bottom sheet on mobile, centered dialog on sm+ */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pay-modal-title"
        className="relative w-full sm:max-w-md sm:mx-4 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          maxHeight: "90dvh",
        }}
      >
        {/* Drag handle — mobile affordance */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
          <div
            className="w-10 h-1 rounded-full"
            style={{ background: "var(--muted-foreground)", opacity: 0.3 }}
          />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4" style={{ color: GESTOR_COLOR }} />
            <h2 id="pay-modal-title" className="text-sm font-semibold text-foreground">Confirmar pago</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            disabled={uploading}
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Boleta summary */}
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
            {boleta.descripcion && (
              <p className="text-xs text-muted-foreground line-clamp-2">{boleta.descripcion}</p>
            )}
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
                  className="w-full object-contain max-h-52"
                  loading="lazy"
                />
                <button
                  className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-white shadow"
                  style={{ background: "rgba(0,0,0,0.6)" }}
                  onClick={() => { setFile(null); setPreview(null) }}
                  disabled={uploading}
                  aria-label="Quitar imagen"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="px-3 py-2 border-t" style={{ borderColor: "var(--border)" }}>
                  <p className="text-xs text-muted-foreground truncate">{file?.name}</p>
                </div>
              </div>
            ) : (
              <>
                {/* Mobile: prominent single-tap CTA */}
                <button
                  className="sm:hidden w-full rounded-xl p-4 flex items-center gap-3 transition-colors active:opacity-80"
                  style={{
                    background: "oklch(0.94 0.03 290)",
                    border: "2px dashed oklch(0.72 0.1 290)",
                  }}
                  onClick={() => inputRef.current?.click()}
                  type="button"
                >
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: GESTOR_COLOR }}
                  >
                    <ImageIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold" style={{ color: GESTOR_COLOR }}>Seleccionar comprobante</p>
                    <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG o PDF desde tu galería o archivos</p>
                  </div>
                </button>

                {/* Desktop: drag-and-drop zone */}
                <div
                  className="hidden sm:flex border-2 border-dashed rounded-xl p-6 flex-col items-center justify-center gap-2 cursor-pointer transition-colors hover:border-muted-foreground/40"
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
              </>
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
        </div>

        {/* Footer actions — outside scroll area, above safe-area */}
        <div
          className="px-5 pt-3 pb-5 shrink-0 space-y-3"
          style={{
            borderTop: "1px solid var(--border)",
            paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))",
          }}
        >
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-12"
              onClick={onClose}
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 h-12 font-semibold text-white"
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
