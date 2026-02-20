import React, { useState } from 'react';
import { useParty, useLedger, useStreamQueries } from '../services/DamlLedger';
import { Header, Segment, Form, Card, Button, Message, Dropdown } from 'semantic-ui-react';
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

  const [selectedAccess, setSelectedAccess] = useState<string | null>(null);
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medFrequency, setMedFrequency] = useState('');
  const [prescNotes, setPrescNotes] = useState('');
  const [labType, setLabType] = useState('BloodWork');
  const [labReason, setLabReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const createPrescription = async () => {
    if (!selectedAccess || !medName) return;
    try {
      await ledger.exercise(
        '#MedVault:DoctorAccess:DoctorAccess',
        selectedAccess,
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
      setSuccess('Prescription created');
      setError('');
    } catch (e: any) {
      setError(e.message);
      setSuccess('');
    }
  };

  const createLabOrder = async () => {
    if (!selectedAccess || !labReason) return;
    try {
      await ledger.exercise(
        '#MedVault:DoctorAccess:DoctorAccess',
        selectedAccess,
        'CreateLabOrder',
        { labType, reason: labReason }
      );
      setLabReason('');
      setSuccess('Lab order created');
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
          <Segment>
            <Header as="h3">Patient Access Grants</Header>
            <Card.Group>
              {doctorAccesses.contracts.map((c: any) => (
                <Card
                  key={c.contractId}
                  color={selectedAccess === c.contractId ? 'blue' : undefined}
                  onClick={() => setSelectedAccess(c.contractId)}
                  style={{ cursor: 'pointer' }}
                >
                  <Card.Content>
                    <Card.Header>{c.payload.patientInfo?.name}</Card.Header>
                    <Card.Meta>Patient: {c.payload.patient}</Card.Meta>
                    <Card.Description>
                      Blood Type: {c.payload.patientInfo?.bloodType}
                    </Card.Description>
                  </Card.Content>
                </Card>
              ))}
            </Card.Group>
          </Segment>

          {selectedAccess && (
            <>
              {doctorAccesses.contracts
                .filter((c: any) => c.contractId === selectedAccess)
                .map((c: any) => (
                  <MedicalHistoryView key={c.contractId} record={c.payload} />
                ))}

              <Segment>
                <Header as="h3">Create Prescription</Header>
                <Form>
                  <Form.Group widths="equal">
                    <Form.Input label="Medication" value={medName} onChange={(_, { value }) => setMedName(value)} />
                    <Form.Input label="Dosage" value={medDosage} onChange={(_, { value }) => setMedDosage(value)} />
                    <Form.Input label="Frequency" value={medFrequency} onChange={(_, { value }) => setMedFrequency(value)} />
                  </Form.Group>
                  <Form.TextArea label="Notes" value={prescNotes} onChange={(_, { value }) => setPrescNotes(value as string)} />
                  <Button primary onClick={createPrescription}>Create Prescription</Button>
                </Form>
              </Segment>

              <Segment>
                <Header as="h3">Create Lab Order</Header>
                <Form>
                  <Form.Field>
                    <label>Lab Type</label>
                    <Dropdown
                      selection
                      options={labTypeOptions}
                      value={labType}
                      onChange={(_, { value }) => setLabType(value as string)}
                    />
                  </Form.Field>
                  <Form.Input label="Reason" value={labReason} onChange={(_, { value }) => setLabReason(value)} />
                  <Button primary onClick={createLabOrder}>Create Lab Order</Button>
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
