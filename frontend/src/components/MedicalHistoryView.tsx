import React from 'react';
import { Table, Header, Label, Segment } from 'semantic-ui-react';

interface Props {
  record: any;
}

const MedicalHistoryView: React.FC<Props> = ({ record }) => {
  const { patientInfo, allergies, conditions, medications, surgeries, illnesses, immunizations, familyHistory } = record;

  return (
    <div>
      <Segment>
        <Header as="h3">Patient Information</Header>
        <p><strong>Name:</strong> {patientInfo.name}</p>
        <p><strong>Date of Birth:</strong> {patientInfo.dateOfBirth}</p>
        <p><strong>Blood Type:</strong> {patientInfo.bloodType}</p>
        <p><strong>Emergency Contact:</strong> {patientInfo.emergencyContact}</p>
      </Segment>

      {allergies.length > 0 && (
        <Segment>
          <Header as="h4">Allergies</Header>
          {allergies.map((a: any, i: number) => (
            <Label key={i} color={a.severity === 'severe' ? 'red' : a.severity === 'moderate' ? 'orange' : 'yellow'}>
              {a.name} — {a.severity}
            </Label>
          ))}
        </Segment>
      )}

      {conditions.length > 0 && (
        <Segment>
          <Header as="h4">Conditions</Header>
          <Table compact>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Condition</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Diagnosed</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {conditions.map((c: any, i: number) => (
                <Table.Row key={i}>
                  <Table.Cell>{c.name}</Table.Cell>
                  <Table.Cell>{c.status}</Table.Cell>
                  <Table.Cell>{c.diagnosedDate}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Segment>
      )}

      {medications.length > 0 && (
        <Segment>
          <Header as="h4">Current Medications</Header>
          <Table compact>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Medication</Table.HeaderCell>
                <Table.HeaderCell>Dosage</Table.HeaderCell>
                <Table.HeaderCell>Frequency</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {medications.map((m: any, i: number) => (
                <Table.Row key={i}>
                  <Table.Cell>{m.name}</Table.Cell>
                  <Table.Cell>{m.dosage}</Table.Cell>
                  <Table.Cell>{m.frequency}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Segment>
      )}

      {surgeries.length > 0 && (
        <Segment>
          <Header as="h4">Surgeries</Header>
          <Table compact>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Procedure</Table.HeaderCell>
                <Table.HeaderCell>Date</Table.HeaderCell>
                <Table.HeaderCell>Surgeon</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {surgeries.map((s: any, i: number) => (
                <Table.Row key={i}>
                  <Table.Cell>{s.procedure}</Table.Cell>
                  <Table.Cell>{s.date}</Table.Cell>
                  <Table.Cell>{s.surgeon}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Segment>
      )}

      {illnesses.length > 0 && (
        <Segment>
          <Header as="h4">Illness History</Header>
          <Table compact>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Illness</Table.HeaderCell>
                <Table.HeaderCell>Severity</Table.HeaderCell>
                <Table.HeaderCell>Period</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {illnesses.map((il: any, i: number) => (
                <Table.Row key={i}>
                  <Table.Cell>{il.name}</Table.Cell>
                  <Table.Cell>{il.severity}</Table.Cell>
                  <Table.Cell>{il.startDate} — {il.endDate || 'ongoing'}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Segment>
      )}

      {immunizations.length > 0 && (
        <Segment>
          <Header as="h4">Immunizations</Header>
          <Table compact>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Vaccine</Table.HeaderCell>
                <Table.HeaderCell>Date</Table.HeaderCell>
                <Table.HeaderCell>Provider</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {immunizations.map((im: any, i: number) => (
                <Table.Row key={i}>
                  <Table.Cell>{im.name}</Table.Cell>
                  <Table.Cell>{im.date}</Table.Cell>
                  <Table.Cell>{im.provider}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Segment>
      )}

      {familyHistory.length > 0 && (
        <Segment>
          <Header as="h4">Family History</Header>
          <Table compact>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Relation</Table.HeaderCell>
                <Table.HeaderCell>Condition</Table.HeaderCell>
                <Table.HeaderCell>Notes</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {familyHistory.map((fh: any, i: number) => (
                <Table.Row key={i}>
                  <Table.Cell>{fh.relation}</Table.Cell>
                  <Table.Cell>{fh.condition}</Table.Cell>
                  <Table.Cell>{fh.notes}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Segment>
      )}
    </div>
  );
};

export default MedicalHistoryView;
