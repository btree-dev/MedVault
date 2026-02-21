export const cantonConfig = {
  baseUrl: process.env.REACT_APP_LEDGER_URL || 'http://localhost:7575/',
};

export type UserRole = 'patient' | 'doctor' | 'pharmacy' | 'lab' | 'operator' | 'auditor';

export interface UserSession {
  party: string;
  token: string;
  role: UserRole;
}
