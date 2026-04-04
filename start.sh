#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/Backend"
FRONTEND="$ROOT/Frontend"
BACKEND_PORT=3001
FRONTEND_PORT=3000
SESSION="LitBox"

# ── Colores ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
ok()   { echo -e "${GREEN}[OK]${NC}  $*"; }
info() { echo -e "${CYAN}[INFO]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
fail() { echo -e "${RED}[FAIL]${NC} $*"; }

# ── Matar sesión tmux anterior si existe ─────────────────────────────────────
if tmux has-session -t "$SESSION" 2>/dev/null; then
  info "Cerrando sesión tmux '$SESSION' anterior..."
  tmux kill-session -t "$SESSION"
fi

# ── Liberar puertos ──────────────────────────────────────────────────────────
info "Liberando puertos $BACKEND_PORT y $FRONTEND_PORT..."
fuser -k ${BACKEND_PORT}/tcp 2>/dev/null && warn "Puerto $BACKEND_PORT liberado" || true
fuser -k ${FRONTEND_PORT}/tcp 2>/dev/null && warn "Puerto $FRONTEND_PORT liberado" || true
sleep 1

# ── Crear sesión tmux LitBox ─────────────────────────────────────────────────
info "Creando sesión tmux '$SESSION'..."

# Ventana 0: Backend
tmux new-session -d -s "$SESSION" -n "Backend" -x 220 -y 50
tmux send-keys -t "$SESSION:Backend" "cd '$BACKEND' && bun dev" Enter

# Ventana 1: Frontend
tmux new-window -t "$SESSION" -n "Frontend"
tmux send-keys -t "$SESSION:Frontend" "cd '$FRONTEND' && bun dev" Enter

# ── Esperar que los servicios arranquen ──────────────────────────────────────
echo ""
info "Esperando que los servicios arranquen (máx 30s)..."

wait_for_port() {
  local port=$1 label=$2 timeout=30 elapsed=0
  while ! curl -s "http://localhost:$port" > /dev/null 2>&1; do
    sleep 1; elapsed=$((elapsed + 1))
    if [ $elapsed -ge $timeout ]; then
      fail "$label no respondió en ${timeout}s."
      return 1
    fi
  done
  ok "$label listo en puerto $port (${elapsed}s)"
}

wait_for_port $BACKEND_PORT "Backend"
wait_for_port $FRONTEND_PORT "Frontend"

# ── Verificar CORS ───────────────────────────────────────────────────────────
echo ""
info "Verificando CORS del backend desde origen https://blocktype.cl..."

curl -s -o /dev/null \
  -X OPTIONS "http://localhost:$BACKEND_PORT/api/auth/me" \
  -H "Origin: https://blocktype.cl" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -D /tmp/cors_headers.txt

ORIGIN_COUNT=$(grep -ic "access-control-allow-origin" /tmp/cors_headers.txt 2>/dev/null || echo 0)
ORIGIN_VALUE=$(grep -i "access-control-allow-origin" /tmp/cors_headers.txt | head -1 || echo "")

if [ "$ORIGIN_COUNT" -gt 1 ]; then
  fail "CORS DUPLICADO: Access-Control-Allow-Origin aparece $ORIGIN_COUNT veces"
elif [ "$ORIGIN_COUNT" -eq 1 ]; then
  ok "CORS OK: header único → $ORIGIN_VALUE"
else
  fail "CORS AUSENTE: no hay Access-Control-Allow-Origin en la respuesta preflight"
fi

# ── Verificar NEXT_PUBLIC_API_URL ────────────────────────────────────────────
echo ""
info "Verificando NEXT_PUBLIC_API_URL en el frontend..."
ENV_VALUE=$(grep "NEXT_PUBLIC_API_URL" "$FRONTEND/.env.local" 2>/dev/null || echo "NO ENCONTRADO")
if echo "$ENV_VALUE" | grep -q "localhost"; then
  fail "Frontend apunta a localhost: $ENV_VALUE"
elif echo "$ENV_VALUE" | grep -q "http"; then
  ok "Frontend URL configurada: $ENV_VALUE"
else
  warn "NEXT_PUBLIC_API_URL: $ENV_VALUE"
fi

# ── Resumen ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}══════════════════════════════════════════${NC}"
echo -e "  Sesión tmux:  $SESSION"
echo -e "  Ventana 0:    Backend  (puerto $BACKEND_PORT)"
echo -e "  Ventana 1:    Frontend (puerto $FRONTEND_PORT)"
echo -e ""
echo -e "  Adjuntarse:   tmux attach -t $SESSION"
echo -e "  Ventanas:     Ctrl+B → 0 (Backend) | 1 (Frontend)"
echo -e "  Detener:      tmux kill-session -t $SESSION"
echo -e "${CYAN}══════════════════════════════════════════${NC}"
echo ""

# ── Adjuntarse a la sesión si se está en un terminal interactivo ─────────────
if [ -t 1 ]; then
  info "Adjuntándose a la sesión tmux '$SESSION'..."
  tmux attach -t "$SESSION"
fi
