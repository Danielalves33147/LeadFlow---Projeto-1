#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "[1/3] Backend — testes e empacotamento"
cd "$ROOT/backend"
mvn clean test
mvn -DskipTests package

echo "[2/3] Frontend — dependências, tipagem e build"
cd "$ROOT/frontend"
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi
npm run typecheck
npm run build

echo "[3/3] Docker Compose — validação de configuração"
cd "$ROOT"
if command -v docker >/dev/null 2>&1; then
  docker compose config >/dev/null
else
  echo "Docker não encontrado; validação do Compose ignorada."
fi

echo "LeadFlow validado com sucesso."
