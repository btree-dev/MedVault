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
    ├── build.sh               # Build contracts + frontend
    ├── deploy.sh              # Deploy full stack
    └── setup-parties.sh       # Allocate standard parties
```

## Prerequisites

- [Daml SDK 3.4.10](https://docs.daml.com/getting-started/installation.html) (`dpm` CLI)
- Node.js 18+ and Yarn
- Docker and Docker Compose

## Quick Start (Docker — full stack)

This is the simplest way to run the complete application.

### 1. Build the Daml contracts

```bash
dpm build
```

This produces `.daml/dist/MedVault-0.0.1.dar`.

### 2. Start Canton and the frontend

```bash
docker compose -f deployment/docker-compose.yml up -d
```

This starts:
- **Canton** (sequencer + mediator + participant with built-in JSON API) — automatically bootstraps the synchronizer, allocates parties, and creates users via `bootstrap.sc`
- **Frontend** (nginx serving the React build, proxying `/v2/` to Canton)

### 3. Upload the DAR

Once Canton is healthy (the frontend container waits for this automatically), upload the compiled contracts:

```bash
# Wait for Canton to be ready
until grpcurl -plaintext localhost:6865 list 2>/dev/null; do sleep 3; done

# Upload the DAR
docker compose -f deployment/docker-compose.yml exec canton \
  /app/bin/canton ledger upload-dar --host localhost --port 6865 /app/daml/.daml/dist/MedVault-0.0.1.dar
```

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

### Stop the stack

```bash
docker compose -f deployment/docker-compose.yml down
```

> **Note:** Canton uses in-memory storage, so all data is lost when containers stop.

## Development Setup (frontend hot-reload)

For faster frontend iteration, run Canton in Docker and the frontend locally with hot-reload.

### 1. Start Canton only

```bash
docker compose -f deployment/docker-compose.yml up -d canton
```

Wait for it to be healthy, then upload the DAR (see step 3 above).

### 2. Start the frontend dev server

```bash
cd frontend
yarn install
REACT_APP_LEDGER_URL= PORT=3001 yarn start
```

- The dev server runs on **http://localhost:3001**
- `REACT_APP_LEDGER_URL=` (empty) tells the app to use relative URLs, which the CRA proxy forwards to Canton
- The `proxy` field in `package.json` routes API requests to `http://localhost:7575` (Canton's JSON API)

> **Important:** The `frontend/.env` file may contain a remote `REACT_APP_LEDGER_URL`. Setting it to empty on the command line overrides this for local development.

### 3. Make changes

Edit components in `frontend/src/components/` — the browser will hot-reload automatically.

## Building Daml Contracts

```bash
# Build
dpm build

# Run tests
dpm test

# Regenerate TypeScript bindings (after changing .daml files)
dpm codegen-js .daml/dist/MedVault-0.0.1.dar -o frontend/src/@daml.js
```

After regenerating bindings, restart the frontend dev server.

## Architecture

### Backend (Canton)

Canton runs as a single-node deployment with:
- **Sequencer** (BFT type) — orders transactions
- **Mediator** — confirms transactions
- **Participant** — hosts parties and executes Daml contracts
- **HTTP JSON API** (built-in, port 7575) — REST interface for the frontend

On startup, `bootstrap.sc` automatically:
1. Creates the synchronizer (wires sequencer + mediator)
2. Connects the participant
3. Allocates parties: Operator, Alice, Bob, DrSmith, DrJones, PharmaCorp, LabCorp
4. Creates ledger API users with appropriate read/write permissions

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
