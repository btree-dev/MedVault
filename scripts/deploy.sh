#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=== Starting Canton and services ==="
cd "$PROJECT_ROOT/deployment"
docker compose up -d

echo "=== Waiting for Canton to be ready ==="
until docker compose exec canton grpcurl -plaintext localhost:6865 list 2>/dev/null; do
  echo "  Waiting for ledger API..."
  sleep 5
done

echo "=== Uploading DAR ==="
cd "$PROJECT_ROOT"
dpm ledger upload-dar .daml/dist/MedVault-0.0.1.dar --host localhost --port 6865

echo "=== Setting up parties ==="
"$SCRIPT_DIR/setup-parties.sh"

echo "=== Deployment complete ==="
echo "Frontend:  http://localhost:3000"
echo "JSON API:  http://localhost:7575"
echo "Ledger:    localhost:6865"
