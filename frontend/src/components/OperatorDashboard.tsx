import React, { useState, useEffect } from 'react';
import { useParty, useLedger, useStreamQueries } from '../services/DamlLedger';
import { Header, Segment, Form, Card, Button, Message, Label } from 'semantic-ui-react';

const OperatorDashboard: React.FC = () => {
  const party = useParty();
  const ledger = useLedger();

  const operators = useStreamQueries('#MedVault:Operator:Operator');
  const invites = useStreamQueries('#MedVault:Operator:PatientInvite');
  const auditObservers = useStreamQueries('#MedVault:Audit:AuditObserver');
  const auditEvents = useStreamQueries('#MedVault:Audit:AuditEvent');

  const [patientParty, setPatientParty] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [auditorParty, setAuditorParty] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    ledger.getPartyId('Auditor').then((p) => {
      if (p) setAuditorParty(p);
    }).catch(() => {});
  }, [ledger]);

  const logAuditEvent = async (eventType: string, description: string) => {
    const observer = auditObservers.contracts[0];
    if (!observer) return;
    try {
      await ledger.exercise(
        '#MedVault:Audit:AuditObserver',
        observer.contractId,
        'LogEvent',
        {
          eventType,
          description,
          timestamp: new Date().toISOString(),
        }
      );
    } catch (e: any) {
      console.error('Audit log failed:', e.message);
    }
  };

  const setupOperator = async () => {
    try {
      await ledger.create('#MedVault:Operator:Operator', { operator: party });

      // Create AuditObserver if Auditor party exists and no observer yet
      if (auditorParty && auditObservers.contracts.length === 0) {
        await ledger.create('#MedVault:Audit:AuditObserver', {
          operator: party,
          auditor: auditorParty,
        });
        setSuccess('Operator contract and AuditObserver created');
      } else {
        setSuccess('Operator contract created');
      }
      setError('');
    } catch (e: any) {
      setError(e.message);
      setSuccess('');
    }
  };

  const invitePatient = async () => {
    if (!patientParty || loading) return;
    const op = operators.contracts[0];
    if (!op) {
      setError('Create operator contract first');
      return;
    }
    setLoading(true);
    try {
      await ledger.exercise(
        '#MedVault:Operator:Operator',
        op.contractId,
        'InvitePatient',
        { patient: patientParty }
      );
      await logAuditEvent('PATIENT_INVITED', `Invited patient ${patientParty}`);
      setPatientParty('');
      setSuccess('Invite sent');
      setError('');
    } catch (e: any) {
      setError(e.message);
      setSuccess('');
    } finally {
      setLoading(false);
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
            <Button primary onClick={invitePatient} loading={loading} disabled={loading}>Send Invite</Button>
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

      <Segment>
        <Header as="h3">
          Audit Trail
          <Label circular color="blue" style={{ marginLeft: '0.5em' }}>
            {auditEvents.contracts.length}
          </Label>
        </Header>
        {auditObservers.contracts.length > 0 ? (
          <p style={{ color: '#888' }}>
            AuditObserver active. {auditEvents.contracts.length} event(s) logged.
          </p>
        ) : (
          <p style={{ color: '#888' }}>
            {auditorParty
              ? 'AuditObserver will be created when you set up the operator contract.'
              : 'Auditor party not found. Run setup-parties.sh to allocate the Auditor party.'}
          </p>
        )}
      </Segment>
    </div>
  );
};

export default OperatorDashboard;
