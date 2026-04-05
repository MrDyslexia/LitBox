"use client"

import { useRouter } from "next/navigation"
import CompletarPerfil from "@/components/completar-perfil"
import { useUser } from "@/contexts/user-context"
import { auth } from "@/lib/api"

export default function CompletarPerfilPage() {
  const router = useRouter()
  const { user, onLogout } = useUser()

  const handleComplete = () => {
    router.replace(`/${user.role}`)
  }

  const handleLogout = async () => {
    await auth.logout().catch(() => {})
    router.replace("/")
  }

  return (
    <CompletarPerfil
      user={user}
      onComplete={handleComplete}
      onLogout={handleLogout}
    />
  )
}
