"use client"

import { useState, useEffect } from "react"
import LoginPage from "@/components/login-page"
import EmployeeDashboard from "@/components/employee-dashboard"
import AuditorDashboard from "@/components/auditor-dashboard"
import GestorDashboard from "@/components/gestor-dashboard"
import AdminDashboard from "@/components/admin-dashboard"
import CompletarPerfil from "@/components/completar-perfil"
import { auth } from "@/lib/api"

export type UserRole = "empleado" | "auditor" | "gestor" | "administrador"

export interface User {
  _id: string
  name: string
  email: string
  role: UserRole
  avatar: string
  esNuevo: boolean
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)

  useEffect(() => {
    auth
      .me()
      .then((u) =>
        setCurrentUser({
          _id: u._id,
          name: u.nombre,
          email: u.email,
          role: u.rol,
          avatar: u.avatar,
          esNuevo: u.esNuevo,
        })
      )
      .catch(() => {})
      .finally(() => setSessionLoading(false))
  }, [])

  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      const { user } = await auth.login(email, password)
      setCurrentUser({
        _id: user._id,
        name: user.nombre,
        email: user.email,
        role: user.rol,
        avatar: user.avatar,
        esNuevo: user.esNuevo,
      })
      return true
    } catch {
      return false
    }
  }

  const handleLogout = async () => {
    await auth.logout().catch(() => {})
    setCurrentUser(null)
  }

  const handlePerfilCompletado = () => {
    if (!currentUser) return
    setCurrentUser({ ...currentUser, esNuevo: false })
  }

  const handleUserUpdate = (updates: { name: string; email: string; avatar: string }) => {
    if (!currentUser) return
    setCurrentUser({ ...currentUser, ...updates })
  }

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div
          className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }}
        />
      </div>
    )
  }

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />
  }

  if (currentUser.esNuevo) {
    return <CompletarPerfil user={currentUser} onComplete={handlePerfilCompletado} onLogout={handleLogout} />
  }

  if (currentUser.role === "empleado") {
    return <EmployeeDashboard user={currentUser} onLogout={handleLogout} onUpdate={handleUserUpdate} />
  }

  if (currentUser.role === "auditor") {
    return <AuditorDashboard user={currentUser} onLogout={handleLogout} onUpdate={handleUserUpdate} />
  }

  if (currentUser.role === "gestor") {
    return <GestorDashboard user={currentUser} onLogout={handleLogout} onUpdate={handleUserUpdate} />
  }

  return <AdminDashboard user={currentUser} onLogout={handleLogout} onUpdate={handleUserUpdate} />
}
