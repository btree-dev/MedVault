# MedVault

Patient-controlled medical records on Daml smart contracts (Canton 3.4.x).

## Project Structure

```
MedVault/
├── daml/                      # Daml smart contracts
│   ├── Types.daml             # Shared data types and enums
│   ├── Prescription.daml      # Prescription template
│   ├── LabOrder.daml          # Lab order template
│   ├── LabResults.daml        # Lab result access and reports
│   ├── PharmacyAccess.daml    # Pharmacy access with dispensing
│   ├── DiagnosticAccess.daml  # Diagnostic center access
│   ├── DoctorAccess.daml      # Time-limited doctor access
│   ├── HealthRecord.daml      # Core patient health record
│   ├── Operator.daml          # Onboarding workflow
│   ├── Audit.daml             # Audit trail
│   └── Test/                  # Test scripts
├── frontend/                  # React + TypeScript frontend
│   └── src/
│       ├── App.tsx            # DamlLedger provider + role routing
│       ├── components/        # Role-based dashboards
│       └── services/          # Canton v2 API client + React hooks
├── deployment/                # Docker deployment
│   ├── canton.conf            # Canton node configuration
│   ├── bootstrap.sc           # Topology setup + party allocation
│   ├── docker-compose.yml     # Full stack orchestration
│   ├── Dockerfile             # Multi-stage frontend build
│   └── nginx.conf             # SPA routing + API proxy
└── scripts/                   # Build and deploy automation
    ├── build.sh               # Build Daml contracts
    ├── deploy.sh              # Start sandbox + create parties
    └── setup-parties.sh       # Allocate parties and users via v2 HTTP API
```

## Prerequisites

- [Daml SDK 3.4.10](https://docs.daml.com/getting-started/installation.html) (`dpm` CLI)
- Node.js 18+ and Yarn
- Docker and Docker Compose

## Quick Start (Local Sandbox)

The fastest way to run the application for development.

### 1. Build the Daml contracts

```bash
./scripts/build.sh
```

This compiles the Daml source and produces `.daml/dist/MedVault-0.0.2.dar`.

### 2. Start the Canton sandbox and create parties

```bash
./scripts/deploy.sh
```

This runs `dpm sandbox` which starts a full Canton node (sequencer + mediator + participant + JSON API) in a single process. It then:
- Uploads the DAR automatically via the `--dar` flag
- Waits for the JSON API to be ready on port 7575
- Allocates parties and creates ledger API users via `scripts/setup-parties.sh`

You can also run these steps separately:

```bash
# Start sandbox (runs in foreground)
dpm sandbox --dar .daml/dist/MedVault-0.0.2.dar --json-api-port 7575

# In another terminal, set up parties
./scripts/setup-parties.sh
```

### 3. Start the frontend dev server

In a separate terminal:

```bash
cd frontend
yarn install
REACT_APP_LEDGER_URL= PORT=3001 yarn start
```

The dev server runs on **http://localhost:3001** with hot-reload. The CRA proxy forwards `/v2/` requests to Canton on `localhost:7575`.

> **Important:** `REACT_APP_LEDGER_URL=` (set to empty) is required to override the value in `frontend/.env` and use the CRA proxy for local development.

### 4. Open the app

Navigate to **http://localhost:3000**. You'll see the Development Login screen with preconfigured users:

| User | Role | Description |
|------|------|-------------|
| Alice | Patient | Test patient |
| Dr. Smith | Doctor | Primary care doctor |
| Dr. Jones | Doctor | Specialist |
| PharmaCorp | Pharmacy | Pharmacy provider |
| LabCorp | Lab | Diagnostic center |
| Operator | Operator | System operator |

### Typical workflow

1. Log in as **Operator** → Create Operator Contract → Invite a patient (enter Alice's party ID)
2. Log in as **Alice (Patient)** → Accept the invite (fill in patient info) → Health record is created
3. As Alice, grant doctor access to Dr. Smith (enter DrSmith's party ID)
4. Log in as **Dr. Smith (Doctor)** → View Alice's record, add notes, write prescriptions
5. Log in as **PharmaCorp** or **LabCorp** to see prescriptions or lab orders

### Stop the sandbox

Press `Ctrl+C` in the terminal running `deploy.sh`, or kill the sandbox process.

> **Note:** The sandbox uses in-memory storage, so all data is lost when it stops.

## Docker Deployment (production-like)

For a production-like setup with nginx serving the frontend:

```bash
# Build contracts and Docker images
./scripts/build.sh
docker compose -f deployment/docker-compose.yml build

# Start the stack
docker compose -f deployment/docker-compose.yml up -d
```

This starts Canton with `bootstrap.sc` (which handles synchronizer setup, party allocation, and user creation) and nginx serving the frontend on port 3000.

```bash
# Stop the stack
docker compose -f deployment/docker-compose.yml down
```

## Building Daml Contracts

```bash
# Build
dpm build

# Run tests
dpm test
```

## Architecture

### Backend (Canton)

Canton runs as a single-node deployment with:
- **Sequencer** (BFT type) — orders transactions
- **Mediator** — confirms transactions
- **Participant** — hosts parties and executes Daml contracts
- **HTTP JSON API** (built-in, port 7575) — REST interface for the frontend

For local development, `dpm sandbox` handles topology automatically. The `scripts/setup-parties.sh` script then allocates parties and creates users via the v2 HTTP API. For Docker deployment, `bootstrap.sc` handles both topology and party/user setup.

### Frontend

The React frontend communicates with Canton via the **v2 HTTP JSON API**:

- `POST /v2/commands/submit-and-wait` — create contracts and exercise choices
- `POST /v2/state/active-contracts` — query the active contract set
- `GET /v2/users/{id}` — look up a user's primary party

Key files:
- `services/ledger.ts` — `LedgerService` class wrapping the v2 API
- `services/DamlLedger.tsx` — React context provider with `useParty()`, `useLedger()`, and `useStreamQueries()` hooks

### Ports

| Port | Service |
|------|---------|
| 3000 | Frontend (Docker/nginx) |
| 3001 | Frontend (dev server) |
| 6865 | Canton Ledger API (gRPC) |
| 6866 | Canton Admin API (gRPC) |
| 7575 | Canton HTTP JSON API |

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — actors, contract model, data flows, privacy model
- [API Reference](docs/API.md) — HTTP JSON API endpoints and examples
