# MedVault API Reference

## HTTP JSON API

MedVault uses the Canton JSON API (default port 7575) to interact with DAML contracts. All requests require a JWT bearer token.

### Base URL

```
http://localhost:7575/v1
```

### Authentication

Include JWT token in the `Authorization` header:
```
Authorization: Bearer <jwt-token>
```

## Templates

### HealthRecord (HealthRecord:HealthRecord)

**Create** a health record:
```http
POST /v1/create
Content-Type: application/json

{
  "templateId": "HealthRecord:HealthRecord",
  "payload": {
    "patient": "Alice::1234...",
    "patientInfo": {
      "name": "Alice Johnson",
      "dateOfBirth": "1985-06-12",
      "bloodType": "O+",
      "emergencyContact": "Bob Johnson - 555-0123"
    },
    "allergies": [],
    "conditions": [],
    "medications": [],
    "surgeries": [],
    "illnesses": [],
    "diagnosticHistory": [],
    "prescriptionHistory": [],
    "immunizations": [],
    "familyHistory": []
  }
}
```

**Exercise** GrantDoctorAccess:
```http
POST /v1/exercise
Content-Type: application/json

{
  "templateId": "HealthRecord:HealthRecord",
  "contractId": "#1:0",
  "choice": "GrantDoctorAccess",
  "argument": {
    "doctor": "DrSmith::5678...",
    "duration": "Days30"
  }
}
```

**Exercise** GrantPharmacyAccess:
```http
POST /v1/exercise
Content-Type: application/json

{
  "templateId": "HealthRecord:HealthRecord",
  "contractId": "#1:0",
  "choice": "GrantPharmacyAccess",
  "argument": {
    "pharmacy": "PharmaCorp::9012...",
    "prescriptionCid": "#2:1"
  }
}
```

**Exercise** GrantDiagnosticAccess:
```http
POST /v1/exercise
Content-Type: application/json

{
  "templateId": "HealthRecord:HealthRecord",
  "contractId": "#1:0",
  "choice": "GrantDiagnosticAccess",
  "argument": {
    "diagnosticCenter": "LabCorp::3456...",
    "labOrderCid": "#3:1"
  }
}
```

### DoctorAccess (DoctorAccess:DoctorAccess)

**Query** active doctor access grants:
```http
POST /v1/query
Content-Type: application/json

{
  "templateIds": ["DoctorAccess:DoctorAccess"]
}
```

**Exercise** CreatePrescription (nonconsuming):
```http
POST /v1/exercise
Content-Type: application/json

{
  "templateId": "DoctorAccess:DoctorAccess",
  "contractId": "#4:0",
  "choice": "CreatePrescription",
  "argument": {
    "medication": {
      "name": "Amoxicillin",
      "dosage": "500mg",
      "frequency": "3x daily",
      "prescribedDate": "2025-01-15",
      "prescribedBy": "DrSmith"
    },
    "notes": "For bacterial infection"
  }
}
```

**Exercise** CreateLabOrder (nonconsuming):
```http
POST /v1/exercise
Content-Type: application/json

{
  "templateId": "DoctorAccess:DoctorAccess",
  "contractId": "#4:0",
  "choice": "CreateLabOrder",
  "argument": {
    "labType": "BloodWork",
    "reason": "Routine blood panel"
  }
}
```

### DiagnosticAccess (DiagnosticAccess:DiagnosticAccess)

**Exercise** SubmitLabResults:
```http
POST /v1/exercise
Content-Type: application/json

{
  "templateId": "DiagnosticAccess:DiagnosticAccess",
  "contractId": "#5:0",
  "choice": "SubmitLabResults",
  "argument": {
    "findings": "CBC normal. Cholesterol slightly elevated.",
    "resultDate": "2025-01-20"
  }
}
```

### Operator (Operator:Operator)

**Create** operator contract:
```http
POST /v1/create
Content-Type: application/json

{
  "templateId": "Operator:Operator",
  "payload": {
    "operator": "Operator::7890..."
  }
}
```

**Exercise** InvitePatient:
```http
POST /v1/exercise
Content-Type: application/json

{
  "templateId": "Operator:Operator",
  "contractId": "#6:0",
  "choice": "InvitePatient",
  "argument": {
    "patient": "Alice::1234..."
  }
}
```

## Enum Values

### AccessDuration
- `Days30` — 30-day access
- `Days60` — 60-day access
- `Indefinite` — No expiry

### LabType
- `BloodWork`
- `XRay`
- `MRI`
- `Urinalysis`
- `CTScan`
- `Ultrasound`

## Streaming

Use WebSocket endpoint for real-time contract updates:
```
ws://localhost:7575/v1/stream/query
```

Send query message after connection:
```json
{"templateIds": ["HealthRecord:HealthRecord"]}
```
