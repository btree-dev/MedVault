import React, { useState } from 'react';
import { useParty, useLedger, useStreamQueries } from '../services/DamlLedger';
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

  const healthRecords = useStreamQueries('#MedVault:HealthRecord:HealthRecord');
  const invites = useStreamQueries('#MedVault:Operator:PatientInvite');
  const doctorAccesses = useStreamQueries('#MedVault:DoctorAccess:DoctorAccess');
  const pharmacyAccesses = useStreamQueries('#MedVault:PharmacyAccess:PharmacyAccess');
  const diagnosticAccesses = useStreamQueries('#MedVault:DiagnosticAccess:DiagnosticAccess');

  const [doctorParty, setDoctorParty] = useState('');
  const [duration, setDuration] = useState('Days30');
  const [error, setError] = useState('');
  const [patientName, setPatientName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [success, setSuccess] = useState('');

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
      const record = healthRecords.contracts[0];
      if (!record) {
        setError('No health record found');
        return;
      }
      await ledger.exercise(
        '#MedVault:HealthRecord:HealthRecord',
        record.contractId,
        'GrantDoctorAccess',
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
      {success && <Message positive onDismiss={() => setSuccess('')}>{success}</Message>}

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
                    <Form.Input
                      label="Full Name"
                      required
                      value={patientName}
                      onChange={(_, { value }) => setPatientName(value)}
                      placeholder="e.g. Alice Johnson"
                    />
                    <Form.Input
                      label="Date of Birth"
                      type="date"
                      required
                      value={dateOfBirth}
                      onChange={(_, { value }) => setDateOfBirth(value)}
                    />
                    <Form.Input
                      label="Blood Type"
                      value={bloodType}
                      onChange={(_, { value }) => setBloodType(value)}
                      placeholder="e.g. O+"
                    />
                    <Form.Input
                      label="Emergency Contact"
                      value={emergencyContact}
                      onChange={(_, { value }) => setEmergencyContact(value)}
                      placeholder="e.g. Bob (555-1234)"
                    />
                    <Button primary onClick={() => acceptInvite(c.contractId)}>Accept Invite</Button>
                  </Form>
                </Card.Description>
              </Card.Content>
            </Card>
          ))}
        </Segment>
      )}

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
                  await ledger.exercise(
                    '#MedVault:DoctorAccess:DoctorAccess',
                    c.contractId,
                    'RevokeDoctorAccess',
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
                  await ledger.exercise(
                    '#MedVault:PharmacyAccess:PharmacyAccess',
                    c.contractId,
                    'RevokePharmacyAccess',
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
                  await ledger.exercise(
                    '#MedVault:DiagnosticAccess:DiagnosticAccess',
                    c.contractId,
                    'RevokeDiagnosticAccess',
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
