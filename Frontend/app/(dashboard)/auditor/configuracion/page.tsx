"use client"

import { useRouter } from "next/navigation"
import ConfiguracionPerfil from "@/components/configuracion-perfil"

export default function AuditorConfiguracionPage() {
  const router = useRouter()
  return <ConfiguracionPerfil onBack={() => router.push("/auditor")} />
}
