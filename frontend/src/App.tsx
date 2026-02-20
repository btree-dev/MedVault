import React, { useState } from 'react';
import { Container, Header } from 'semantic-ui-react';
import { DamlLedger } from './services/DamlLedger';
import { UserSession } from './services/canton';
import LoginScreen from './components/LoginScreen';
import PatientDashboard from './components/PatientDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import PharmacyDashboard from './components/PharmacyDashboard';
import LabDashboard from './components/LabDashboard';
import OperatorDashboard from './components/OperatorDashboard';

const App: React.FC = () => {
  const [session, setSession] = useState<UserSession | null>(null);

  if (!session) {
    return <LoginScreen onLogin={setSession} />;
  }

  const renderDashboard = () => {
    switch (session.role) {
      case 'patient':
        return <PatientDashboard />;
      case 'doctor':
        return <DoctorDashboard />;
      case 'pharmacy':
        return <PharmacyDashboard />;
      case 'lab':
        return <LabDashboard />;
      case 'operator':
        return <OperatorDashboard />;
    }
  };

  return (
    <DamlLedger
      userId={session.token}
      party={session.party}
    >
      <Container style={{ marginTop: '2em' }}>
        <Header as="h1">
          MedVault
          <Header.Subheader>
            Logged in as {session.party} ({session.role})
            {' '}
            <a href="#" onClick={(e) => { e.preventDefault(); setSession(null); }}>
              Logout
            </a>
          </Header.Subheader>
        </Header>
        {renderDashboard()}
      </Container>
    </DamlLedger>
  );
};

export default App;
