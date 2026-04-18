"use client"

import * as React from "react"

interface Props {
  readonly title: string
  readonly description?: string
  readonly action?: React.ReactNode
}

export default function PageHeader({ title, description, action }: Props) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight text-pretty">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground text-sm mt-1 text-pretty">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
