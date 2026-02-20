#!/usr/bin/env bash
set -euo pipefail

echo "=== Allocating parties on the ledger ==="

LEDGER_HOST="${LEDGER_HOST:-localhost}"
LEDGER_PORT="${LEDGER_PORT:-6865}"

allocate_party() {
  local party_name="$1"
  echo "  Allocating party: $party_name"
  grpcurl -plaintext -d "{\"party_id_hint\": \"$party_name\"}" \
    "$LEDGER_HOST:$LEDGER_PORT" \
    com.daml.ledger.api.v2.admin.PartyManagementService/AllocateParty 2>/dev/null \
    || echo "  (party may already exist)"
}

allocate_party "Operator"
allocate_party "Alice"
allocate_party "Bob"
allocate_party "DrSmith"
allocate_party "DrJones"
allocate_party "PharmaCorp"
allocate_party "LabCorp"

echo "=== Party allocation complete ==="
