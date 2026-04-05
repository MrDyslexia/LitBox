"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Mail } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import ConfiguracionPerfil from "@/components/configuracion-perfil"
import { configApi } from "@/lib/api"
import type { NotificacionesConfig } from "@/lib/types"

export default function AdminConfiguracionPage() {
  const router = useRouter()
  const [notifConfig, setNotifConfig] = useState<NotificacionesConfig | null>(null)
  const [savingNotif, setSavingNotif] = useState(false)
  const [notifMsg, setNotifMsg] = useState("")

  const loadNotifConfig = useCallback(async () => {
    try {
      const cfg = await configApi.getNotificaciones()
      setNotifConfig(cfg)
    } catch {
      // silencioso
    }
  }, [])

  useEffect(() => {
    loadNotifConfig()
  }, [loadNotifConfig])

  const handleSaveNotif = async () => {
    if (!notifConfig) return
    setSavingNotif(true)
    setNotifMsg("")
    try {
      await configApi.updateNotificaciones(notifConfig)
      setNotifMsg("Configuración guardada correctamente.")
    } catch {
      setNotifMsg("Error al guardar. Inténtalo de nuevo.")
    } finally {
      setSavingNotif(false)
      setTimeout(() => setNotifMsg(""), 3000)
    }
  }

  const toggleKey = (key: keyof NotificacionesConfig) => {
    if (!notifConfig) return
    setNotifConfig({ ...notifConfig, [key]: !notifConfig[key] })
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-w-2xl">
      <BreadcrumbNav
        items={[
          { label: "Resumen general", href: "/administrador" },
          { label: "Configuración" },
        ]}
      />
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Configuración</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gestiona tu perfil y las preferencias de notificaciones.
        </p>
      </div>

      {/* Datos de perfil */}
      <ConfiguracionPerfil onBack={() => router.push("/administrador")} embedded />

      <Card className="border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            Notificaciones por email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {notifConfig === null ? (
            <p className="text-sm text-muted-foreground">Cargando configuración...</p>
          ) : (
            <>
              {(
                [
                  { key: "creacion", label: "Boleta creada", desc: "Recibir aviso cuando un empleado crea una nueva boleta." },
                  { key: "aprobacion", label: "Boleta aprobada", desc: "Recibir aviso cuando un auditor aprueba una boleta." },
                  { key: "rechazo", label: "Boleta rechazada", desc: "Recibir aviso cuando un auditor rechaza una boleta." },
                  { key: "atraso", label: "Atraso en revisión", desc: "Recibir recordatorios de boletas sin resolver (avisos 1 y 2). El tercer aviso siempre se envía." },
                ] as { key: keyof NotificacionesConfig; label: string; desc: string }[]
              ).map(({ key, label, desc }) => (
                <div key={key} className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={notifConfig[key]}
                    onClick={() => toggleKey(key)}
                    className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none"
                    style={{
                      background: notifConfig[key] ? "var(--primary)" : "oklch(0.82 0.01 240)",
                    }}
                  >
                    <span
                      className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform"
                      style={{ transform: notifConfig[key] ? "translateX(20px)" : "translateX(0px)" }}
                    />
                  </button>
                </div>
              ))}

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSaveNotif}
                  disabled={savingNotif}
                  className="h-9 px-4 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-60"
                  style={{ background: "var(--primary)" }}
                >
                  {savingNotif ? "Guardando..." : "Guardar cambios"}
                </button>
                {notifMsg && (
                  <span
                    className="text-sm font-medium"
                    style={{ color: notifMsg.startsWith("Error") ? "var(--destructive)" : "oklch(0.58 0.14 162)" }}
                  >
                    {notifMsg}
                  </span>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
