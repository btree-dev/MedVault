import React from 'react';
import { Table, Header, Label, Segment } from 'semantic-ui-react';

interface Props {
  record: any;
  // Live contract data (supplements the static record snapshot)
  prescriptions?: any[];
  dispenseEntries?: any[];
  labOrders?: any[];
  labResults?: any[];
}

const MedicalHistoryView: React.FC<Props> = ({ record, prescriptions, dispenseEntries, labOrders, labResults }) => {
  const { patientInfo, allergies, conditions, medications, surgeries, illnesses, diagnosticHistory, prescriptionHistory, dispenseHistory, immunizations, familyHistory } = record;

  // Merge static record medications with active (not course-completed) prescriptions for "Current Medications"
  const liveMedications = prescriptions?.filter((c: any) => !c.payload.courseCompleted).map((c: any) => c.payload.medication) || [];
  const allMedications = [...(medications || []), ...liveMedications];

  // Build prescription history from live Prescription contracts
  const livePrescriptionHistory = prescriptions?.map((c: any) => ({
    medication: c.payload.medication?.name,
    date: c.payload.medication?.prescribedDate,
    doctor: c.payload.doctor,
    notes: c.payload.notes,
    filled: c.payload.filled,
  })) || [];
  const allPrescriptionHistory = [...(prescriptionHistory || []), ...livePrescriptionHistory];

  // Build dispensing history from live DispenseEntry contracts
  const liveDispenseHistory = dispenseEntries?.map((c: any) => c.payload.dispenseRecord) || [];
  const allDispenseHistory = [...(dispenseHistory || []), ...liveDispenseHistory];

  // Build diagnostic history from live LabOrder + LabResultReport contracts
  const liveDiagnosticHistory = [
    ...(labOrders?.map((c: any) => ({
      diagType: c.payload.labType,
      date: '',
      facility: '',
      findings: `Ordered: ${c.payload.reason}`,
      orderedBy: c.payload.doctor,
    })) || []),
    ...(labResults?.map((c: any) => ({
      diagType: c.payload.labResult?.labType,
      date: c.payload.labResult?.resultDate,
      facility: c.payload.diagnosticCenter,
      findings: c.payload.labResult?.findings,
      orderedBy: '',
    })) || []),
  ];
  const allDiagnosticHistory = [...(diagnosticHistory || []), ...liveDiagnosticHistory];

  return (
    <div>
      <Segment>
        <Header as="h3">Patient Information</Header>
        <p><strong>Name:</strong> {patientInfo.name}</p>
        <p><strong>Date of Birth:</strong> {patientInfo.dateOfBirth}</p>
        <p><strong>Blood Type:</strong> {patientInfo.bloodType}</p>
        <p><strong>Emergency Contact:</strong> {patientInfo.emergencyContact}</p>
      </Segment>

      {allergies.length > 0 && (
        <Segment>
          <Header as="h4">Allergies</Header>
          {allergies.map((a: any, i: number) => (
            <Label key={i} color={a.severity === 'severe' ? 'red' : a.severity === 'moderate' ? 'orange' : 'yellow'}>
              {a.name} — {a.severity}
            </Label>
          ))}
        </Segment>
      )}

      {conditions.length > 0 && (
        <Segment>
          <Header as="h4">Conditions</Header>
          <Table compact>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Condition</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Diagnosed</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {conditions.map((c: any, i: number) => (
                <Table.Row key={i}>
                  <Table.Cell>{c.name}</Table.Cell>
                  <Table.Cell>{c.status}</Table.Cell>
                  <Table.Cell>{c.diagnosedDate}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Segment>
      )}

      {allMedications.length > 0 && (
        <Segment>
          <Header as="h4">Current Medications</Header>
          <Table compact>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Medication</Table.HeaderCell>
                <Table.HeaderCell>Dosage</Table.HeaderCell>
                <Table.HeaderCell>Frequency</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {allMedications.map((m: any, i: number) => (
                <Table.Row key={i}>
                  <Table.Cell>{m.name}</Table.Cell>
                  <Table.Cell>{m.dosage}</Table.Cell>
                  <Table.Cell>{m.frequency}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Segment>
      )}

      {allPrescriptionHistory.length > 0 && !prescriptions && (
        <Segment>
          <Header as="h4">Prescription History</Header>
          <Table compact>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Medication</Table.HeaderCell>
                <Table.HeaderCell>Date</Table.HeaderCell>
                <Table.HeaderCell>Doctor</Table.HeaderCell>
                <Table.HeaderCell>Notes</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {allPrescriptionHistory.map((p: any, i: number) => (
                <Table.Row key={i}>
                  <Table.Cell>{p.medication}</Table.Cell>
                  <Table.Cell>{p.date}</Table.Cell>
                  <Table.Cell>{p.doctor}</Table.Cell>
                  <Table.Cell>{p.notes}</Table.Cell>
                  <Table.Cell>{p.filled ? <Label color="green" size="tiny">Filled</Label> : <Label color="orange" size="tiny">Pending</Label>}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Segment>
      )}

      {allDispenseHistory.length > 0 && (
        <Segment>
          <Header as="h4">Dispensing History</Header>
          <Table compact>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Medication</Table.HeaderCell>
                <Table.HeaderCell>Dosage</Table.HeaderCell>
                <Table.HeaderCell>Date</Table.HeaderCell>
                <Table.HeaderCell>Pharmacy</Table.HeaderCell>
                <Table.HeaderCell>Note</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {allDispenseHistory.map((d: any, i: number) => (
                <Table.Row key={i}>
                  <Table.Cell>{d.medication}</Table.Cell>
                  <Table.Cell>{d.dosage}</Table.Cell>
                  <Table.Cell>{d.dispensedDate}</Table.Cell>
                  <Table.Cell>{d.pharmacy}</Table.Cell>
                  <Table.Cell>{d.dispensingNote}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Segment>
      )}

      {allDiagnosticHistory.length > 0 && (
        <Segment>
          <Header as="h4">Diagnostic History</Header>
          <Table compact>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Type</Table.HeaderCell>
                <Table.HeaderCell>Date</Table.HeaderCell>
                <Table.HeaderCell>Facility</Table.HeaderCell>
                <Table.HeaderCell>Findings</Table.HeaderCell>
                <Table.HeaderCell>Ordered By</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {allDiagnosticHistory.map((d: any, i: number) => (
                <Table.Row key={i}>
                  <Table.Cell>{d.diagType}</Table.Cell>
                  <Table.Cell>{d.date}</Table.Cell>
                  <Table.Cell>{d.facility}</Table.Cell>
                  <Table.Cell>{d.findings}</Table.Cell>
                  <Table.Cell>{d.orderedBy}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Segment>
      )}

      {surgeries.length > 0 && (
        <Segment>
          <Header as="h4">Surgeries</Header>
          <Table compact>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Procedure</Table.HeaderCell>
                <Table.HeaderCell>Date</Table.HeaderCell>
                <Table.HeaderCell>Surgeon</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {surgeries.map((s: any, i: number) => (
                <Table.Row key={i}>
                  <Table.Cell>{s.procedure}</Table.Cell>
                  <Table.Cell>{s.date}</Table.Cell>
                  <Table.Cell>{s.surgeon}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Segment>
      )}

      {illnesses.length > 0 && (
        <Segment>
          <Header as="h4">Illness History</Header>
          <Table compact>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Illness</Table.HeaderCell>
                <Table.HeaderCell>Severity</Table.HeaderCell>
                <Table.HeaderCell>Period</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {illnesses.map((il: any, i: number) => (
                <Table.Row key={i}>
                  <Table.Cell>{il.name}</Table.Cell>
                  <Table.Cell>{il.severity}</Table.Cell>
                  <Table.Cell>{il.startDate} — {il.endDate || 'ongoing'}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Segment>
      )}

      {immunizations.length > 0 && (
        <Segment>
          <Header as="h4">Immunizations</Header>
          <Table compact>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Vaccine</Table.HeaderCell>
                <Table.HeaderCell>Date</Table.HeaderCell>
                <Table.HeaderCell>Provider</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {immunizations.map((im: any, i: number) => (
                <Table.Row key={i}>
                  <Table.Cell>{im.name}</Table.Cell>
                  <Table.Cell>{im.date}</Table.Cell>
                  <Table.Cell>{im.provider}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Segment>
      )}

      {familyHistory.length > 0 && (
        <Segment>
          <Header as="h4">Family History</Header>
          <Table compact>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Relation</Table.HeaderCell>
                <Table.HeaderCell>Condition</Table.HeaderCell>
                <Table.HeaderCell>Notes</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {familyHistory.map((fh: any, i: number) => (
                <Table.Row key={i}>
                  <Table.Cell>{fh.relation}</Table.Cell>
                  <Table.Cell>{fh.condition}</Table.Cell>
                  <Table.Cell>{fh.notes}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Segment>
      )}
    </div>
  );
};

export default MedicalHistoryView;
