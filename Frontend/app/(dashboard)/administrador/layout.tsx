"use client"

import { useState } from "react"
import { LayoutDashboard, FileText, Users, Settings, Menu, BarChart3, Tag } from "lucide-react"
import AppSidebar from "@/components/app-sidebar"

const navItems = [
  { icon: <LayoutDashboard className="w-4 h-4" />, label: "Resumen general", href: "/administrador" },
  { icon: <FileText className="w-4 h-4" />, label: "Todas las boletas", href: "/administrador/boletas" },
  { icon: <Users className="w-4 h-4" />, label: "Gestión de usuarios", href: "/administrador/usuarios" },
  { icon: <Tag className="w-4 h-4" />, label: "Tipos de gasto", href: "/administrador/tipos-gasto" },
  { icon: <BarChart3 className="w-4 h-4" />, label: "Estadísticas", href: "/administrador/estadisticas" },
  { icon: <Settings className="w-4 h-4" />, label: "Configuración", href: "/administrador/configuracion" },
]

export default function AdministradorLayout({ children }: { readonly children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background overflow-hidden">
      {/* Mobile top header */}
      <header
        className="md:hidden flex items-center justify-between px-4 py-3 shrink-0"
        style={{ background: "oklch(0.08 0.04 252)", borderBottom: "1px solid oklch(0.14 0.04 252)" }}
      >
        <div className="flex items-center gap-2.5">
          <img
            src="https://www.itransporte.cl/wp-content/uploads/2019/11/logo.png"
            alt="ITransporte"
            className="h-5 w-auto"
            style={{ filter: "brightness(0) invert(1)", opacity: 0.9 }}
          />
          <div className="h-3.5 w-px" style={{ background: "rgba(255,255,255,0.2)" }} />
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded flex items-center justify-center shrink-0" style={{ background: "#D94214" }}>
              <FileText className="w-2.5 h-2.5 text-white" />
            </div>
            <span className="text-white text-[11px] font-semibold">LitBox</span>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="text-white/80 hover:text-white transition-colors p-1"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" color="white" />
        </button>
      </header>

      <AppSidebar
        navItems={navItems}
        roleLabel="Administrador"
        roleColor="oklch(0.26 0.065 252)"
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
