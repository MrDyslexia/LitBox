"use client"

import { Receipt, LogOut, X } from "lucide-react"
import type { User } from "@/app/page"

interface AppSidebarProps {
  readonly user: User
  readonly onLogout: () => void
  readonly navItems: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }[]
  readonly roleLabel: string
  readonly roleColor: string
  readonly mobileOpen?: boolean
  readonly onMobileClose?: () => void
}

function SidebarContent({
  user, onLogout, navItems, roleLabel, roleColor, onMobileClose, showClose,
}: AppSidebarProps & { showClose?: boolean }) {
  return (
    <aside
      className="flex flex-col h-full w-64 shrink-0 font-sans"
      style={{ background: "var(--sidebar)" }}
    >
      {/* Logo bar */}
      <div
        className="flex items-center gap-2.5 px-5 py-4"
        style={{ background: "oklch(0.13 0.04 243)", borderBottom: "1px solid var(--sidebar-border)" }}
      >
        <div
          className="w-7 h-7 rounded flex items-center justify-center shrink-0"
          style={{ background: "var(--accent)" }}
        >
          <Receipt className="w-4 h-4 text-white" />
        </div>
        <div className="leading-tight flex-1 min-w-0">
          <span className="text-[13px] font-bold tracking-tight text-white">GastosApp</span>
          <p className="text-[9px] font-medium tracking-widest uppercase" style={{ color: "var(--accent)" }}>
            Reembolsos
          </p>
        </div>
        {showClose && (
          <button
            onClick={onMobileClose}
            className="text-white/60 hover:text-white transition-colors ml-1"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* User chip */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--sidebar-border)" }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
            style={{ background: roleColor }}
          >
            {user.avatar}
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold leading-tight truncate" style={{ color: "var(--sidebar-foreground)" }}>
              {user.name}
            </p>
            <p className="text-[10px] font-medium mt-0.5" style={{ color: "var(--accent)" }}>{roleLabel}</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {navItems.map((item, i) => (
          <button
            key={i}
            onClick={() => { item.onClick?.(); onMobileClose?.() }}
            className="w-full flex items-center gap-3 px-5 py-3 text-[13px] font-medium transition-all text-left relative"
            style={
              item.active
                ? { background: "var(--sidebar-accent)", color: "white", borderLeft: "3px solid var(--accent)" }
                : { color: "oklch(0.65 0.02 230)", borderLeft: "3px solid transparent" }
            }
            onMouseEnter={(e) => {
              if (!item.active) {
                ;(e.currentTarget as HTMLButtonElement).style.background = "var(--sidebar-accent)"
                ;(e.currentTarget as HTMLButtonElement).style.color = "oklch(0.88 0.01 230)"
              }
            }}
            onMouseLeave={(e) => {
              if (!item.active) {
                ;(e.currentTarget as HTMLButtonElement).style.background = "transparent"
                ;(e.currentTarget as HTMLButtonElement).style.color = "oklch(0.65 0.02 230)"
              }
            }}
          >
            <span className="w-4 h-4 shrink-0 opacity-80">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ borderTop: "1px solid var(--sidebar-border)" }}>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-5 py-4 text-[13px] font-medium transition-all"
          style={{ color: "oklch(0.55 0.02 230)", borderLeft: "3px solid transparent" }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background = "oklch(0.55 0.22 27 / 0.12)"
            ;(e.currentTarget as HTMLButtonElement).style.color = "oklch(0.8 0.1 27)"
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background = "transparent"
            ;(e.currentTarget as HTMLButtonElement).style.color = "oklch(0.55 0.02 230)"
          }}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

export default function AppSidebar(props: AppSidebarProps) {
  const { mobileOpen, onMobileClose } = props

  return (
    <>
      {/* Desktop: sidebar in flow */}
      <div className="hidden md:flex h-full">
        <SidebarContent {...props} />
      </div>

      {/* Mobile: overlay drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 shadow-xl">
            <SidebarContent {...props} showClose />
          </div>
        </div>
      )}
    </>
  )
}
