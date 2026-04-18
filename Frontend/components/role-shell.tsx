"use client"

import { useState } from "react"
import { FileText, Menu } from "lucide-react"
import AppSidebar, { type NavItem } from "@/components/app-sidebar"

interface Props {
  readonly navItems: readonly NavItem[]
  readonly roleLabel: string
  readonly roleColor: string
  readonly children: React.ReactNode
}

/**
 * Shared shell used by every role layout: sidebar + mobile header + main scroll area.
 */
export default function RoleShell({ navItems, roleLabel, roleColor, children }: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background overflow-hidden">
      {/* Mobile header */}
      <header
        className="md:hidden flex items-center justify-between px-4 py-3 shrink-0"
        style={{ background: "var(--sidebar)", borderBottom: "1px solid var(--sidebar-border)" }}
      >
        <div className="flex items-center gap-2.5">
          <img
            src="https://www.itransporte.cl/wp-content/uploads/2019/11/logo.png"
            alt="ITransporte"
            className="h-5 w-auto"
            style={{ filter: "brightness(0) invert(1)", opacity: 0.88 }}
          />
          <div className="h-3.5 w-px" style={{ background: "rgba(255,255,255,0.18)" }} />
          <div className="flex items-center gap-1.5">
            <div
              className="w-4 h-4 rounded-[3px] flex items-center justify-center shrink-0"
              style={{ background: "var(--accent)" }}
            >
              <FileText className="w-2.5 h-2.5" style={{ color: "var(--accent-foreground)" }} />
            </div>
            <span className="text-[11px] font-semibold tracking-wide" style={{ color: "var(--sidebar-foreground)" }}>
              LitBox
            </span>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="transition-colors p-1"
          aria-label="Abrir menú"
          style={{ color: "var(--sidebar-foreground)" }}
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      <AppSidebar
        navItems={navItems as NavItem[]}
        roleLabel={roleLabel}
        roleColor={roleColor}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <main className="flex-1 overflow-y-auto bg-background">{children}</main>
    </div>
  )
}
