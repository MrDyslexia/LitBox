"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import LoginPage from "@/components/login-page"
import { auth } from "@/lib/api"
import type { UserRole } from "@/lib/types"

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div
        className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }}
      />
    </div>
  )
}

export default function LoginRoute() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    auth
      .me()
      .then((u) => {
        if (u.esNuevo) {
          router.replace("/completar-perfil")
        } else {
          router.replace(`/${u.rol}`)
        }
      })
      .catch(() => {
        setLoading(false)
      })
  }, [router])

  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      const { user } = await auth.login(email, password)
      if (user.esNuevo) {
        router.replace("/completar-perfil")
      } else {
        router.replace(`/${user.rol as UserRole}`)
      }
      return true
    } catch {
      return false
    }
  }

  if (loading) return <Spinner />

  return <LoginPage onLogin={handleLogin} />
}
