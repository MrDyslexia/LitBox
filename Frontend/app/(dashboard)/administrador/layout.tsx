"use client"

import { useState } from "react"
import { LayoutDashboard, FileText, Users, Settings, Menu } from "lucide-react"
import AppSidebar from "@/components/app-sidebar"

const navItems = [
  { icon: <LayoutDashboard className="w-4 h-4" />, label: "Resumen general", href: "/administrador" },
  { icon: <FileText className="w-4 h-4" />, label: "Todas las boletas", href: "/administrador/boletas" },
  { icon: <Users className="w-4 h-4" />, label: "Gestión de usuarios", href: "/administrador/usuarios" },
  { icon: <Settings className="w-4 h-4" />, label: "Configuración", href: "/administrador/configuracion" },
]

export default function AdministradorLayout({ children }: { readonly children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background overflow-hidden">
      {/* Mobile top header */}
      <header
        className="md:hidden flex items-center justify-between px-4 py-3 shrink-0"
        style={{ background: "oklch(0.13 0.04 243)", borderBottom: "1px solid oklch(0.22 0.055 243)" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded flex items-center justify-center shrink-0" style={{ background: "var(--accent)" }}>
            <FileText className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-[13px] font-bold text-white tracking-tight">LitBox</span>
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
        roleColor="oklch(0.28 0.1 243)"
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
