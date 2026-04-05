"use client"

import { useEffect, useRef } from "react"

// Deriva la URL del WS a partir de la URL HTTP del backend
function getWsUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"
  return apiUrl
    .replace(/^https:\/\//, "wss://")
    .replace(/^http:\/\//, "ws://")
    .replace(/\/$/, "") + "/ws"
}

export function useBoletasSync(onRefresh: () => void) {
  // Ref para evitar dependencia en el efecto y siempre llamar a la versión más reciente
  const onRefreshRef = useRef(onRefresh)
  onRefreshRef.current = onRefresh

  useEffect(() => {
    const wsUrl = getWsUrl()
    let ws: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout>
    let destroyed = false

    function connect() {
      if (destroyed) return

      ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        if (destroyed) { ws?.close(); return }
        if (process.env.NODE_ENV === "development") console.log("[WS] Conectado al servidor")
      }

      ws.onmessage = () => {
        onRefreshRef.current()
      }

      ws.onclose = () => {
        if (!destroyed) {
          if (process.env.NODE_ENV === "development") console.log("[WS] Conexión cerrada, reconectando en 3s...")
          reconnectTimer = setTimeout(connect, 3000)
        }
      }

      ws.onerror = () => {
        // onclose se dispara automáticamente tras onerror
      }
    }

    // Pequeño delay: evita crear el WS si React StrictMode desmonta
    // el componente inmediatamente tras montarlo (evita el warning del browser)
    const initTimer = setTimeout(connect, 50)

    return () => {
      destroyed = true
      clearTimeout(initTimer)
      clearTimeout(reconnectTimer)
      if (ws) {
        ws.onclose = null  // evita reintentos al cerrar intencionalmente
        ws.onerror = null
        ws.close()
      }
    }
  }, [])
}
