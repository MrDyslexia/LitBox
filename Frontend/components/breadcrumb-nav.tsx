import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

interface BreadcrumbItem {
  readonly label: string
  readonly onClick?: () => void
  readonly href?: string
}

interface BreadcrumbNavProps {
  readonly items: readonly BreadcrumbItem[]
}

export default function BreadcrumbNav({ items }: BreadcrumbNavProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground flex-wrap"
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        const isFirst = i === 0
        return (
          <span key={item.label} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground/60 shrink-0" />}
            {isLast ? (
              <span className="inline-flex items-center gap-1 text-foreground truncate max-w-40 sm:max-w-56">
                {isFirst && <Home className="w-3 h-3 shrink-0" />}
                {item.label}
              </span>
            ) : item.href ? (
              <Link
                href={item.href}
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
              >
                {isFirst && <Home className="w-3 h-3 shrink-0" />}
                {item.label}
              </Link>
            ) : (
              <button
                onClick={item.onClick}
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
              >
                {isFirst && <Home className="w-3 h-3 shrink-0" />}
                {item.label}
              </button>
            )}
          </span>
        )
      })}
    </nav>
  )
}
