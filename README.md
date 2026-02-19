# MedVault

Patient-controlled medical records on DAML smart contracts (Canton SDK 3.4.10).

## Project Structure

```
MedVault/
├── daml/                      # DAML smart contracts
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
│   └── Test/                  # Test scripts (16 tests)
├── frontend/                  # React + TypeScript frontend
│   └── src/
│       ├── App.tsx            # DamlLedger provider + role routing
│       ├── components/        # Role-based dashboards
│       └── services/          # Ledger configuration
├── deployment/                # Docker deployment
│   ├── canton.conf            # Canton node configuration
│   ├── docker-compose.yml     # Full stack orchestration
│   ├── Dockerfile             # Multi-stage frontend build
│   └── nginx.conf             # SPA routing + API proxy
├── scripts/                   # Build and deploy automation
│   ├── build.sh               # Build contracts + frontend
│   ├── deploy.sh              # Deploy full stack
│   └── setup-parties.sh       # Allocate standard parties
└── docs/
    ├── ARCHITECTURE.md        # System design and data flows
    └── API.md                 # HTTP JSON API reference
```

## Prerequisites

- DAML SDK 3.4.10
- Node.js 18+
- Docker & Docker Compose (for deployment)

## Quick Start

### Build and test contracts

```bash
dpm build
dpm test
```

### Run frontend (development)

```bash
cd frontend
yarn install
yarn start
```

### Deploy full stack (Docker)

```bash
./scripts/build.sh
./scripts/deploy.sh
```

Services will be available at:
- Frontend: http://localhost:3000
- JSON API: http://localhost:7575
- Ledger API: localhost:6865

## Development Workflow

1. Edit DAML contracts in `daml/`
2. Run `dpm build && dpm test` to verify
3. Generate TypeScript bindings: `dpm codegen-js .daml/dist/MedVault-0.0.1.dar -o frontend/src/@daml.js`
4. Run frontend with `npm start` in `frontend/`

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — actors, contract model, data flows, privacy model
- [API Reference](docs/API.md) — HTTP JSON API endpoints and examples
