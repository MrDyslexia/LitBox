"use client"

const BASE = process.env.NEXT_PUBLIC_API_URL ?? ""

interface Props {
  avatar: string           // iniciales fallback
  avatarUrl?: string | null
  name?: string
  size?: number            // px, default 36
  className?: string
  style?: React.CSSProperties
  roleColor?: string       // color fondo para iniciales
}

export function UserAvatar({ avatar, avatarUrl, name, size = 36, className, style, roleColor }: Props) {
  const dim = `${size}px`
  const textSize = size <= 28 ? "10px" : size <= 36 ? "11px" : size <= 48 ? "14px" : "18px"

  if (avatarUrl) {
    return (
      <img
        src={`${BASE}${avatarUrl}`}
        alt={name ?? avatar}
        className={className}
        style={{
          width: dim,
          height: dim,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
          ...style,
        }}
      />
    )
  }

  return (
    <div
      className={className}
      style={{
        width: dim,
        height: dim,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontSize: textSize,
        fontWeight: 700,
        color: "white",
        background: roleColor ?? "var(--primary)",
        ...style,
      }}
    >
      {avatar}
    </div>
  )
}
