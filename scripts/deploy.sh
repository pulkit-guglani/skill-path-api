#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Skill Path API deploy helper"
echo ""

if command -v railway >/dev/null 2>&1; then
  RAILWAY=(railway)
elif npx --yes @railway/cli --version >/dev/null 2>&1; then
  RAILWAY=(npx --yes @railway/cli)
else
  echo "Install Railway CLI:"
  echo "  npm install -g @railway/cli"
  echo "  railway login"
  exit 1
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set in this shell."
  echo "Create a Neon database first, then export DATABASE_URL."
  echo ""
  echo "  export DATABASE_URL='postgresql://...?sslmode=require'"
  exit 1
fi

if [[ -z "${GEMINI_API_KEY:-}" ]]; then
  echo "Warning: GEMINI_API_KEY is not set. Generation will fail unless GEMINI_MOCK=true."
fi

if [[ -z "${YOUTUBE_API_KEY:-}" ]]; then
  echo "Warning: YOUTUBE_API_KEY is not set. Video search will fail unless GEMINI_MOCK=true."
fi

echo "==> Linking Railway project (skip if already linked)..."
"${RAILWAY[@]}" link || true

echo "==> Setting Railway variables..."
"${RAILWAY[@]}" variables set DATABASE_URL="$DATABASE_URL"
"${RAILWAY[@]}" variables set GEMINI_MOCK="${GEMINI_MOCK:-false}"

if [[ -n "${GEMINI_API_KEY:-}" ]]; then
  "${RAILWAY[@]}" variables set GEMINI_API_KEY="$GEMINI_API_KEY"
fi

if [[ -n "${YOUTUBE_API_KEY:-}" ]]; then
  "${RAILWAY[@]}" variables set YOUTUBE_API_KEY="$YOUTUBE_API_KEY"
fi

echo "==> Deploying..."
"${RAILWAY[@]}" up --detach

echo ""
echo "==> Done. Fetch your public URL:"
echo "  ${RAILWAY[*]} domain"
echo "  ${RAILWAY[*]} status"
echo ""
echo "Health check:"
echo "  curl https://YOUR-RAILWAY-DOMAIN.up.railway.app/api/health"
