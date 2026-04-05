"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { auth } from "@/lib/api"
import { UserProvider } from "@/contexts/user-context"
import type { User } from "@/lib/user-types"
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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const handleLogout = useCallback(async () => {
    await auth.logout().catch(() => {})
    router.replace("/")
  }, [router])

  const handleUpdate = useCallback((updates: { name: string; email: string; avatar: string }) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev))
  }, [])

  useEffect(() => {
    auth
      .me()
      .then((u) => {
        const mapped: User = {
          _id: u._id,
          name: u.nombre,
          email: u.email,
          role: u.rol,
          avatar: u.avatar,
          esNuevo: u.esNuevo,
        }

        if (u.esNuevo && pathname !== "/completar-perfil") {
          router.replace("/completar-perfil")
          return
        }

        // Role guard: if the user is on the wrong role path, redirect
        if (!u.esNuevo && pathname !== "/completar-perfil") {
          const role: UserRole = u.rol
          if (!pathname.startsWith(`/${role}`)) {
            router.replace(`/${role}`)
            return
          }
        }

        setUser(mapped)
        setLoading(false)
      })
      .catch(() => {
        router.replace("/")
      })
  }, [router])

  if (loading) return <Spinner />
  if (!user) return <Spinner />

  return (
    <UserProvider
      value={{
        user,
        onLogout: handleLogout,
        onUpdate: handleUpdate,
      }}
    >
      {children}
    </UserProvider>
  )
}
