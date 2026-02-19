#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=== Building DAML contracts ==="
cd "$PROJECT_ROOT"
dpm build

echo "=== Generating TypeScript bindings ==="
dpm codegen-js \
  .daml/dist/MedVault-0.0.1.dar \
  -o frontend/src/@daml.js

echo "=== Building frontend ==="
cd "$PROJECT_ROOT/frontend"
yarn install
yarn build

echo "=== Build complete ==="
