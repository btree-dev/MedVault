import React, { useState } from 'react';
import { useParty, useStreamQueries } from '../services/DamlLedger';
import { Header, Segment, Table, Input, Message } from 'semantic-ui-react';

const AuditorDashboard: React.FC = () => {
  const party = useParty();
  const auditEvents = useStreamQueries('#MedVault:Audit:AuditEvent');
  const [filter, setFilter] = useState('');

  const events = auditEvents.contracts
    .map((c: any) => ({
      contractId: c.contractId,
      eventType: c.payload.eventType,
      description: c.payload.description,
      timestamp: c.payload.timestamp,
      operator: c.payload.operator,
    }))
    .filter((e: any) =>
      !filter || e.eventType.toLowerCase().includes(filter.toLowerCase())
    )
    .sort((a: any, b: any) => (b.timestamp > a.timestamp ? 1 : -1));

  return (
    <div>
      <Header as="h2">Auditor Dashboard</Header>

      <Segment>
        <Header as="h3">Audit Trail</Header>
        <Input
          icon="search"
          placeholder="Filter by event type..."
          value={filter}
          onChange={(_, { value }) => setFilter(value)}
          style={{ marginBottom: '1em' }}
        />

        {events.length === 0 ? (
          <Message info>No audit events recorded yet.</Message>
        ) : (
          <Table celled striped>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Timestamp</Table.HeaderCell>
                <Table.HeaderCell>Event Type</Table.HeaderCell>
                <Table.HeaderCell>Description</Table.HeaderCell>
                <Table.HeaderCell>Operator</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {events.map((e: any) => (
                <Table.Row key={e.contractId}>
                  <Table.Cell>{e.timestamp}</Table.Cell>
                  <Table.Cell>{e.eventType}</Table.Cell>
                  <Table.Cell>{e.description}</Table.Cell>
                  <Table.Cell>{e.operator}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
        <p style={{ color: '#888', fontSize: '0.9em' }}>
          Total events: {events.length}
        </p>
      </Segment>
    </div>
  );
};

export default AuditorDashboard;
