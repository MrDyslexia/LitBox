// Backend/src/config/env.ts
const required = (key: string): string => {
  const value = process.env[key]
  if (!value && process.env.NODE_ENV === "production") throw new Error(`Variable de entorno requerida: ${key}`)
  return value || ""
}

export const env = {
  port: Number(process.env.PORT ?? 3001),
  nodeEnv: process.env.NODE_ENV ?? "development",
  isDev: (process.env.NODE_ENV ?? "development") === "development",
  cors: {
    origin: (() => {
      const originEnv = process.env.CORS_ORIGIN || "http://localhost:3000"
      // Soporta múltiples orígenes separados por coma
      if (originEnv.includes(",")) {
        return originEnv.split(",").map(o => o.trim())
      }
      return originEnv
    })(),
  },
  mongodb: {
    uri: process.env.MONGODB_URI ?? "mongodb://localhost:27017/litbox",
  },
  jwt: {
    secret: (() => {
      const s = process.env.JWT_SECRET
      if (!s) throw new Error("JWT_SECRET debe estar configurado")
      return s
    })(),
    expiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  },
  uploads: {
    dir: process.env.UPLOAD_DIR ?? "./uploads",
    maxSize: Number(process.env.MAX_FILE_SIZE ?? 5_242_880),
    allowedTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  },
  smtp: {
    host: process.env.SMTP_HOST ?? "",
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
    from: process.env.SMTP_FROM ?? "LitBox <noreply@blocktype.cl>",
  },
}