import React, { useState } from 'react';
import { useParty, useLedger, useStreamQueries } from '../services/DamlLedger';
import { Header, Segment, Card, Button, Form, Message } from 'semantic-ui-react';

const LabDashboard: React.FC = () => {
  const party = useParty();
  const ledger = useLedger();

  const diagnosticAccesses = useStreamQueries('#MedVault:DiagnosticAccess:DiagnosticAccess');

  const [findings, setFindings] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submitResults = async (contractId: string) => {
    const f = findings[contractId];
    if (!f) return;
    try {
      await ledger.exercise(
        '#MedVault:DiagnosticAccess:DiagnosticAccess',
        contractId,
        'SubmitLabResults',
        {
          findings: f,
          resultDate: new Date().toISOString().split('T')[0],
        }
      );
      setFindings((prev) => ({ ...prev, [contractId]: '' }));
      setSuccess('Lab results submitted');
      setError('');
    } catch (e: any) {
      setError(e.message);
      setSuccess('');
    }
  };

  return (
    <div>
      <Header as="h2">Lab / Diagnostic Center Dashboard</Header>

      {error && <Message negative onDismiss={() => setError('')}>{error}</Message>}
      {success && <Message positive onDismiss={() => setSuccess('')}>{success}</Message>}

      {diagnosticAccesses.contracts.length === 0 ? (
        <Message info>No pending lab orders. Patients will grant diagnostic access when needed.</Message>
      ) : (
        <Segment>
          <Header as="h3">Pending Lab Orders</Header>
          <Card.Group>
            {diagnosticAccesses.contracts.map((c: any) => (
              <Card key={c.contractId} fluid>
                <Card.Content>
                  <Card.Header>Lab Order: {c.payload.labOrder?.labType}</Card.Header>
                  <Card.Meta>Patient: {c.payload.patient}</Card.Meta>
                  <Card.Description>
                    <p><strong>Reason:</strong> {c.payload.labOrder?.reason}</p>
                  </Card.Description>
                </Card.Content>
                <Card.Content extra>
                  <Form>
                    <Form.TextArea
                      label="Findings"
                      value={findings[c.contractId] || ''}
                      onChange={(_, { value }) =>
                        setFindings((prev) => ({ ...prev, [c.contractId]: value as string }))
                      }
                      placeholder="Enter lab findings..."
                    />
                    <Button primary size="small" onClick={() => submitResults(c.contractId)}>
                      Submit Results
                    </Button>
                  </Form>
                </Card.Content>
              </Card>
            ))}
          </Card.Group>
        </Segment>
      )}
    </div>
  );
};

export default LabDashboard;
