import type { UserRole } from "./types"

export interface User {
  _id: string
  name: string
  email: string
  role: UserRole
  avatar: string
  esNuevo: boolean
}
