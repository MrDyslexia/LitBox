#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/Backend"
FRONTEND="$ROOT/Frontend"
BACKEND_PORT=3001
FRONTEND_PORT=3000
BACKEND_LOG="$ROOT/backend.log"
FRONTEND_LOG="$ROOT/frontend.log"

# ── Colores ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
ok()   { echo -e "${GREEN}[OK]${NC}  $*"; }
info() { echo -e "${CYAN}[INFO]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
fail() { echo -e "${RED}[FAIL]${NC} $*"; }

# ── Limpieza de procesos anteriores ─────────────────────────────────────────
info "Deteniendo procesos anteriores en puertos $BACKEND_PORT y $FRONTEND_PORT..."
fuser -k ${BACKEND_PORT}/tcp 2>/dev/null && warn "Puerto $BACKEND_PORT liberado" || true
fuser -k ${FRONTEND_PORT}/tcp 2>/dev/null && warn "Puerto $FRONTEND_PORT liberado" || true
sleep 1

# ── Iniciar Backend ──────────────────────────────────────────────────────────
info "Iniciando Backend (puerto $BACKEND_PORT)..."
cd "$BACKEND"
bun dev > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$ROOT/.backend.pid"

# ── Iniciar Frontend ─────────────────────────────────────────────────────────
info "Iniciando Frontend (puerto $FRONTEND_PORT)..."
cd "$FRONTEND"
bun dev > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$ROOT/.frontend.pid"

# ── Esperar que los servicios arranquen ──────────────────────────────────────
echo ""
info "Esperando que los servicios arranquen (máx 30s)..."

wait_for_port() {
  local port=$1 label=$2 timeout=30 elapsed=0
  while ! curl -s "http://localhost:$port" > /dev/null 2>&1; do
    sleep 1; elapsed=$((elapsed + 1))
    if [ $elapsed -ge $timeout ]; then
      fail "$label no respondió en ${timeout}s. Revisa el log."
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

CORS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X OPTIONS "http://localhost:$BACKEND_PORT/api/auth/me" \
  -H "Origin: https://blocktype.cl" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -D /tmp/cors_headers.txt)

echo ""
info "Headers de respuesta OPTIONS:"
grep -i "access-control" /tmp/cors_headers.txt || warn "No se encontraron headers CORS"

# Contar cuántas veces aparece Access-Control-Allow-Origin
ORIGIN_COUNT=$(grep -ic "access-control-allow-origin" /tmp/cors_headers.txt 2>/dev/null || echo 0)
ORIGIN_VALUE=$(grep -i "access-control-allow-origin" /tmp/cors_headers.txt | head -1 || echo "")

echo ""
if [ "$ORIGIN_COUNT" -gt 1 ]; then
  fail "CORS DUPLICADO: Access-Control-Allow-Origin aparece $ORIGIN_COUNT veces"
elif [ "$ORIGIN_COUNT" -eq 1 ]; then
  ok "CORS OK: header único → $ORIGIN_VALUE"
else
  fail "CORS AUSENTE: no hay Access-Control-Allow-Origin en la respuesta preflight"
fi

# ── Verificar que el frontend usa la URL correcta del backend ────────────────
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
echo -e "  Backend PID:  $BACKEND_PID  → logs: $BACKEND_LOG"
echo -e "  Frontend PID: $FRONTEND_PID → logs: $FRONTEND_LOG"
echo -e ""
echo -e "  Para detener:  kill \$(cat $ROOT/.backend.pid) \$(cat $ROOT/.frontend.pid)"
echo -e "  Backend logs:  tail -f $BACKEND_LOG"
echo -e "  Frontend logs: tail -f $FRONTEND_LOG"
echo -e "${CYAN}══════════════════════════════════════════${NC}"
