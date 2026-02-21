import React, { useState } from 'react';
import { Container, Form, Header, Segment, Dropdown, Divider, Button, Message } from 'semantic-ui-react';
import { UserRole, UserSession } from '../services/canton';
import { LedgerService } from '../services/ledger';

const LEDGER_URL = process.env.REACT_APP_LEDGER_URL || '';

const roleOptions = [
  { key: 'patient', text: 'Patient', value: 'patient' },
  { key: 'doctor', text: 'Doctor', value: 'doctor' },
  { key: 'pharmacy', text: 'Pharmacy', value: 'pharmacy' },
  { key: 'lab', text: 'Lab / Diagnostic Center', value: 'lab' },
  { key: 'operator', text: 'Operator', value: 'operator' },
  { key: 'auditor', text: 'Auditor', value: 'auditor' },
];

const devUsers: { label: string; userId: string; role: UserRole }[] = [
  { label: 'Alice (Patient)', userId: 'Alice', role: 'patient' },
  { label: 'Dr. Smith (Doctor)', userId: 'DrSmith', role: 'doctor' },
  { label: 'Dr. Jones (Doctor)', userId: 'DrJones', role: 'doctor' },
  { label: 'PharmaCorp (Pharmacy)', userId: 'PharmaCorp', role: 'pharmacy' },
  { label: 'LabCorp (Lab)', userId: 'LabCorp', role: 'lab' },
  { label: 'Operator', userId: 'Operator', role: 'operator' },
  { label: 'Auditor', userId: 'Auditor', role: 'auditor' },
];

const isDev = !process.env.REACT_APP_LEDGER_URL;

interface Props {
  onLogin: (session: UserSession) => void;
}

const LoginScreen: React.FC<Props> = ({ onLogin }) => {
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<UserRole>('patient');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loginWithUserId = async (uid: string, r: UserRole) => {
    setLoading(true);
    setError('');
    try {
      const svc = new LedgerService({ baseUrl: LEDGER_URL, userId: uid, party: '' });
      const party = await svc.getPartyId(uid);
      if (!party) {
        throw new Error(`User "${uid}" not found or has no primary party`);
      }
      onLogin({ party, token: uid, role: r });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = (user: typeof devUsers[number]) => {
    loginWithUserId(user.userId, user.role);
  };

  const handleSubmit = () => {
    if (userId) {
      loginWithUserId(userId, role);
    }
  };

  return (
    <Container style={{ marginTop: '4em', maxWidth: 500 }}>
      <Header as="h1" textAlign="center">MedVault</Header>

      {error && <Message negative onDismiss={() => setError('')}>{error}</Message>}

      {isDev && (
        <Segment>
          <Header as="h4">Development Login</Header>
          <p style={{ color: '#888', fontSize: '0.9em' }}>
            Quick login with preconfigured parties (requires Canton running locally)
          </p>
          {devUsers.map((user) => (
            <Button
              key={user.userId}
              fluid
              style={{ marginBottom: '0.5em' }}
              onClick={() => handleDevLogin(user)}
              disabled={loading}
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
            label="User ID"
            placeholder="e.g. Alice"
            value={userId}
            onChange={(_, { value }) => setUserId(value)}
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
          <Form.Button primary fluid disabled={loading}>
            {loading ? 'Connecting...' : 'Login'}
          </Form.Button>
        </Form>
      </Segment>
    </Container>
  );
};

export default LoginScreen;
