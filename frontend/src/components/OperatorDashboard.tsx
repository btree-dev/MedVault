import React, { useState } from 'react';
import { useParty, useLedger, useStreamQueries } from '../services/DamlLedger';
import { Header, Segment, Form, Card, Button, Message } from 'semantic-ui-react';

const OperatorDashboard: React.FC = () => {
  const party = useParty();
  const ledger = useLedger();

  const operators = useStreamQueries('#MedVault:Operator:Operator');
  const invites = useStreamQueries('#MedVault:Operator:PatientInvite');

  const [patientParty, setPatientParty] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const setupOperator = async () => {
    try {
      await ledger.create('#MedVault:Operator:Operator', { operator: party });
      setSuccess('Operator contract created');
      setError('');
    } catch (e: any) {
      setError(e.message);
      setSuccess('');
    }
  };

  const invitePatient = async () => {
    if (!patientParty) return;
    const op = operators.contracts[0];
    if (!op) {
      setError('Create operator contract first');
      return;
    }
    try {
      await ledger.exercise(
        '#MedVault:Operator:Operator',
        op.contractId,
        'InvitePatient',
        { patient: patientParty }
      );
      setPatientParty('');
      setSuccess('Invite sent');
      setError('');
    } catch (e: any) {
      setError(e.message);
      setSuccess('');
    }
  };

  return (
    <div>
      <Header as="h2">Operator Dashboard</Header>

      {error && <Message negative onDismiss={() => setError('')}>{error}</Message>}
      {success && <Message positive onDismiss={() => setSuccess('')}>{success}</Message>}

      {operators.contracts.length === 0 ? (
        <Segment>
          <p>No operator contract found. Set up one to start inviting patients.</p>
          <Button primary onClick={setupOperator}>Create Operator Contract</Button>
        </Segment>
      ) : (
        <Segment>
          <Header as="h3">Invite Patient</Header>
          <Form>
            <Form.Input
              label="Patient Party ID"
              placeholder="e.g. Alice::12345..."
              value={patientParty}
              onChange={(_, { value }) => setPatientParty(value)}
            />
            <Button primary onClick={invitePatient}>Send Invite</Button>
          </Form>
        </Segment>
      )}

      {invites.contracts.length > 0 && (
        <Segment>
          <Header as="h3">Pending Invites</Header>
          <Card.Group>
            {invites.contracts.map((c: any) => (
              <Card key={c.contractId}>
                <Card.Content>
                  <Card.Header>Invite</Card.Header>
                  <Card.Meta>Patient: {c.payload.patient}</Card.Meta>
                  <Card.Description>Awaiting patient response</Card.Description>
                </Card.Content>
              </Card>
            ))}
          </Card.Group>
        </Segment>
      )}
    </div>
  );
};

export default OperatorDashboard;
