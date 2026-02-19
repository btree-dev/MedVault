import React, { useState } from 'react';
import { useParty, useLedger, useStreamQueries } from '@daml/react';
import { Header, Segment, Form, Dropdown, Card, Button, Message } from 'semantic-ui-react';
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

  // Stream queries for contracts visible to this patient
  // Note: Template types come from generated @daml.js codegen
  const healthRecords = useStreamQueries('HealthRecord:HealthRecord' as any);
  const doctorAccesses = useStreamQueries('DoctorAccess:DoctorAccess' as any);
  const pharmacyAccesses = useStreamQueries('PharmacyAccess:PharmacyAccess' as any);
  const diagnosticAccesses = useStreamQueries('DiagnosticAccess:DiagnosticAccess' as any);

  const [doctorParty, setDoctorParty] = useState('');
  const [duration, setDuration] = useState('Days30');
  const [error, setError] = useState('');

  const grantDoctorAccess = async () => {
    if (!doctorParty) return;
    try {
      const record = healthRecords.contracts[0];
      if (!record) {
        setError('No health record found');
        return;
      }
      await (ledger as any).exercise(
        'HealthRecord:HealthRecord',
        'GrantDoctorAccess',
        record.contractId,
        { doctor: doctorParty, duration }
      );
      setDoctorParty('');
      setError('');
    } catch (e: any) {
      setError(e.message);
    }
  };

  const record = healthRecords.contracts[0]?.payload;

  return (
    <div>
      <Header as="h2">Patient Dashboard</Header>

      {error && <Message negative onDismiss={() => setError('')}>{error}</Message>}

      {record ? (
        <MedicalHistoryView record={record} />
      ) : (
        <Message info>No health record found. Ask your operator to send you an invite.</Message>
      )}

      <Segment>
        <Header as="h3">Grant Doctor Access</Header>
        <Form>
          <Form.Input
            label="Doctor Party ID"
            placeholder="e.g. DrSmith::12345..."
            value={doctorParty}
            onChange={(_, { value }) => setDoctorParty(value)}
          />
          <Form.Field>
            <label>Duration</label>
            <Dropdown
              selection
              options={durationOptions}
              value={duration}
              onChange={(_, { value }) => setDuration(value as string)}
            />
          </Form.Field>
          <Button primary onClick={grantDoctorAccess}>Grant Access</Button>
        </Form>
      </Segment>

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
                  await (ledger as any).exercise(
                    'DoctorAccess:DoctorAccess',
                    'RevokeDoctorAccess',
                    c.contractId,
                    {}
                  );
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
                  await (ledger as any).exercise(
                    'PharmacyAccess:PharmacyAccess',
                    'RevokePharmacyAccess',
                    c.contractId,
                    {}
                  );
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
                  await (ledger as any).exercise(
                    'DiagnosticAccess:DiagnosticAccess',
                    'RevokeDiagnosticAccess',
                    c.contractId,
                    {}
                  );
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
