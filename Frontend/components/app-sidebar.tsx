"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { FileText, LogOut, X } from "lucide-react"
import { useUser } from "@/contexts/user-context"
import ThemeToggle from "@/components/theme-toggle"

export interface NavItem {
  icon: React.ReactNode
  label: string
  href?: string
  active?: boolean
  onClick?: () => void
}

interface AppSidebarProps {
  readonly navItems: NavItem[]
  readonly roleLabel: string
  readonly roleColor: string
  readonly mobileOpen?: boolean
  readonly onMobileClose?: () => void
}

function SidebarContent({
  navItems, roleLabel, roleColor, onMobileClose, showClose,
}: AppSidebarProps & { showClose?: boolean }) {
  const { user, onLogout } = useUser()
  const pathname = usePathname()

  const activeHref = navItems
    .filter((item) => item.href && (pathname === item.href || pathname.startsWith(item.href + "/")))
    .sort((a, b) => (b.href?.length ?? 0) - (a.href?.length ?? 0))[0]?.href

  return (
    <aside
      className="flex flex-col h-full w-64 shrink-0 font-sans overflow-hidden"
      style={{ background: "var(--sidebar)", color: "var(--sidebar-foreground)" }}
    >
      {/* Brand header */}
      <div
        className="flex items-start justify-between px-5 py-4 gap-2 shrink-0"
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}
      >
        <div className="flex flex-col gap-2 min-w-0">
          <img
            src="https://www.itransporte.cl/wp-content/uploads/2019/11/logo.png"
            alt="ITransporte"
            className="h-5 w-auto"
            style={{ filter: "brightness(0) invert(1)", opacity: 0.88 }}
          />
          <div className="flex items-center gap-1.5">
            <div
              className="w-4 h-4 rounded-[3px] flex items-center justify-center shrink-0"
              style={{ background: "var(--accent)" }}
            >
              <FileText className="w-2.5 h-2.5" style={{ color: "var(--accent-foreground)" }} />
            </div>
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: "var(--sidebar-muted)" }}
            >
              LitBox · Reembolsos
            </span>
          </div>
        </div>
        {showClose && (
          <button
            onClick={onMobileClose}
            className="text-white/70 hover:text-white transition-colors shrink-0"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* User chip */}
      <div className="px-4 py-3.5 shrink-0" style={{ borderBottom: "1px solid var(--sidebar-border)" }}>
        <div className="flex items-center gap-2.5">
          {user.avatarUrl ? (
            <img
              src={`${process.env.NEXT_PUBLIC_API_URL}${user.avatarUrl}`}
              alt={user.name}
              className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-white/10"
            />
          ) : (
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 ring-1 ring-white/10"
              style={{ background: roleColor }}
            >
              {user.avatar}
            </div>
          )}
          <div className="min-w-0">
            <p
              className="text-[12.5px] font-semibold leading-tight truncate"
              style={{ color: "var(--sidebar-foreground)" }}
            >
              {user.name}
            </p>
            <p
              className="text-[10px] mt-0.5 font-semibold uppercase tracking-[0.14em]"
              style={{ color: "var(--accent)" }}
            >
              {roleLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 overflow-y-auto min-h-0">
        <p
          className="px-5 mt-2 mb-1.5 text-[9px] font-bold uppercase tracking-[0.22em]"
          style={{ color: "var(--sidebar-muted)", opacity: 0.6 }}
        >
          Navegación
        </p>
        {navItems.map((item) => {
          const isActive = item.href
            ? item.href === activeHref
            : (item.active ?? false)

          const baseClass =
            "group w-full flex items-center gap-3 px-5 py-2.5 text-[13px] font-medium transition-all text-left relative"

          const activeStyle: React.CSSProperties = {
            background: "var(--sidebar-accent)",
            color: "var(--sidebar-accent-foreground)",
          }
          const inactiveStyle: React.CSSProperties = {
            color: "var(--sidebar-muted)",
          }

          if (item.href) {
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={baseClass}
                style={isActive ? activeStyle : inactiveStyle}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    ;(e.currentTarget as HTMLElement).style.background = "var(--sidebar-accent)"
                    ;(e.currentTarget as HTMLElement).style.color = "var(--sidebar-accent-foreground)"
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    ;(e.currentTarget as HTMLElement).style.background = "transparent"
                    ;(e.currentTarget as HTMLElement).style.color = "var(--sidebar-muted)"
                  }
                }}
              >
                {isActive && (
                  <span
                    aria-hidden
                    className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r"
                    style={{ background: "var(--accent)" }}
                  />
                )}
                <span className="w-4 h-4 shrink-0 opacity-80">{item.icon}</span>
                {item.label}
              </Link>
            )
          }

          return (
            <button
              key={item.label}
              onClick={() => {
                item.onClick?.()
                onMobileClose?.()
              }}
              className={baseClass}
              style={isActive ? activeStyle : inactiveStyle}
            >
              <span className="w-4 h-4 shrink-0 opacity-80">{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Theme + logout */}
      <div className="shrink-0" style={{ borderTop: "1px solid var(--sidebar-border)" }}>
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "1px solid var(--sidebar-border)" }}
        >
          <span
            className="text-[10px] font-bold uppercase tracking-[0.22em]"
            style={{ color: "var(--sidebar-muted)" }}
          >
            Tema
          </span>
          <ThemeToggle variant="sidebar" />
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-5 py-3.5 text-[13px] font-medium transition-colors"
          style={{ color: "var(--sidebar-muted)" }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background = "oklch(0.55 0.22 27 / 0.14)"
            ;(e.currentTarget as HTMLButtonElement).style.color = "oklch(0.85 0.12 27)"
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background = "transparent"
            ;(e.currentTarget as HTMLButtonElement).style.color = "var(--sidebar-muted)"
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

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [mobileOpen])

  return (
    <>
      <div className="hidden md:flex h-full">
        <SidebarContent {...props} />
      </div>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden overflow-hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 h-full shadow-2xl">
            <SidebarContent {...props} showClose />
          </div>
        </div>
      )}
    </>
  )
}
