import React, { useState } from 'react';
import { useParty, useLedger, useStreamQueries } from '../services/DamlLedger';
import { Header, Segment, Card, Button, Message, Label, Table } from 'semantic-ui-react';

const PharmacyDashboard: React.FC = () => {
  const party = useParty();
  const ledger = useLedger();

  const pharmacyAccesses = useStreamQueries('#MedVault:PharmacyAccess:PharmacyAccess');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const acknowledgeDispensing = async (contractId: string) => {
    try {
      await ledger.exercise(
        '#MedVault:PharmacyAccess:PharmacyAccess',
        contractId,
        'AcknowledgeDispensing',
        {}
      );
      setSuccess('Medication dispensed and recorded');
      setError('');
    } catch (e: any) {
      setError(e.message);
      setSuccess('');
    }
  };

  return (
    <div>
      <Header as="h2">Pharmacy Dashboard</Header>

      {error && <Message negative onDismiss={() => setError('')}>{error}</Message>}
      {success && <Message positive onDismiss={() => setSuccess('')}>{success}</Message>}

      {pharmacyAccesses.contracts.length === 0 ? (
        <Message info>No prescriptions pending. Patients will grant access when needed.</Message>
      ) : (
        <Segment>
          <Header as="h3">Pending Prescriptions</Header>
          <Card.Group>
            {pharmacyAccesses.contracts.map((c: any) => (
              <Card key={c.contractId} fluid>
                <Card.Content>
                  <Card.Header>{c.payload.prescription?.medication?.name}</Card.Header>
                  <Card.Meta>Patient: {c.payload.patient}</Card.Meta>
                  <Card.Description>
                    <Table definition compact size="small">
                      <Table.Body>
                        <Table.Row>
                          <Table.Cell width={4}>Dosage</Table.Cell>
                          <Table.Cell>{c.payload.prescription?.medication?.dosage}</Table.Cell>
                        </Table.Row>
                        <Table.Row>
                          <Table.Cell>Frequency</Table.Cell>
                          <Table.Cell>{c.payload.prescription?.medication?.frequency}</Table.Cell>
                        </Table.Row>
                        <Table.Row>
                          <Table.Cell>Prescribed By</Table.Cell>
                          <Table.Cell>{c.payload.prescription?.medication?.prescribedBy}</Table.Cell>
                        </Table.Row>
                        <Table.Row>
                          <Table.Cell>Prescribed Date</Table.Cell>
                          <Table.Cell>{c.payload.prescription?.medication?.prescribedDate}</Table.Cell>
                        </Table.Row>
                        {c.payload.prescription?.notes && (
                          <Table.Row>
                            <Table.Cell>Doctor Notes</Table.Cell>
                            <Table.Cell>{c.payload.prescription?.notes}</Table.Cell>
                          </Table.Row>
                        )}
                      </Table.Body>
                    </Table>
                    {c.payload.allergies?.length > 0 && (
                      <div style={{ marginTop: '0.5em' }}>
                        <strong>Patient Allergies:</strong>{' '}
                        {c.payload.allergies.map((a: any, i: number) => (
                          <Label key={i} size="tiny" color={a.severity === 'severe' ? 'red' : a.severity === 'moderate' ? 'orange' : 'yellow'}>
                            {a.name} ({a.severity})
                          </Label>
                        ))}
                      </div>
                    )}
                    {c.payload.medications?.length > 0 && (
                      <div style={{ marginTop: '0.5em' }}>
                        <strong>Current Medications:</strong>{' '}
                        {c.payload.medications.map((m: any, i: number) => (
                          <Label key={i} size="tiny">{m.name} {m.dosage}</Label>
                        ))}
                      </div>
                    )}
                  </Card.Description>
                </Card.Content>
                <Card.Content extra>
                  <Button primary onClick={() => acknowledgeDispensing(c.contractId)}>
                    Dispense Medication
                  </Button>
                </Card.Content>
              </Card>
            ))}
          </Card.Group>
        </Segment>
      )}
    </div>
  );
};

export default PharmacyDashboard;
