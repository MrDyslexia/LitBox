"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, Check, X, GripVertical } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import { TipoGastoIcon, ICONOS_DISPONIBLES } from "@/components/tipo-gasto-icon"
import { tiposGastoApi } from "@/lib/api"
import { useTiposGasto } from "@/hooks/useTiposGasto"
import type { TipoGasto } from "@/lib/types"

interface Props {
  backHref: string
  backLabel: string
}

function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div
      className="grid grid-cols-8 sm:grid-cols-10 gap-1.5 p-3 rounded-lg border max-h-48 overflow-y-auto"
      style={{ borderColor: "var(--border)" }}
    >
      {ICONOS_DISPONIBLES.map((ic) => (
        <button
          key={ic.name}
          type="button"
          title={ic.label}
          onClick={() => onChange(ic.name)}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
          style={{
            background: value === ic.name ? "var(--primary)" : "var(--secondary)",
            border: value === ic.name ? "2px solid var(--primary)" : "2px solid transparent",
          }}
        >
          <TipoGastoIcon
            icono={ic.name}
            className="w-4 h-4"
            style={{ color: value === ic.name ? "white" : "var(--muted-foreground)" }}
          />
        </button>
      ))}
    </div>
  )
}

export default function TiposGastoManager({ backHref, backLabel }: Props) {
  const { tipos, loading, invalidate } = useTiposGasto()
  const [showForm, setShowForm]   = useState(false)
  const [editTarget, setEditTarget] = useState<TipoGasto | null>(null)
  const [form, setForm]           = useState({ nombre: "", icono: "FileText" })
  const [saving, setSaving]       = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const openNew = () => {
    setEditTarget(null)
    setForm({ nombre: "", icono: "FileText" })

    setShowForm(true)
  }

  const openEdit = (t: TipoGasto) => {
    setEditTarget(t)
    setForm({ nombre: t.nombre, icono: t.icono })

    setShowForm(true)
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditTarget(null)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre.trim()) { toast.error("El nombre es requerido."); return }
    if (!form.icono) { toast.error("Selecciona un ícono."); return }
    setSaving(true)
    try {
      if (editTarget) {
        await tiposGastoApi.update(editTarget._id, { nombre: form.nombre.trim(), icono: form.icono })
        toast.success(`Tipo "${form.nombre.trim()}" actualizado.`)
      } else {
        await tiposGastoApi.create({ nombre: form.nombre.trim(), icono: form.icono })
        toast.success(`Tipo "${form.nombre.trim()}" creado.`)
      }
      invalidate()
      setShowForm(false)
      setEditTarget(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al guardar"
      if ((err as any)?.status === 409 || msg.toLowerCase().includes("existe")) {
        toast.error(`Ya existe un tipo con ese nombre.`, {
          description: "Usa un nombre diferente o edita el existente.",
        })
      } else {
        toast.error(msg)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActivo = async (t: TipoGasto) => {
    try {
      await tiposGastoApi.update(t._id, { activo: !t.activo })
      toast.success(`"${t.nombre}" ${!t.activo ? "activado" : "desactivado"}.`)
      invalidate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar")
    }
  }

  const handleDelete = async (t: TipoGasto) => {
    if (!confirm(`¿Eliminar "${t.nombre}"? Solo es posible si no tiene boletas asociadas.`)) return
    setDeletingId(t._id)
    try {
      await tiposGastoApi.delete(t._id)
      toast.success(`Tipo "${t.nombre}" eliminado.`)
      invalidate()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al eliminar"
      const tieneBoletasMsg = msg.includes("boleta")
      toast.error(tieneBoletasMsg ? `No se puede eliminar "${t.nombre}"` : msg, {
        description: tieneBoletasMsg ? msg : undefined,
        action: tieneBoletasMsg ? {
          label: "Desactivar",
          onClick: () => handleToggleActivo(t),
        } : undefined,
        duration: tieneBoletasMsg ? 8000 : 4000,
      })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-3xl">
      <BreadcrumbNav
        items={[
          { label: backLabel, href: backHref },
          { label: "Tipos de gasto" },
        ]}
      />
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Tipos de gasto</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestiona las categorías de gasto y sus íconos. Aparecen en todas las boletas.
          </p>
        </div>
        <Button
          className="shrink-0 h-9 font-semibold text-white text-sm"
          style={{ background: "var(--primary)" }}
          onClick={openNew}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span className="hidden sm:inline">Nuevo tipo</span>
          <span className="sm:hidden">Nuevo</span>
        </Button>
      </div>

      {/* Formulario nuevo/editar */}
      {showForm && (
        <Card className="border shadow-none" style={{ borderColor: "var(--accent)" }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              {editTarget ? "Editar tipo de gasto" : "Nuevo tipo de gasto"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Nombre <span className="text-destructive">*</span></Label>
                <Input
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Transporte urbano"
                  className="h-10"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Ícono <span className="text-destructive">*</span></Label>
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "var(--primary)" }}
                  >
                    <TipoGastoIcon icono={form.icono} className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {ICONOS_DISPONIBLES.find((i) => i.name === form.icono)?.label ?? form.icono}
                  </span>
                </div>
                <IconPicker value={form.icono} onChange={(v) => setForm({ ...form, icono: v })} />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  type="submit"
                  className="h-9 font-semibold text-white"
                  style={{ background: "var(--primary)" }}
                  disabled={saving}
                >
                  <Check className="w-4 h-4 mr-1.5" />
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
                <Button type="button" variant="outline" className="h-9" onClick={cancelForm}>
                  <X className="w-4 h-4 mr-1.5" />
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de tipos */}
      <Card className="border shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground">
            {loading ? "Cargando..." : `${tipos.length} tipo${tipos.length !== 1 ? "s" : ""} registrado${tipos.length !== 1 ? "s" : ""}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Cargando tipos de gasto...</div>
          ) : tipos.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No hay tipos de gasto. Crea el primero.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {tipos.map((t) => (
                <div
                  key={t._id}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ opacity: t.activo ? 1 : 0.5 }}
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground shrink-0 cursor-grab" />
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: t.activo ? "var(--primary)" : "var(--muted)" }}
                  >
                    <TipoGastoIcon
                      icono={t.icono}
                      className="w-4.5 h-4.5"
                      style={{ color: t.activo ? "white" : "var(--muted-foreground)" }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{t.nombre}</p>
                    <p className="text-xs text-muted-foreground">{t.icono} · {t.activo ? "Activo" : "Inactivo"}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      title={t.activo ? "Desactivar" : "Activar"}
                      onClick={() => handleToggleActivo(t)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-muted"
                    >
                      {t.activo
                        ? <Check className="w-4 h-4" style={{ color: "oklch(0.58 0.14 162)" }} />
                        : <X className="w-4 h-4 text-muted-foreground" />
                      }
                    </button>
                    <button
                      type="button"
                      title="Editar"
                      onClick={() => openEdit(t)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-muted"
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      type="button"
                      title="Eliminar"
                      onClick={() => handleDelete(t)}
                      disabled={deletingId === t._id}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-muted"
                    >
                      <Trash2 className="w-4 h-4" style={{ color: "oklch(0.55 0.22 27)" }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
