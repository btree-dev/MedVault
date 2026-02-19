# MedVault

MedVault is a DAML smart-contract project for managing and sharing health records with explicit, patient-controlled access.

## Project structure

- `daml.yaml` — project configuration
- `daml/HealthRecords.daml` — core data types and templates for:
  - patient profile and medical history
  - doctor, pharmacy, and diagnostic-center access
  - prescriptions, lab orders, and lab result reporting

## Prerequisites

- DAML SDK `3.4.10` (see `daml.yaml`)

## Build

```bash
daml build
```

## Run scripts/tests

Use DAML Script from modules in `daml/` as needed, for example:

```bash
daml test
```

## Notes

This repository currently contains the initial smart-contract model and can be extended with scripts, tests, and integration code.
