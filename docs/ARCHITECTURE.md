# MedVault Architecture

## Overview

MedVault is a patient-controlled medical records system built on DAML smart contracts running on Canton. Patients own their health data and explicitly grant time-limited access to healthcare providers.

## Actors

| Actor | Role | Key Actions |
|-------|------|-------------|
| **Patient** | Data owner | Creates/updates health records, grants and revokes access via PatientAccessManager |
| **Doctor** | Healthcare provider | Views patient history, creates prescriptions, lab orders, and clinical notes |
| **Pharmacy** | Medication dispenser | Views prescriptions and patient allergies, acknowledges dispensing, creates DispenseEntry |
| **Diagnostic Center** | Lab/imaging facility | Receives lab orders, submits results |
| **Operator** | System administrator | Onboards patients via invite workflow |
| **Auditor** | Compliance observer | Views audit trail events |

## Contract Model

```
┌──────────────┐
│   Operator   │──── InvitePatient ────▶ PatientInvite ──── AcceptInvite ──┬──▶ HealthRecord
└──────────────┘                                                            │
                                                                            └──▶ PatientAccessManager
                                                                                       │
                            ┌──────────────────────────────────────────────────────────┤
                            │                          │                               │
                  GrantDoctorAccess            GrantPharmacyAccess            GrantDiagnosticAccess
                            │                          │                               │
                            ▼                          ▼                               ▼
                     ┌─────────────┐          ┌───────────────┐              ┌─────────────────┐
                     │DoctorAccess │          │PharmacyAccess │              │DiagnosticAccess │
                     └──────┬──────┘          └───────┬───────┘              └────────┬────────┘
                            │                         │                               │
               ┌────────────┼────────────┐    AcknowledgeDispensing         SubmitLabResults
               │            │            │            │                               │
        CreatePrescription  │  CreateDoctorNote       ▼                               ▼
               │      CreateLabOrder      │   ┌──────────────┐              ┌────────────────┐
               ▼            ▼             ▼   │ DispenseEntry│              │ LabResultReport│
        ┌──────────┐ ┌──────────┐ ┌──────────┐└──────────────┘              └────────────────┘
        │Prescription│ LabOrder │ │DoctorNote│
        └──────────┘ └──────────┘ └──────────┘

  ┌────────────────┐
  │ AuditObserver  │──── LogEvent ────▶ AuditEvent
  └────────────────┘
```

## Module Structure

```
daml/
├── Types.daml              # Shared data types and enums
├── AccessGrants.daml       # PatientAccessManager — central hub for granting access
├── Prescription.daml       # Prescription template with filled/courseCompleted tracking
├── LabOrder.daml           # Lab order template
├── LabResults.daml         # LabResultReport template
├── PharmacyAccess.daml     # Pharmacy access with dispensing + DispenseEntry template
├── DiagnosticAccess.daml   # Diagnostic center access + result submission
├── DoctorAccess.daml       # Time-limited doctor access with prescription/lab/note choices
├── DoctorNote.daml         # Clinical notes created by doctors
├── HealthRecord.daml       # Core patient record with history-append choices
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
3. Patient exercises `AcceptInvite` → creates both `HealthRecord` and `PatientAccessManager`

### Doctor Consultation
1. Patient exercises `GrantDoctorAccess` on `PatientAccessManager` (providing HealthRecord reference) → creates `DoctorAccess` with time limit and a snapshot of the patient's medical history
2. Doctor views full medical history via `DoctorAccess` payload
3. Doctor exercises `CreatePrescription`, `CreateLabOrder`, or `CreateDoctorNote` (all nonconsuming)
4. Patient can exercise `RevokeDoctorAccess` at any time

### Prescription Fulfillment
1. Patient exercises `GrantPharmacyAccess` on `PatientAccessManager` (providing Prescription reference) → creates `PharmacyAccess` and adds the pharmacy as an observer on the Prescription via `AddObserver`
2. Pharmacy views prescription details + patient allergies/medications
3. Pharmacy exercises `AcknowledgeDispensing` with a dispensing note and optionally marks the prescription as filled → creates `DispenseEntry`
4. Patient can toggle `SetCourseStatus` on the Prescription to mark a course as active or completed

### Lab Work
1. Patient exercises `GrantDiagnosticAccess` on `PatientAccessManager` (providing LabOrder reference) → creates `DiagnosticAccess`
2. Diagnostic center exercises `SubmitLabResults` → creates `LabResultReport`

## Privacy Model

- **Patient as signatory**: All contracts have the patient as signatory, ensuring only patient-authorized actions occur
- **Observer-based visibility**: Healthcare providers see only contracts where they are observers
- **Time-limited access**: `DoctorAccess` supports 30-day, 60-day, or indefinite durations with enforced expiry
- **Revocable grants**: All access grants include revocation choices controlled by the patient
- **Minimal data sharing**: `PharmacyAccess` only includes allergies and medications (not full history); `DiagnosticAccess` only includes the lab order
- **Additional observers**: `Prescription` supports an `additionalObservers` list so pharmacies can be granted visibility without being the original signatory — Canton 3.x requires explicit observer relationships for contract visibility
