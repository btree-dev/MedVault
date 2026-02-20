import React, { useState, useEffect } from 'react';
import { useParty, useLedger, useStreamQueries } from '../services/DamlLedger';
import { Header, Segment, Form, Card, Button, Message, Dropdown, Table, Label } from 'semantic-ui-react';
import MedicalHistoryView from './MedicalHistoryView';

const labTypeOptions = [
  { key: 'blood', text: 'Blood Work', value: 'BloodWork' },
  { key: 'xray', text: 'X-Ray', value: 'XRay' },
  { key: 'mri', text: 'MRI', value: 'MRI' },
  { key: 'urine', text: 'Urinalysis', value: 'Urinalysis' },
  { key: 'ct', text: 'CT Scan', value: 'CTScan' },
  { key: 'ultra', text: 'Ultrasound', value: 'Ultrasound' },
];

const DoctorDashboard: React.FC = () => {
  const party = useParty();
  const ledger = useLedger();

  const doctorAccesses = useStreamQueries('#MedVault:DoctorAccess:DoctorAccess');
  const prescriptions = useStreamQueries('#MedVault:Prescription:Prescription');
  const labOrders = useStreamQueries('#MedVault:LabOrder:LabOrder');
  const doctorNotes = useStreamQueries('#MedVault:DoctorNote:DoctorNote');

  const [selectedPatientParty, setSelectedPatientParty] = useState<string | null>(null);
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medFrequency, setMedFrequency] = useState('');
  const [prescNotes, setPrescNotes] = useState('');
  const [labType, setLabType] = useState('BloodWork');
  const [labReason, setLabReason] = useState('');
  const [noteType, setNoteType] = useState('Observation');
  const [noteContent, setNoteContent] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Find the current DoctorAccess contract for the selected patient
  const selectedPatient = doctorAccesses.contracts.find(
    (c: any) => c.payload.patient === selectedPatientParty
  ) as any;

  // Clear selection if the patient's access no longer exists
  useEffect(() => {
    if (selectedPatientParty && !selectedPatient) {
      // Check if there's still a contract for this patient (may have been recreated)
      const stillExists = doctorAccesses.contracts.some(
        (c: any) => c.payload.patient === selectedPatientParty
      );
      if (!stillExists) {
        setSelectedPatientParty(null);
      }
    }
  }, [doctorAccesses.contracts, selectedPatientParty, selectedPatient]);

  const createPrescription = async () => {
    if (!selectedPatient || !medName) return;
    try {
      await ledger.exercise(
        '#MedVault:DoctorAccess:DoctorAccess',
        selectedPatient.contractId,
        'CreatePrescription',
        {
          medication: {
            name: medName,
            dosage: medDosage,
            frequency: medFrequency,
            prescribedDate: new Date().toISOString().split('T')[0],
            prescribedBy: party,
          },
          notes: prescNotes,
        }
      );
      setMedName('');
      setMedDosage('');
      setMedFrequency('');
      setPrescNotes('');
      setSuccess('Prescription created and recorded in patient history');
      setError('');
    } catch (e: any) {
      setError(e.message);
      setSuccess('');
    }
  };

  const createLabOrder = async () => {
    if (!selectedPatient || !labReason) return;
    try {
      await ledger.exercise(
        '#MedVault:DoctorAccess:DoctorAccess',
        selectedPatient.contractId,
        'CreateLabOrder',
        { labType, reason: labReason }
      );
      setLabReason('');
      setSuccess('Lab order created and recorded in patient history');
      setError('');
    } catch (e: any) {
      setError(e.message);
      setSuccess('');
    }
  };

  const createDoctorNote = async () => {
    if (!selectedPatient || !noteContent) return;
    try {
      await ledger.exercise(
        '#MedVault:DoctorAccess:DoctorAccess',
        selectedPatient.contractId,
        'CreateDoctorNote',
        { noteType, content: noteContent }
      );
      setNoteContent('');
      setSuccess('Clinical note added');
      setError('');
    } catch (e: any) {
      setError(e.message);
      setSuccess('');
    }
  };

  return (
    <div>
      <Header as="h2">Doctor Dashboard</Header>

      {error && <Message negative onDismiss={() => setError('')}>{error}</Message>}
      {success && <Message positive onDismiss={() => setSuccess('')}>{success}</Message>}

      {doctorAccesses.contracts.length === 0 ? (
        <Message info>No patient access grants found. Ask a patient to grant you access.</Message>
      ) : (
        <>
          {/* Patient Access Grants */}
          <Segment>
            <Header as="h3">Patient Access Grants</Header>
            <Card.Group>
              {doctorAccesses.contracts.map((c: any) => (
                <Card
                  key={c.contractId}
                  color={selectedPatientParty === c.payload.patient ? 'blue' : undefined}
                  onClick={() => setSelectedPatientParty(c.payload.patient)}
                  style={{ cursor: 'pointer' }}
                >
                  <Card.Content>
                    <Card.Header>{c.payload.patientInfo?.name}</Card.Header>
                    <Card.Meta>Patient: {c.payload.patient}</Card.Meta>
                    <Card.Description>
                      Blood Type: {c.payload.patientInfo?.bloodType}
                      {c.payload.expiresAt && (
                        <div><Label size="tiny" color="blue">Expires: {c.payload.expiresAt}</Label></div>
                      )}
                    </Card.Description>
                  </Card.Content>
                </Card>
              ))}
            </Card.Group>
          </Segment>

          {/* Selected Patient Details */}
          {selectedPatientParty && selectedPatient && (
            <>
              <MedicalHistoryView
                record={selectedPatient.payload}
                prescriptions={prescriptions.contracts.filter((c: any) => c.payload.patient === selectedPatientParty)}
                labOrders={labOrders.contracts.filter((c: any) => c.payload.patient === selectedPatientParty)}
              />

              {/* Doctor's clinical notes for this patient */}
              {doctorNotes.contracts.filter((c: any) => c.payload.patient === selectedPatientParty).length > 0 && (
                <Segment>
                  <Header as="h3">Clinical Notes</Header>
                  <Table compact>
                    <Table.Header>
                      <Table.Row>
                        <Table.HeaderCell>Type</Table.HeaderCell>
                        <Table.HeaderCell>Note</Table.HeaderCell>
                        <Table.HeaderCell>Date</Table.HeaderCell>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {doctorNotes.contracts.filter((c: any) => c.payload.patient === selectedPatientParty).map((c: any) => (
                        <Table.Row key={c.contractId}>
                          <Table.Cell><Label>{c.payload.noteType}</Label></Table.Cell>
                          <Table.Cell>{c.payload.content}</Table.Cell>
                          <Table.Cell>{c.payload.createdAt}</Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                </Segment>
              )}

              <Segment>
                <Header as="h3">Create Prescription</Header>
                <Form>
                  <Form.Group widths="equal">
                    <Form.Input label="Medication" placeholder="e.g. Ibuprofen" value={medName} onChange={(_, { value }) => setMedName(value)} />
                    <Form.Input label="Dosage" placeholder="e.g. 400mg" value={medDosage} onChange={(_, { value }) => setMedDosage(value)} />
                    <Form.Input label="Frequency" placeholder="e.g. Twice daily" value={medFrequency} onChange={(_, { value }) => setMedFrequency(value)} />
                  </Form.Group>
                  <Form.TextArea label="Notes" placeholder="Prescription notes, instructions..." value={prescNotes} onChange={(_, { value }) => setPrescNotes(value as string)} />
                  <Button primary onClick={createPrescription}>Create Prescription</Button>
                </Form>
              </Segment>

              <Segment>
                <Header as="h3">Order Diagnostic Test</Header>
                <Form>
                  <Form.Field>
                    <label>Test Type</label>
                    <Dropdown
                      selection
                      options={labTypeOptions}
                      value={labType}
                      onChange={(_, { value }) => setLabType(value as string)}
                    />
                  </Form.Field>
                  <Form.Input label="Reason" placeholder="e.g. Routine checkup, suspected anemia..." value={labReason} onChange={(_, { value }) => setLabReason(value)} />
                  <Button primary onClick={createLabOrder}>Create Lab Order</Button>
                </Form>
              </Segment>

              <Segment>
                <Header as="h3">Add Clinical Note</Header>
                <Form>
                  <Form.Field>
                    <label>Note Type</label>
                    <Dropdown
                      selection
                      options={[
                        { key: 'obs', text: 'Observation', value: 'Observation' },
                        { key: 'diag', text: 'Diagnosis', value: 'Diagnosis' },
                        { key: 'follow', text: 'Follow-up', value: 'Follow-up' },
                        { key: 'ref', text: 'Referral', value: 'Referral' },
                        { key: 'treat', text: 'Treatment Plan', value: 'Treatment Plan' },
                      ]}
                      value={noteType}
                      onChange={(_, { value }) => setNoteType(value as string)}
                    />
                  </Form.Field>
                  <Form.TextArea label="Note" placeholder="Enter clinical notes..." value={noteContent} onChange={(_, { value }) => setNoteContent(value as string)} />
                  <Button primary onClick={createDoctorNote}>Add Note</Button>
                </Form>
              </Segment>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default DoctorDashboard;
