"use client"

import { createContext, useContext, type ReactNode } from "react"
import type { User } from "@/lib/user-types"

interface UserContextValue {
  user: User
  onLogout: () => void
  onUpdate: (updates: { name: string; email: string; avatar: string }) => void
}

const UserContext = createContext<UserContextValue | null>(null)

export function UserProvider({
  value,
  children,
}: {
  value: UserContextValue
  children: ReactNode
}) {
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error("useUser must be used inside <UserProvider>")
  return ctx
}
