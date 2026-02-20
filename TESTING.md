# MedVault — Test Workflows

## Prerequisites

1. Start the sandbox and set up parties:
   ```bash
   ./scripts/deploy.sh
   ```
2. Start the frontend:
   ```bash
   cd frontend && yarn serve
   ```
3. Open http://localhost:3001

## Test Users

| User       | Role     | Login ID   |
|------------|----------|------------|
| Operator   | Operator | Operator   |
| Alice      | Patient  | Alice      |
| Bob        | Patient  | Bob        |
| Dr. Smith  | Doctor   | DrSmith    |
| Dr. Jones  | Doctor   | DrJones    |
| PharmaCorp | Pharmacy | PharmaCorp |
| LabCorp    | Lab      | LabCorp    |

---

## Workflow 1: Patient Onboarding

**Goal**: Operator invites a patient, patient accepts and creates their health record.

1. Login as **Operator**
2. Create the Operator contract (first time only)
3. Invite patient by entering party ID `Alice::...` (shown on login)
4. Logout → Login as **Alice** (Patient role)
5. See the pending invite
6. Fill in patient info (name, DOB, blood type, emergency contact) and accept
7. **Verify**: HealthRecord appears in Alice's dashboard

---

## Workflow 2: Doctor Consultation

**Goal**: Patient grants doctor access, doctor creates prescriptions, lab orders, and notes.

**Precondition**: Alice has a HealthRecord (complete Workflow 1 first).

1. Login as **Alice** (Patient)
2. Grant doctor access to **DrSmith** with duration (e.g., Days30)
3. **Verify**: DoctorAccess card appears under Active Access
4. Logout → Login as **DrSmith** (Doctor role)
5. **Verify**: Alice appears as an accessible patient
6. Click Alice's patient card to view her medical history
7. Create a **Prescription**:
   - Medication name: "Amoxicillin"
   - Dosage: "500mg"
   - Frequency: "3x daily"
   - Notes: "Take with food"
8. Create a **Lab Order**:
   - Lab type: BloodWork
   - Reason: "Annual checkup"
9. Create a **Doctor Note**:
   - Note type: Observation
   - Content: "Patient reports mild headaches"
10. Logout → Login as **Alice** (Patient)
11. **Verify**: Prescription, lab order, and clinical note all appear in dashboard

---

## Workflow 3: Pharmacy Dispensing

**Goal**: Patient shares prescription with pharmacy, pharmacy dispenses medication.

**Precondition**: Alice has a Prescription (complete Workflow 2 first).

1. Login as **Alice** (Patient)
2. Grant pharmacy access to **PharmaCorp**, selecting the Amoxicillin prescription
3. **Verify**: PharmacyAccess card appears under Active Access
4. Logout → Login as **PharmaCorp** (Pharmacy role)
5. **Verify**: Pending prescription appears showing:
   - Medication details (Amoxicillin, 500mg, 3x daily)
   - Alice's allergies (for safety check)
   - Alice's current medications (for interaction check)
6. Click **Dispense Medication** to acknowledge dispensing
7. **Verify**: Prescription is removed from pending list

---

## Workflow 4: Lab Testing

**Goal**: Patient shares lab order with lab, lab submits results, patient shares results with doctor.

**Precondition**: Alice has a LabOrder (complete Workflow 2 first).

1. Login as **Alice** (Patient)
2. Grant diagnostic access to **LabCorp**, selecting the BloodWork lab order
3. **Verify**: DiagnosticAccess card appears under Active Access
4. Logout → Login as **LabCorp** (Lab role)
5. **Verify**: Pending lab order appears showing lab type (BloodWork) and reason
6. Enter findings (e.g., "CBC normal, no abnormalities detected") and submit
7. **Verify**: Result moves to completed results table
8. Logout → Login as **Alice** (Patient)
9. **Verify**: Lab result report appears in dashboard
10. Share lab results with **DrSmith**
11. Logout → Login as **DrSmith** (Doctor)
12. **Verify**: Shared lab results appear (BloodWork findings visible)

---

## Workflow 5: Access Revocation

**Goal**: Patient revokes previously granted access.

**Precondition**: Alice has active access grants (DoctorAccess, PharmacyAccess, or DiagnosticAccess).

1. Login as **Alice** (Patient)
2. Under Active Access, click **Revoke** on DrSmith's DoctorAccess
3. **Verify**: DoctorAccess card is removed
4. Logout → Login as **DrSmith** (Doctor)
5. **Verify**: Alice no longer appears in accessible patients list
6. Repeat for PharmacyAccess and DiagnosticAccess as needed

---

## Workflow 6: Multiple Doctors

**Goal**: Patient grants access to multiple doctors independently.

**Precondition**: Alice has a HealthRecord.

1. Login as **Alice** (Patient)
2. Grant doctor access to **DrSmith** (Days30)
3. Grant doctor access to **DrJones** (Indefinite)
4. **Verify**: Two separate DoctorAccess cards appear
5. Login as **DrSmith** → verify Alice is visible, create a prescription
6. Login as **DrJones** → verify Alice is visible, create a different prescription
7. Login as **Alice** → verify both prescriptions appear
8. Revoke DrSmith's access only
9. **Verify**: DrJones still has access, DrSmith does not

---

## Workflow 7: Second Patient (Bob)

**Goal**: Verify multi-patient isolation — doctors see only patients who granted them access.

1. Login as **Operator** → invite **Bob**
2. Login as **Bob** (Patient) → accept invite, fill in patient info
3. Login as **Bob** → grant doctor access to **DrSmith**
4. Login as **DrSmith** (Doctor)
5. **Verify**: Both Alice and Bob appear (if Alice still has active access) as separate patient cards
6. **Verify**: Each patient's medical history is separate and correct

---

## Full End-to-End Smoke Test

Run workflows in order: 1 → 2 → 3 → 4 → 5 → 6 → 7

This covers:
- Operator setup and patient invitations
- Patient record creation
- Doctor access granting and clinical actions (prescriptions, lab orders, notes)
- Pharmacy prescription dispensing with safety data
- Lab order processing and result submission
- Cross-role result sharing (lab results → patient → doctor)
- Access revocation and re-verification
- Multi-patient, multi-doctor isolation
