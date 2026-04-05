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

  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview) }
  }, [preview])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pay-modal-title"
        className="relative w-full sm:max-w-md mx-4 sm:mx-0 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4" style={{ color: GESTOR_COLOR }} />
            <h2 id="pay-modal-title" className="text-sm font-semibold text-foreground">Confirmar pago</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={uploading}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Resumen de la boleta */}
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
            <p className="text-xs text-muted-foreground line-clamp-2">{boleta.descripcion}</p>
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
                  className="w-full object-contain max-h-48"
                  loading="lazy"
                />
                <button
                  className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white shadow"
                  style={{ background: "rgba(0,0,0,0.6)" }}
                  onClick={() => { setFile(null); setPreview(null) }}
                  disabled={uploading}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="px-3 py-2 border-t" style={{ borderColor: "var(--border)" }}>
                  <p className="text-xs text-muted-foreground truncate">{file?.name}</p>
                </div>
              </div>
            ) : (
              <div
                className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
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

          {/* Acciones */}
          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              className="flex-1 h-11"
              onClick={onClose}
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 h-11 font-semibold text-white"
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
