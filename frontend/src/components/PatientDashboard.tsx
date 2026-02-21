import React, { useState } from 'react';
import { useParty, useLedger, useStreamQueries } from '../services/DamlLedger';
import { Header, Segment, Form, Dropdown, Card, Button, Message, Table, Label, Divider } from 'semantic-ui-react';

import MedicalHistoryView from './MedicalHistoryView';
import AccessCard from './AccessCard';

const durationOptions = [
  { key: '30', text: '30 Days', value: 'Days30' },
  { key: '60', text: '60 Days', value: 'Days60' },
  { key: 'indef', text: 'Indefinite', value: 'Indefinite' },
];

const PatientDashboard: React.FC = () => {
  const party = useParty();
  const ledger = useLedger();

  const healthRecords = useStreamQueries('#MedVault:HealthRecord:HealthRecord');
  const invites = useStreamQueries('#MedVault:Operator:PatientInvite');
  const accessManagers = useStreamQueries('#MedVault:AccessGrants:PatientAccessManager');
  const doctorAccesses = useStreamQueries('#MedVault:DoctorAccess:DoctorAccess');
  const pharmacyAccesses = useStreamQueries('#MedVault:PharmacyAccess:PharmacyAccess');
  const diagnosticAccesses = useStreamQueries('#MedVault:DiagnosticAccess:DiagnosticAccess');
  const prescriptions = useStreamQueries('#MedVault:Prescription:Prescription');
  const labOrders = useStreamQueries('#MedVault:LabOrder:LabOrder');
  const labResults = useStreamQueries('#MedVault:LabResults:LabResultReport');
  const dispenseEntries = useStreamQueries('#MedVault:PharmacyAccess:DispenseEntry');
  const doctorNotes = useStreamQueries('#MedVault:DoctorNote:DoctorNote');

  const [doctorParty, setDoctorParty] = useState('');
  const [duration, setDuration] = useState('Days30');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [patientName, setPatientName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  // Pharmacy access granting
  const [pharmacyParty, setPharmacyParty] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState('');

  // Diagnostic access granting
  const [labParty, setLabParty] = useState('');
  const [selectedLabOrder, setSelectedLabOrder] = useState('');

  const acceptInvite = async (contractId: string) => {
    if (!patientName || !dateOfBirth) {
      setError('Name and date of birth are required');
      return;
    }
    try {
      await ledger.exercise(
        '#MedVault:Operator:PatientInvite',
        contractId,
        'AcceptInvite',
        {
          patientInfo: {
            name: patientName,
            dateOfBirth,
            bloodType,
            emergencyContact,
          },
        }
      );
      setSuccess('Invite accepted! Health record created.');
      setError('');
    } catch (e: any) {
      setError(e.message);
      setSuccess('');
    }
  };

  const grantDoctorAccess = async () => {
    if (!doctorParty) return;
    try {
      const manager = accessManagers.contracts[0];
      if (!manager) { setError('No access manager found'); return; }
      const record = healthRecords.contracts[0];
      if (!record) { setError('No health record found'); return; }
      await ledger.exercise(
        '#MedVault:AccessGrants:PatientAccessManager',
        manager.contractId,
        'GrantDoctorAccess',
        { healthRecordCid: record.contractId, doctor: doctorParty, duration }
      );
      setDoctorParty('');
      setSuccess('Doctor access granted');
      setError('');
    } catch (e: any) {
      setError(e.message);
      setSuccess('');
    }
  };

  const grantPharmacyAccess = async () => {
    if (!pharmacyParty || !selectedPrescription) {
      setError('Select a prescription and enter pharmacy party ID');
      return;
    }
    try {
      const manager = accessManagers.contracts[0];
      if (!manager) { setError('No access manager found'); return; }
      const record = healthRecords.contracts[0];
      if (!record) { setError('No health record found'); return; }
      await ledger.exercise(
        '#MedVault:AccessGrants:PatientAccessManager',
        manager.contractId,
        'GrantPharmacyAccess',
        { healthRecordCid: record.contractId, pharmacy: pharmacyParty, prescriptionCid: selectedPrescription }
      );
      setPharmacyParty('');
      setSelectedPrescription('');
      setSuccess('Pharmacy access granted');
      setError('');
    } catch (e: any) {
      setError(e.message);
      setSuccess('');
    }
  };

  const grantDiagnosticAccess = async () => {
    if (!labParty || !selectedLabOrder) {
      setError('Select a lab order and enter lab party ID');
      return;
    }
    try {
      const manager = accessManagers.contracts[0];
      if (!manager) { setError('No access manager found'); return; }
      const record = healthRecords.contracts[0];
      if (!record) { setError('No health record found'); return; }
      await ledger.exercise(
        '#MedVault:AccessGrants:PatientAccessManager',
        manager.contractId,
        'GrantDiagnosticAccess',
        { healthRecordCid: record.contractId, diagnosticCenter: labParty, labOrderCid: selectedLabOrder }
      );
      setLabParty('');
      setSelectedLabOrder('');
      setSuccess('Diagnostic access granted');
      setError('');
    } catch (e: any) {
      setError(e.message);
      setSuccess('');
    }
  };

  const record = healthRecords.contracts[0]?.payload;

  const prescriptionOptions = prescriptions.contracts
    .filter((c: any) => !c.payload.filled)
    .map((c: any) => ({
      key: c.contractId,
      text: `${c.payload.medication?.name} — ${c.payload.medication?.dosage} (by ${c.payload.doctor})`,
      value: c.contractId,
    }));

  const labOrderOptions = labOrders.contracts.map((c: any) => ({
    key: c.contractId,
    text: `${c.payload.labType} — ${c.payload.reason} (by ${c.payload.doctor})`,
    value: c.contractId,
  }));

  return (
    <div>
      <Header as="h2">Patient Dashboard</Header>

      {error && <Message negative onDismiss={() => setError('')}>{error}</Message>}
      {success && <Message positive onDismiss={() => setSuccess('')}>{success}</Message>}

      {/* Pending Invites */}
      {invites.contracts.length > 0 && (
        <Segment>
          <Header as="h3">Pending Invites</Header>
          {invites.contracts.map((c: any) => (
            <Card key={c.contractId} fluid>
              <Card.Content>
                <Card.Header>Invitation from Operator</Card.Header>
                <Card.Meta>Operator: {c.payload.operator}</Card.Meta>
                <Card.Description>
                  <p>Accept this invite to create your health record.</p>
                  <Form>
                    <Form.Input label="Full Name" required value={patientName} onChange={(_, { value }) => setPatientName(value)} placeholder="e.g. Alice Johnson" />
                    <Form.Input label="Date of Birth" type="date" required value={dateOfBirth} onChange={(_, { value }) => setDateOfBirth(value)} />
                    <Form.Input label="Blood Type" value={bloodType} onChange={(_, { value }) => setBloodType(value)} placeholder="e.g. O+" />
                    <Form.Input label="Emergency Contact" value={emergencyContact} onChange={(_, { value }) => setEmergencyContact(value)} placeholder="e.g. Bob (555-1234)" />
                    <Button primary onClick={() => acceptInvite(c.contractId)}>Accept Invite</Button>
                  </Form>
                </Card.Description>
              </Card.Content>
            </Card>
          ))}
        </Segment>
      )}

      {/* Health Record */}
      {record ? (
        <MedicalHistoryView
          record={record}
        />
      ) : (
        !invites.contracts.length && <Message info>No health record found. Ask your operator to send you an invite.</Message>
      )}

      {record && (
        <>
          {/* Doctor's Clinical Notes */}
          {doctorNotes.contracts.length > 0 && (
            <Segment>
              <Header as="h3">Doctor's Clinical Notes</Header>
              <Table compact>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>Type</Table.HeaderCell>
                    <Table.HeaderCell>Note</Table.HeaderCell>
                    <Table.HeaderCell>Doctor</Table.HeaderCell>
                    <Table.HeaderCell>Date</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {doctorNotes.contracts.map((c: any) => (
                    <Table.Row key={c.contractId}>
                      <Table.Cell><Label>{c.payload.noteType}</Label></Table.Cell>
                      <Table.Cell>{c.payload.content}</Table.Cell>
                      <Table.Cell>{c.payload.doctor}</Table.Cell>
                      <Table.Cell>{c.payload.createdAt}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </Segment>
          )}

          {/* Grant Doctor Access */}
          <Segment>
            <Header as="h3">Grant Doctor Access</Header>
            <Form>
              <Form.Input label="Doctor Party ID" placeholder="e.g. DrSmith::12345..." value={doctorParty} onChange={(_, { value }) => setDoctorParty(value)} />
              <Form.Field>
                <label>Duration</label>
                <Dropdown selection options={durationOptions} value={duration} onChange={(_, { value }) => setDuration(value as string)} />
              </Form.Field>
              <Button primary onClick={grantDoctorAccess}>Grant Access</Button>
            </Form>
          </Segment>

          {/* Prescriptions & Grant Pharmacy Access */}
          {prescriptions.contracts.length > 0 && (
            <Segment>
              <Header as="h3">Prescriptions</Header>
              <Table compact>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>Medication</Table.HeaderCell>
                    <Table.HeaderCell>Dosage</Table.HeaderCell>
                    <Table.HeaderCell>Frequency</Table.HeaderCell>
                    <Table.HeaderCell>Prescribed By</Table.HeaderCell>
                    <Table.HeaderCell>Notes</Table.HeaderCell>
                    <Table.HeaderCell>Dispensing</Table.HeaderCell>
                    <Table.HeaderCell>Course</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {prescriptions.contracts.map((c: any) => (
                    <Table.Row key={c.contractId}>
                      <Table.Cell>{c.payload.medication?.name}</Table.Cell>
                      <Table.Cell>{c.payload.medication?.dosage}</Table.Cell>
                      <Table.Cell>{c.payload.medication?.frequency}</Table.Cell>
                      <Table.Cell>{c.payload.doctor}</Table.Cell>
                      <Table.Cell>{c.payload.notes}</Table.Cell>
                      <Table.Cell>
                        <Label color={c.payload.filled ? 'green' : 'orange'} size="tiny">
                          {c.payload.filled ? 'Filled' : 'Pending'}
                        </Label>
                      </Table.Cell>
                      <Table.Cell>
                        <Button
                          size="tiny"
                          color={c.payload.courseCompleted ? 'grey' : 'blue'}
                          onClick={async () => {
                            try {
                              await ledger.exercise(
                                '#MedVault:Prescription:Prescription',
                                c.contractId,
                                'SetCourseStatus',
                                { completed: !c.payload.courseCompleted }
                              );
                            } catch (e: any) {
                              setError(e.message);
                            }
                          }}
                        >
                          {c.payload.courseCompleted ? 'Completed' : 'Active'}
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>

              <Divider />
              <Header as="h4">Send Prescription to Pharmacy</Header>
              <Form>
                <Form.Field>
                  <label>Select Prescription</label>
                  <Dropdown selection placeholder="Choose a prescription..." options={prescriptionOptions} value={selectedPrescription} onChange={(_, { value }) => setSelectedPrescription(value as string)} />
                </Form.Field>
                <Form.Input label="Pharmacy Party ID" placeholder="e.g. PharmaCorp::12345..." value={pharmacyParty} onChange={(_, { value }) => setPharmacyParty(value)} />
                <Button color="teal" onClick={grantPharmacyAccess}>Grant Pharmacy Access</Button>
              </Form>
            </Segment>
          )}

          {/* Lab Orders & Grant Diagnostic Access */}
          {labOrders.contracts.length > 0 && (
            <Segment>
              <Header as="h3">Lab Orders</Header>
              <Table compact>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>Type</Table.HeaderCell>
                    <Table.HeaderCell>Reason</Table.HeaderCell>
                    <Table.HeaderCell>Ordered By</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {labOrders.contracts.map((c: any) => (
                    <Table.Row key={c.contractId}>
                      <Table.Cell><Label>{c.payload.labType}</Label></Table.Cell>
                      <Table.Cell>{c.payload.reason}</Table.Cell>
                      <Table.Cell>{c.payload.doctor}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>

              <Divider />
              <Header as="h4">Send Lab Order to Diagnostic Center</Header>
              <Form>
                <Form.Field>
                  <label>Select Lab Order</label>
                  <Dropdown selection placeholder="Choose a lab order..." options={labOrderOptions} value={selectedLabOrder} onChange={(_, { value }) => setSelectedLabOrder(value as string)} />
                </Form.Field>
                <Form.Input label="Lab / Diagnostic Center Party ID" placeholder="e.g. LabCorp::12345..." value={labParty} onChange={(_, { value }) => setLabParty(value)} />
                <Button color="teal" onClick={grantDiagnosticAccess}>Grant Diagnostic Access</Button>
              </Form>
            </Segment>
          )}

          {/* Lab Results (view only, no sharing needed — doctor sees via DoctorAccess snapshot) */}
          {labResults.contracts.length > 0 && (
            <Segment>
              <Header as="h3">Lab Results</Header>
              <Card.Group>
                {labResults.contracts.map((c: any) => (
                  <Card key={c.contractId} fluid>
                    <Card.Content>
                      <Card.Header>{c.payload.labResult?.labType}</Card.Header>
                      <Card.Meta>Date: {c.payload.labResult?.resultDate} | Lab: {c.payload.diagnosticCenter}</Card.Meta>
                      <Card.Description>
                        <strong>Findings:</strong> {c.payload.labResult?.findings}
                      </Card.Description>
                    </Card.Content>
                  </Card>
                ))}
              </Card.Group>
            </Segment>
          )}
        </>
      )}

      {/* Active Access Grants */}
      {doctorAccesses.contracts.length > 0 && (
        <Segment>
          <Header as="h3">Active Doctor Access Grants</Header>
          <Card.Group>
            {doctorAccesses.contracts.map((c: any) => (
              <AccessCard
                key={c.contractId}
                title="Doctor Access"
                party={c.payload.doctor}
                expiresAt={c.payload.expiresAt}
                onRevoke={async () => {
                  await ledger.exercise('#MedVault:DoctorAccess:DoctorAccess', c.contractId, 'RevokeDoctorAccess', {});
                }}
              />
            ))}
          </Card.Group>
        </Segment>
      )}

      {pharmacyAccesses.contracts.length > 0 && (
        <Segment>
          <Header as="h3">Active Pharmacy Access Grants</Header>
          <Card.Group>
            {pharmacyAccesses.contracts.map((c: any) => (
              <AccessCard
                key={c.contractId}
                title="Pharmacy Access"
                party={c.payload.pharmacy}
                description={`Prescription: ${c.payload.prescription?.medication?.name}`}
                onRevoke={async () => {
                  await ledger.exercise('#MedVault:PharmacyAccess:PharmacyAccess', c.contractId, 'RevokePharmacyAccess', {});
                }}
              />
            ))}
          </Card.Group>
        </Segment>
      )}

      {diagnosticAccesses.contracts.length > 0 && (
        <Segment>
          <Header as="h3">Active Diagnostic Access Grants</Header>
          <Card.Group>
            {diagnosticAccesses.contracts.map((c: any) => (
              <AccessCard
                key={c.contractId}
                title="Diagnostic Access"
                party={c.payload.diagnosticCenter}
                description={`Lab: ${c.payload.labOrder?.labType}`}
                onRevoke={async () => {
                  await ledger.exercise('#MedVault:DiagnosticAccess:DiagnosticAccess', c.contractId, 'RevokeDiagnosticAccess', {});
                }}
              />
            ))}
          </Card.Group>
        </Segment>
      )}
    </div>
  );
};

export default PatientDashboard;
