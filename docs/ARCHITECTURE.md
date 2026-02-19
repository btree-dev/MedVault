# MedVault Architecture

## Overview

MedVault is a patient-controlled medical records system built on DAML smart contracts running on Canton. Patients own their health data and explicitly grant time-limited access to healthcare providers.

## Actors

| Actor | Role | Key Actions |
|-------|------|-------------|
| **Patient** | Data owner | Creates/updates health records, grants and revokes access |
| **Doctor** | Healthcare provider | Views patient history, creates prescriptions and lab orders |
| **Pharmacy** | Medication dispenser | Views prescriptions and patient allergies, acknowledges dispensing |
| **Diagnostic Center** | Lab/imaging facility | Receives lab orders, submits results |
| **Operator** | System administrator | Onboards patients via invite workflow |
| **Auditor** | Compliance observer | Views audit trail events |

## Contract Model

```
┌──────────────┐
│   Operator   │──── InvitePatient ────▶ PatientInvite ──── AcceptInvite ────▶ HealthRecord
└──────────────┘
                                                              │
                    ┌─────────────────────────────────────────┤
                    │                    │                     │
              GrantDoctorAccess   GrantPharmacyAccess   GrantDiagnosticAccess
                    │                    │                     │
                    ▼                    ▼                     ▼
             ┌─────────────┐    ┌───────────────┐    ┌─────────────────┐
             │ DoctorAccess │    │ PharmacyAccess │    │ DiagnosticAccess │
             └──────┬──────┘    └───────┬───────┘    └────────┬────────┘
                    │                   │                      │
          ┌────────┼────────┐    Acknowledge          SubmitLabResults
          │        │        │    Dispensing                     │
   CreatePrescription  CreateLabOrder                          ▼
          │        │                                  ┌────────────────┐
          ▼        ▼                                  │ LabResultReport │
   ┌──────────┐ ┌──────────┐                         └───────┬────────┘
   │Prescription│ │LabOrder │                                 │
   └──────────┘ └──────────┘                    GrantDoctorLabResultAccess
                                                              │
                                                              ▼
                                                ┌──────────────────────┐
                                                │ DoctorLabResultAccess │
                                                └──────────────────────┘

  ┌────────────────┐
  │ AuditObserver  │──── LogEvent ────▶ AuditEvent
  └────────────────┘
```

## Module Structure

```
daml/
├── Types.daml              # Shared data types and enums
├── Prescription.daml       # Prescription template
├── LabOrder.daml           # Lab order template
├── LabResults.daml         # DoctorLabResultAccess + LabResultReport
├── PharmacyAccess.daml     # Pharmacy access with dispensing
├── DiagnosticAccess.daml   # Diagnostic center access + result submission
├── DoctorAccess.daml       # Time-limited doctor access with choices
├── HealthRecord.daml       # Core patient record with grant choices
├── Operator.daml           # Onboarding workflow (Operator + PatientInvite)
├── Audit.daml              # Audit trail (AuditObserver + AuditEvent)
└── Test/                   # Test scripts
    ├── HealthRecordTest.daml
    ├── DoctorAccessTest.daml
    ├── PharmacyAccessTest.daml
    ├── DiagnosticAccessTest.daml
    ├── LabResultsTest.daml
    ├── OnboardingTest.daml
    └── AuditTest.daml
```

## Data Flow

### Patient Onboarding
1. Operator creates `Operator` contract
2. Operator exercises `InvitePatient` → creates `PatientInvite`
3. Patient exercises `AcceptInvite` → creates `HealthRecord`

### Doctor Consultation
1. Patient exercises `GrantDoctorAccess` on `HealthRecord` → creates `DoctorAccess` with time limit
2. Doctor views full medical history via `DoctorAccess` payload
3. Doctor exercises `CreatePrescription` or `CreateLabOrder` (nonconsuming)
4. Patient can exercise `RevokeDoctorAccess` at any time

### Prescription Fulfillment
1. Patient exercises `GrantPharmacyAccess` with prescription reference → creates `PharmacyAccess`
2. Pharmacy views prescription + patient allergies/medications
3. Pharmacy exercises `AcknowledgeDispensing`

### Lab Work
1. Patient exercises `GrantDiagnosticAccess` with lab order → creates `DiagnosticAccess`
2. Diagnostic center exercises `SubmitLabResults` → creates `LabResultReport`
3. Patient can exercise `GrantDoctorLabResultAccess` to share results with doctor

## Privacy Model

- **Patient as signatory**: All contracts have the patient as signatory, ensuring only patient-authorized actions occur
- **Observer-based visibility**: Healthcare providers see only contracts where they are observers
- **Time-limited access**: `DoctorAccess` supports 30-day, 60-day, or indefinite durations with enforced expiry
- **Revocable grants**: All access grants include revocation choices controlled by the patient
- **Minimal data sharing**: `PharmacyAccess` only includes allergies and medications (not full history); `DiagnosticAccess` only includes the lab order
