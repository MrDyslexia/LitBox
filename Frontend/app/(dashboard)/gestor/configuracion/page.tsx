"use client"

import { useRouter } from "next/navigation"
import ConfiguracionPerfil from "@/components/configuracion-perfil"

export default function GestorConfiguracionPage() {
  const router = useRouter()
  return <ConfiguracionPerfil onBack={() => router.push("/gestor")} />
}
