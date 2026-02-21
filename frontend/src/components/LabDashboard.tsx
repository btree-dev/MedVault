import React, { useState } from 'react';
import { useParty, useLedger, useStreamQueries } from '../services/DamlLedger';
import { Header, Segment, Card, Button, Form, Message, Label, Table } from 'semantic-ui-react';

const LabDashboard: React.FC = () => {
  const party = useParty();
  const ledger = useLedger();

  const diagnosticAccesses = useStreamQueries('#MedVault:DiagnosticAccess:DiagnosticAccess');
  const labResults = useStreamQueries('#MedVault:LabResults:LabResultReport');
  const healthRecords = useStreamQueries('#MedVault:HealthRecord:HealthRecord');

  const [findings, setFindings] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submitResults = async (contractId: string, patientParty: string) => {
    const f = findings[contractId];
    if (!f) {
      setError('Please enter findings before submitting');
      return;
    }
    try {
      const hrContract = healthRecords.contracts.find((c: any) => c.payload.patient === patientParty);
      if (!hrContract) { setError('No health record found for patient'); return; }
      await ledger.exercise(
        '#MedVault:DiagnosticAccess:DiagnosticAccess',
        contractId,
        'SubmitLabResults',
        {
          findings: f,
          resultDate: new Date().toISOString().split('T')[0],
          healthRecordCid: hrContract.contractId,
        }
      );
      setFindings((prev) => ({ ...prev, [contractId]: '' }));
      setSuccess('Lab results submitted successfully');
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

      {/* Pending Lab Orders */}
      {diagnosticAccesses.contracts.length === 0 ? (
        <Message info>No pending lab orders. Patients will grant diagnostic access when needed.</Message>
      ) : (
        <Segment>
          <Header as="h3">Pending Lab Orders</Header>
          <Card.Group>
            {diagnosticAccesses.contracts.map((c: any) => (
              <Card key={c.contractId} fluid>
                <Card.Content>
                  <Card.Header>
                    <Label color="blue" size="large">{c.payload.labOrder?.labType}</Label>
                  </Card.Header>
                  <Card.Meta>Patient: {c.payload.patient}</Card.Meta>
                  <Card.Description>
                    <Table definition compact size="small">
                      <Table.Body>
                        <Table.Row>
                          <Table.Cell width={4}>Test Type</Table.Cell>
                          <Table.Cell>{c.payload.labOrder?.labType}</Table.Cell>
                        </Table.Row>
                        <Table.Row>
                          <Table.Cell>Reason</Table.Cell>
                          <Table.Cell>{c.payload.labOrder?.reason}</Table.Cell>
                        </Table.Row>
                        <Table.Row>
                          <Table.Cell>Ordering Doctor</Table.Cell>
                          <Table.Cell>{c.payload.labOrder?.doctor}</Table.Cell>
                        </Table.Row>
                      </Table.Body>
                    </Table>
                  </Card.Description>
                </Card.Content>
                <Card.Content extra>
                  <Form>
                    <Form.TextArea
                      label="Findings / Results"
                      value={findings[c.contractId] || ''}
                      onChange={(_, { value }) =>
                        setFindings((prev) => ({ ...prev, [c.contractId]: value as string }))
                      }
                      placeholder="Enter detailed lab findings and results..."
                      rows={4}
                    />
                    <Button primary onClick={() => submitResults(c.contractId, c.payload.patient)}>
                      Submit Results
                    </Button>
                  </Form>
                </Card.Content>
              </Card>
            ))}
          </Card.Group>
        </Segment>
      )}

      {/* Completed Lab Results */}
      {labResults.contracts.length > 0 && (
        <Segment>
          <Header as="h3">Completed Results</Header>
          <Table compact>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Patient</Table.HeaderCell>
                <Table.HeaderCell>Type</Table.HeaderCell>
                <Table.HeaderCell>Date</Table.HeaderCell>
                <Table.HeaderCell>Findings</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {labResults.contracts.map((c: any) => (
                <Table.Row key={c.contractId}>
                  <Table.Cell>{c.payload.patient}</Table.Cell>
                  <Table.Cell><Label>{c.payload.labResult?.labType}</Label></Table.Cell>
                  <Table.Cell>{c.payload.labResult?.resultDate}</Table.Cell>
                  <Table.Cell>{c.payload.labResult?.findings}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Segment>
      )}
    </div>
  );
};

export default LabDashboard;
