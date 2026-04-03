const required = (key: string): string => {
  const value = process.env[key]
  if (!value) throw new Error(`Variable de entorno requerida: ${key}`)
  return value
}

export const env = {
  port: Number(process.env.PORT ?? 3001),
  nodeEnv: process.env.NODE_ENV ?? "development",
  isDev: (process.env.NODE_ENV ?? "development") === "development",

  mongodb: {
    uri: process.env.MONGODB_URI ?? "mongodb://localhost:27017/litbox",
  },

  jwt: {
    secret: process.env.JWT_SECRET ?? "dev_secret_inseguro",
    expiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  },

  cors: {
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  },

  uploads: {
    dir: process.env.UPLOAD_DIR ?? "./uploads",
    maxSize: Number(process.env.MAX_FILE_SIZE ?? 5_242_880), // 5MB
    allowedTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  },
}
