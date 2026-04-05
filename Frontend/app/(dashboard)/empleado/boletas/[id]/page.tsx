"use client"

import { use, useState, useEffect, useCallback } from "react"
import { FileText } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import StatusBadge from "@/components/status-badge"
import { formatMonto, formatFecha, type Boleta } from "@/lib/mock-data"
import { boletasApi, normalizeBoleta } from "@/lib/api"
import { useBoletasSync } from "@/hooks/useBoletasSync"

export default function EmpleadoBoletaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [boleta, setBoleta] = useState<Boleta | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

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
            { label: "Inicio", href: "/empleado" },
            { label: "Mis boletas", href: "/empleado/boletas" },
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
          { label: "Inicio", href: "/empleado" },
          { label: "Mis boletas", href: "/empleado/boletas" },
          { label: boleta.id },
        ]}
      />

      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{boleta.tipo}</h1>
          <StatusBadge status={boleta.estado} />
        </div>
        <p className="text-muted-foreground text-sm mt-1 font-mono">{boleta.id}</p>
      </div>

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
            <div className="w-full h-72">
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
              { label: "Monto", value: formatMonto(boleta.monto) },
              { label: "Fecha de gasto", value: formatFecha(boleta.fecha) },
              { label: "Tipo", value: boleta.tipo },
              {
                label: "Fecha de revisión",
                value: boleta.fechaRevision ? formatFecha(boleta.fechaRevision) : "—",
              },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Descripción</p>
            <p className="text-sm text-foreground mt-0.5 leading-relaxed">{boleta.descripcion}</p>
          </div>
          {boleta.comentarioAuditor && (
            <div
              className="p-3 rounded-lg"
              style={{
                background: boleta.estado === "rechazada" ? "oklch(0.97 0.02 27)" : "oklch(0.95 0.04 145)",
                borderLeft: `3px solid ${boleta.estado === "rechazada" ? "oklch(0.577 0.245 27.325)" : "oklch(0.56 0.13 145)"}`,
              }}
            >
              <p className="text-xs font-semibold text-muted-foreground mb-1">Comentario del auditor</p>
              <p className="text-sm text-foreground leading-relaxed">{boleta.comentarioAuditor}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
