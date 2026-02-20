# MedVault - Development Notes

## Architecture
- **Canton version**: GHCR image `ghcr.io/digital-asset/decentralized-canton-sync/docker/canton:0.5.12` (Canton 3.4.12-snapshot, Daml Libraries 3.4.11)
- **API**: Canton v2 HTTP JSON API (built into Canton image — no separate json-api container needed)
- **Frontend**: React 18 + Semantic UI React, custom `LedgerService` wrapping v2 endpoints
- **No @daml/react or @daml/ledger**: These packages speak the deprecated v1 protocol. Replaced with custom `services/ledger.ts` and `services/DamlLedger.tsx`

## Canton v2 HTTP JSON API
- Template IDs use format `#PackageName:Module:Template` (e.g. `#MedVault:Operator:PatientInvite`)
- Key endpoints:
  - `POST /v2/commands/submit-and-wait` — create contracts and exercise choices
  - `POST /v2/state/active-contracts` — query active contract set (ACS)
  - `GET /v2/state/ledger-end` — get current offset (needed before ACS query)
  - `GET /v2/users/{id}` — user lookup (returns primaryParty)
- Auth: uses `userId` + `actAs`/`readAs` fields (no JWT tokens in dev mode)

## Canton 3.x Configuration
- Sequencer type must be `BFT` (not `reference` — that was removed in 3.x)
- Bootstrap via `bootstrap.sc` mounted at `/app/bootstrap.sc`
  - Uses `bootstrap.synchronizer_local()` and `connect_local()` for topology
  - Party allocation: `participant1.parties.enable(name)`
  - User creation: `participant1.ledger_api.users.create(...)` with `actAs`, `readAs`, `primaryParty`
- DAR upload: use gRPC inside Canton container (HTTP multipart upload has issues)

## Development Workflow
- **IMPORTANT**: Use `dpm` instead of `daml` for all CLI commands (build, sandbox, etc.)
- **Build**: `dpm build` (or `./scripts/build.sh`)
- **Full local deploy**: `./scripts/deploy.sh` — builds DAR, starts sandbox on port 7575, allocates parties/users
- **Sandbox only**: `dpm sandbox --dar .daml/dist/MedVault-0.0.2.dar --json-api-port 7575`
- **Frontend dev server**: `cd frontend && yarn serve` (proxies to localhost:7575, runs on port 3001)
- **Add parties**: `./scripts/setup-parties.sh` (defaults) or `./scripts/setup-parties.sh NewParty1 NewParty2`
- **Docker deployment**: `docker compose -f deployment/docker-compose.yml up -d`
  - Dockerfile removes `.env` before build
  - nginx proxies `/v2/` to `canton:7575`

## File Structure
- `deployment/` — docker-compose.yml, canton.conf, bootstrap.sc, nginx.conf, Dockerfile
- `frontend/src/services/ledger.ts` — v2 API client (LedgerService class)
- `frontend/src/services/DamlLedger.tsx` — React context + hooks (useParty, useLedger, useStreamQueries)
- `frontend/src/components/` — role-based dashboards (Operator, Patient, Doctor, Pharmacy, Lab)
- `daml/` — Daml source files (Operator.daml, HealthRecord.daml, DoctorAccess.daml, etc.)

## Reference Examples
- Canton open-source examples are at `/home/btree-dev/dev/buidl/canton-open-source-3.4.10/examples`
- Use these as reference for Daml templates, Canton configuration, and sandbox setup patterns

## Common Pitfalls
- `@daml/ledger` npm packages only exist as `3.4.0-snapshot.*` versions — no stable 3.x releases
- Canton's HTTP API does not support CORS — must use a proxy (CRA proxy or nginx)
- ACS query requires `activeAtOffset` from `/v2/state/ledger-end`
- `useStreamQueries` polls every 3s (not a true WebSocket stream)
