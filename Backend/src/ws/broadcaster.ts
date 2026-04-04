// ─── Broadcaster WebSocket ────────────────────────────────────────────────────
// Mantiene el conjunto de clientes conectados y emite eventos a todos ellos.
// Los controladores llaman a broadcast() tras cada mutación de boleta.

export type WsEvent =
  | { type: "boleta:created"; boletaId: string }
  | { type: "boleta:updated"; boletaId: string }
  | { type: "boleta:deleted"; boletaId: string }

interface WsClient {
  send(data: string | Uint8Array): void
  readyState: number
}

// 1 = OPEN en la spec de WebSocket (igual para Bun y el browser)
const OPEN = 1

const clients = new Set<WsClient>()

export function addClient(ws: WsClient) {
  clients.add(ws)
}

export function removeClient(ws: WsClient) {
  clients.delete(ws)
}

export function clientCount() {
  return clients.size
}

export function broadcast(event: WsEvent) {
  const payload = JSON.stringify(event)
  for (const client of clients) {
    if (client.readyState === OPEN) {
      try {
        client.send(payload)
      } catch {
        clients.delete(client)
      }
    } else {
      clients.delete(client)
    }
  }
}
