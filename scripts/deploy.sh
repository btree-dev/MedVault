#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

DAR_FILE="$PROJECT_ROOT/.daml/dist/MedVault-0.0.2.dar"
if [ ! -f "$DAR_FILE" ]; then
  echo "ERROR: DAR file not found at $DAR_FILE"
  echo "Run ./scripts/build.sh first."
  exit 1
fi

# Cleanup on exit
cleanup() {
  echo ""
  echo "Shutting down sandbox..."
  kill "$SANDBOX_PID" 2>/dev/null
  wait "$SANDBOX_PID" 2>/dev/null
}
trap cleanup EXIT INT TERM

echo "=== Starting Canton sandbox ==="
cd "$PROJECT_ROOT"
dpm sandbox \
  --dar "$DAR_FILE" \
  --json-api-port 7575 &
SANDBOX_PID=$!

echo "=== Waiting for Canton sandbox to be ready ==="
until curl -sf http://localhost:7575/v2/state/ledger-end > /dev/null 2>&1; do
  echo "  Waiting for JSON API on port 7575..."
  sleep 3
done
echo "  JSON API is up."

echo "=== Setting up parties and users ==="
"$SCRIPT_DIR/setup-parties.sh"

echo ""
echo "=== Sandbox ready ==="
echo "Ledger API: localhost:6865"
echo "JSON API:   localhost:7575"
echo ""
echo "Start frontend with:"
echo "  cd frontend && yarn serve"
echo ""
echo "To add more parties later:"
echo "  ./scripts/setup-parties.sh NewParty1 NewParty2"
echo ""
echo "Press Ctrl+C to stop the sandbox."

wait $SANDBOX_PID
