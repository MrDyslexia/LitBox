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
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm flex-wrap">
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        const isFirst = i === 0

        return (
          <span key={item.label} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
            {isLast ? (
              <span className="font-semibold text-foreground flex items-center gap-1 truncate max-w-30 sm:max-w-45">
                {isFirst && <Home className="w-3.5 h-3.5 shrink-0" />}
                {item.label}
              </span>
            ) : item.href ? (
              <Link
                href={item.href}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                {isFirst && <Home className="w-3.5 h-3.5 shrink-0" />}
                {item.label}
              </Link>
            ) : (
              <button
                onClick={item.onClick}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                {isFirst && <Home className="w-3.5 h-3.5 shrink-0" />}
                {item.label}
              </button>
            )}
          </span>
        )
      })}
    </nav>
  )
}
