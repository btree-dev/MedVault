import React, { useState } from 'react';
import { Container, Form, Header, Segment, Dropdown, Divider, Button } from 'semantic-ui-react';
import { UserRole, UserSession } from '../services/canton';

const roleOptions = [
  { key: 'patient', text: 'Patient', value: 'patient' },
  { key: 'doctor', text: 'Doctor', value: 'doctor' },
  { key: 'pharmacy', text: 'Pharmacy', value: 'pharmacy' },
  { key: 'lab', text: 'Lab / Diagnostic Center', value: 'lab' },
  { key: 'operator', text: 'Operator', value: 'operator' },
];

const devUsers: { label: string; party: string; role: UserRole }[] = [
  { label: 'Alice (Patient)', party: 'Alice', role: 'patient' },
  { label: 'Dr. Smith (Doctor)', party: 'DrSmith', role: 'doctor' },
  { label: 'Dr. Jones (Doctor)', party: 'DrJones', role: 'doctor' },
  { label: 'PharmaCorp (Pharmacy)', party: 'PharmaCorp', role: 'pharmacy' },
  { label: 'LabCorp (Lab)', party: 'LabCorp', role: 'lab' },
  { label: 'Operator', party: 'Operator', role: 'operator' },
];

// Dummy JWT — Canton's JSON API in dev mode accepts unsigned tokens
const devToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwczovL2RhbWwuY29tL2xlZGdlci1hcGkiOnsibGVkZ2VySWQiOiJzYW5kYm94IiwiYXBwbGljYXRpb25JZCI6Im1lZHZhdWx0IiwiYWN0QXMiOlsiQWxpY2UiXX19.8s0X-ydg';

const isDev = !process.env.REACT_APP_LEDGER_URL;

interface Props {
  onLogin: (session: UserSession) => void;
}

const LoginScreen: React.FC<Props> = ({ onLogin }) => {
  const [party, setParty] = useState('');
  const [token, setToken] = useState('');
  const [role, setRole] = useState<UserRole>('patient');

  const handleSubmit = () => {
    if (party && token) {
      onLogin({ party, token, role });
    }
  };

  const handleDevLogin = (user: typeof devUsers[number]) => {
    onLogin({ party: user.party, token: devToken, role: user.role });
  };

  return (
    <Container style={{ marginTop: '4em', maxWidth: 500 }}>
      <Header as="h1" textAlign="center">MedVault</Header>

      {isDev && (
        <Segment>
          <Header as="h4">Development Login</Header>
          <p style={{ color: '#888', fontSize: '0.9em' }}>
            Quick login with preconfigured parties (requires Canton running locally)
          </p>
          {devUsers.map((user) => (
            <Button
              key={user.party}
              fluid
              style={{ marginBottom: '0.5em' }}
              onClick={() => handleDevLogin(user)}
            >
              {user.label}
            </Button>
          ))}
        </Segment>
      )}

      {isDev && <Divider horizontal>Or</Divider>}

      <Segment>
        <Header as="h4">{isDev ? 'Manual Login' : 'Login'}</Header>
        <Form onSubmit={handleSubmit}>
          <Form.Input
            label="Party ID"
            placeholder="e.g. Alice::12345..."
            value={party}
            onChange={(_, { value }) => setParty(value)}
            required
          />
          <Form.Input
            label="JWT Token"
            placeholder="Paste your JWT token"
            value={token}
            onChange={(_, { value }) => setToken(value)}
            required
          />
          <Form.Field>
            <label>Role</label>
            <Dropdown
              selection
              options={roleOptions}
              value={role}
              onChange={(_, { value }) => setRole(value as UserRole)}
            />
          </Form.Field>
          <Form.Button primary fluid>Login</Form.Button>
        </Form>
      </Segment>
    </Container>
  );
};

export default LoginScreen;
