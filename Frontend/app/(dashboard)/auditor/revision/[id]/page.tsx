"use client"

import { use, useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  FileText,
  ClipboardList,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import StatusBadge from "@/components/status-badge"
import { formatMonto, formatFecha, type Boleta } from "@/lib/mock-data"
import { boletasApi, normalizeBoleta } from "@/lib/api"
import { useBoletasSync } from "@/hooks/useBoletasSync"

export default function AuditorRevisionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [boleta, setBoleta] = useState<Boleta | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [comentario, setComentario] = useState("")
  const [resolving, setResolving] = useState(false)
  const [resolveError, setResolveError] = useState("")

  const loadData = useCallback(async () => {
    try {
      const raw = await boletasApi.getById(id)
      setBoleta(normalizeBoleta(raw))
    } catch (err) {
      console.error("Error cargando boleta:", err)
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadData()
  }, [loadData])

  useBoletasSync(loadData)

  const handleResolution = async (accion: "aprobar" | "rechazar") => {
    if (!boleta?._id) return
    setResolving(true)
    setResolveError("")

    try {
      await (accion === "aprobar"
        ? boletasApi.aprobar(boleta._id, comentario || undefined)
        : boletasApi.rechazar(boleta._id, comentario || undefined))

      await loadData()
      setComentario("")
      router.push("/auditor/revision")
    } catch (err) {
      setResolveError(err instanceof Error ? err.message : "Error al procesar la resolución")
    } finally {
      setResolving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="text-center py-12 text-muted-foreground text-sm">Cargando...</div>
      </div>
    )
  }

  if (notFound || !boleta) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <BreadcrumbNav
          items={[
            { label: "Resumen", href: "/auditor" },
            { label: "Revisar boletas", href: "/auditor/revision" },
            { label: "Boleta no encontrada" },
          ]}
        />
        <p className="text-sm text-muted-foreground">No se encontró esta boleta.</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-w-2xl">
      <BreadcrumbNav
        items={[
          { label: "Resumen", href: "/auditor" },
          { label: "Revisar boletas", href: "/auditor/revision" },
          { label: boleta.id },
        ]}
      />

      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{boleta.tipo}</h1>
          <StatusBadge status={boleta.estado} />
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Empleado: <span className="font-medium text-foreground">{boleta.empleadoNombre}</span>
          {" "}— <span className="font-mono text-xs">{boleta.id}</span>
        </p>
      </div>

      {/* Imagen */}
      <Card className="border shadow-none overflow-hidden">
        {boleta.imageUrl ? (
          boleta.imageTipo === "application/pdf" ? (
            <div className="flex items-center justify-center gap-3 px-4 py-6" style={{ background: "var(--secondary)" }}>
              <FileText className="w-6 h-6 text-muted-foreground shrink-0" />
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL}${boleta.imageUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium underline"
                style={{ color: "var(--accent)" }}
              >
                Ver PDF adjunto
              </a>
            </div>
          ) : (
            <div className="w-full h-48 sm:h-72">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL}${boleta.imageUrl}`}
                alt="Boleta"
                className="w-full h-full object-contain"
              />
            </div>
          )
        ) : (
          <div
            className="h-40 flex items-center justify-center"
            style={{ background: "var(--secondary)" }}
          >
            <div className="text-center space-y-2">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto" />
              <p className="text-xs text-muted-foreground">Sin imagen adjunta</p>
            </div>
          </div>
        )}
      </Card>

      <Card className="border shadow-none">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Monto solicitado", value: formatMonto(boleta.monto) },
              { label: "Fecha del gasto", value: formatFecha(boleta.fecha) },
              { label: "Tipo de gasto", value: boleta.tipo },
              { label: "Correo empleado", value: boleta.empleadoEmail },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                <p className="text-sm font-semibold text-foreground mt-0.5 break-all">{item.value}</p>
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Descripción del empleado</p>
            <p className="text-sm text-foreground mt-0.5 leading-relaxed">{boleta.descripcion}</p>
          </div>
        </CardContent>
      </Card>

      {/* Tomar boleta (pendiente → en_revision) */}
      {boleta.estado === "pendiente" && (
        <Card className="border shadow-none">
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" style={{ color: "var(--accent)" }} />
              <h3 className="text-sm font-semibold text-foreground">Tomar para revisión</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Al tomar esta boleta iniciarás formalmente su revisión. Luego podrás aprobarla o rechazarla.
            </p>
            {resolveError && (
              <p className="text-sm text-destructive">{resolveError}</p>
            )}
            <Button
              className="w-full h-11 font-semibold text-white"
              style={{ background: "oklch(0.62 0.14 72)" }}
              onClick={async () => {
                if (!boleta._id) return
                setResolving(true)
                setResolveError("")
                try {
                  await boletasApi.revisar(boleta._id)
                  await loadData()
                } catch (err) {
                  setResolveError(err instanceof Error ? err.message : "Error al tomar la boleta")
                } finally {
                  setResolving(false)
                }
              }}
              disabled={resolving}
            >
              <ClipboardList className="w-4 h-4 mr-2" />
              {resolving ? "Procesando..." : "Tomar boleta"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Aprobar/Rechazar (en_revision) */}
      {boleta.estado === "en_revision" && (
        <Card className="border shadow-none">
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" style={{ color: "var(--accent)" }} />
              <h3 className="text-sm font-semibold text-foreground">Resolución del auditor</h3>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Comentario (opcional)</Label>
              <textarea
                className="w-full px-3 py-2.5 rounded-lg border text-sm bg-background text-foreground resize-none focus:outline-none focus:ring-2"
                style={{ borderColor: "var(--border)", minHeight: "90px" }}
                placeholder="Escribe un comentario para el empleado..."
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
              />
            </div>
            {resolveError && (
              <p className="text-sm text-destructive">{resolveError}</p>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                className="flex-1 h-11 font-semibold text-white"
                style={{ background: "oklch(0.44 0.13 162)" }}
                onClick={() => handleResolution("aprobar")}
                disabled={resolving}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {resolving ? "Procesando..." : "Aprobar reembolso"}
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-11 font-semibold border-destructive"
                style={{ color: "var(--destructive)", borderColor: "var(--destructive)" }}
                onClick={() => handleResolution("rechazar")}
                disabled={resolving}
              >
                <XCircle className="w-4 h-4 mr-2" />
                {resolving ? "Procesando..." : "Rechazar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {boleta.comentarioAuditor && (
        <Card className="border shadow-none">
          <CardContent className="p-4 sm:p-5">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Resolución registrada</p>
            <p className="text-sm text-foreground leading-relaxed">{boleta.comentarioAuditor}</p>
            {boleta.fechaRevision && (
              <p className="text-xs text-muted-foreground mt-2">
                Revisado el {formatFecha(boleta.fechaRevision)}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
