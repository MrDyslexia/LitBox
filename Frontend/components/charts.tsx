"use client"

import * as React from "react"
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const CHART_PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

/* ─── Horizontal bar distribution ─────────────────────────── */

interface HBarDatum {
  readonly label: string
  readonly value: number
}

interface DistributionBarsProps {
  readonly data: ReadonlyArray<HBarDatum>
  readonly max?: number
  readonly height?: number
  readonly valueFormatter?: (v: number) => string
}

export function DistributionBars({
  data,
  max,
  height,
  valueFormatter = (v) => String(v),
}: DistributionBarsProps) {
  if (!data.length) return null
  const chartData = [...data].sort((a, b) => b.value - a.value)
  const domainMax = max ?? Math.max(...chartData.map((d) => d.value)) * 1.1
  const h = height ?? Math.max(160, chartData.length * 44)

  return (
    <div style={{ height: h }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 64, bottom: 4, left: 0 }}
          barCategoryGap={10}
        >
          <XAxis type="number" hide domain={[0, domainMax]} />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={140}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--popover-foreground)",
            }}
            formatter={(value: number) => [valueFormatter(value), "Total"]}
          />
          <Bar dataKey="value" radius={[4, 4, 4, 4]} background={{ fill: "var(--muted)", radius: 4 }}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
            ))}
            <LabelList
              dataKey="value"
              position="right"
              formatter={(v: unknown) =>
                typeof v === "number" ? valueFormatter(v) : String(v)
              }
              style={{ fill: "var(--foreground)", fontSize: 12, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ─── Radial progress ─────────────────────────────────────── */

interface RadialProgressProps {
  readonly value: number // 0 - 100
  readonly label?: string
  readonly size?: number
  readonly color?: string
  readonly trackColor?: string
  readonly children?: React.ReactNode
}

export function RadialProgress({
  value,
  size = 160,
  color = "var(--chart-1)",
  trackColor = "var(--muted)",
  children,
}: RadialProgressProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const data = [{ name: "v", value: clamped }]

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="78%"
          outerRadius="100%"
          barSize={10}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar
            background={{ fill: trackColor }}
            dataKey="value"
            cornerRadius={6}
            fill={color}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center flex-col gap-0.5 text-center">
        {children}
      </div>
    </div>
  )
}

/* ─── Donut for estado breakdown ──────────────────────────── */

interface DonutDatum {
  readonly name: string
  readonly value: number
  readonly color: string
}

interface EstadoDonutProps {
  readonly data: ReadonlyArray<DonutDatum>
  readonly centerLabel?: string
  readonly centerValue?: React.ReactNode
  readonly size?: number
}

export function EstadoDonut({ data, centerLabel, centerValue, size = 190 }: EstadoDonutProps) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
                color: "var(--popover-foreground)",
              }}
              formatter={(v: number, n: string) => [v, n]}
            />
            <Pie
              data={[...data]}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={2}
              stroke="var(--card)"
              strokeWidth={2}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center flex-col gap-0.5 pointer-events-none">
          {centerLabel && (
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{centerLabel}</span>
          )}
          <span className="text-2xl font-black text-foreground tabular-nums tracking-tight">
            {centerValue ?? total}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full max-w-[240px]">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
            <span className="text-[11px] text-muted-foreground truncate flex-1">{d.name}</span>
            <span className="text-[11px] font-bold text-foreground tabular-nums shrink-0">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
