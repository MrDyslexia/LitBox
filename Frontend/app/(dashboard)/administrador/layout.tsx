"use client"

import { LayoutDashboard, FileText, Users, Settings, BarChart3, Tag } from "lucide-react"
import RoleShell from "@/components/role-shell"

const navItems = [
  { icon: <LayoutDashboard className="w-4 h-4" />, label: "Resumen general", href: "/administrador" },
  { icon: <FileText className="w-4 h-4" />, label: "Todas las boletas", href: "/administrador/boletas" },
  { icon: <Users className="w-4 h-4" />, label: "Gestión de usuarios", href: "/administrador/usuarios" },
  { icon: <Tag className="w-4 h-4" />, label: "Tipos de gasto", href: "/administrador/tipos-gasto" },
  { icon: <BarChart3 className="w-4 h-4" />, label: "Estadísticas", href: "/administrador/estadisticas" },
  { icon: <Settings className="w-4 h-4" />, label: "Configuración", href: "/administrador/configuracion" },
]

export default function AdministradorLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <RoleShell
      navItems={navItems}
      roleLabel="Administrador"
      roleColor="oklch(0.26 0.065 252)"
    >
      {children}
    </RoleShell>
  )
}
