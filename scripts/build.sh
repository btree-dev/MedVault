#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=== Building DAML contracts ==="
cd "$PROJECT_ROOT"
dpm build

echo "=== Build complete ==="
echo "DAR: .daml/dist/MedVault-0.0.2.dar"
