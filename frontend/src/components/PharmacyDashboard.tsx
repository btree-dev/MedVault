import React, { useState } from 'react';
import { useParty, useLedger, useStreamQueries } from '@daml/react';
import { Header, Segment, Card, Button, Message, Label } from 'semantic-ui-react';

const PharmacyDashboard: React.FC = () => {
  const party = useParty();
  const ledger = useLedger();

  const pharmacyAccesses = useStreamQueries('PharmacyAccess:PharmacyAccess' as any);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const acknowledgeDispensing = async (contractId: string) => {
    try {
      await (ledger as any).exercise(
        'PharmacyAccess:PharmacyAccess',
        'AcknowledgeDispensing',
        contractId,
        {}
      );
      setSuccess('Dispensing acknowledged');
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
              <Card key={c.contractId}>
                <Card.Content>
                  <Card.Header>{c.payload.prescription?.medication?.name}</Card.Header>
                  <Card.Meta>Patient: {c.payload.patient}</Card.Meta>
                  <Card.Description>
                    <p><strong>Dosage:</strong> {c.payload.prescription?.medication?.dosage}</p>
                    <p><strong>Frequency:</strong> {c.payload.prescription?.medication?.frequency}</p>
                    {c.payload.allergies?.length > 0 && (
                      <div>
                        <strong>Patient Allergies:</strong>{' '}
                        {c.payload.allergies.map((a: any, i: number) => (
                          <Label key={i} size="tiny" color="red">{a.name}</Label>
                        ))}
                      </div>
                    )}
                  </Card.Description>
                </Card.Content>
                <Card.Content extra>
                  <Button primary size="small" onClick={() => acknowledgeDispensing(c.contractId)}>
                    Acknowledge Dispensing
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
