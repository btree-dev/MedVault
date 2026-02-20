import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { LedgerService, Contract } from './ledger';

interface LedgerContextValue {
  ledger: LedgerService;
  party: string;
}

const LedgerContext = createContext<LedgerContextValue | null>(null);

interface DamlLedgerProps {
  userId: string;
  party: string;
  children: React.ReactNode;
}

const LEDGER_URL = process.env.REACT_APP_LEDGER_URL || '';

export const DamlLedger: React.FC<DamlLedgerProps> = ({ userId, party, children }) => {
  const [ledger] = useState(
    () => new LedgerService({ baseUrl: LEDGER_URL, userId, party })
  );

  return (
    <LedgerContext.Provider value={{ ledger, party }}>
      {children}
    </LedgerContext.Provider>
  );
};

export function useParty(): string {
  const ctx = useContext(LedgerContext);
  if (!ctx) throw new Error('useParty must be used within DamlLedger');
  return ctx.party;
}

export function useLedger(): LedgerService {
  const ctx = useContext(LedgerContext);
  if (!ctx) throw new Error('useLedger must be used within DamlLedger');
  return ctx.ledger;
}

interface StreamResult<T> {
  contracts: Contract<T>[];
  loading: boolean;
}

export function useStreamQueries<T = Record<string, unknown>>(
  templateId: string,
  pollIntervalMs: number = 3000,
): StreamResult<T> {
  const ctx = useContext(LedgerContext);
  if (!ctx) throw new Error('useStreamQueries must be used within DamlLedger');

  const [contracts, setContracts] = useState<Contract<T>[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const fetchContracts = useCallback(async () => {
    try {
      const result = await ctx.ledger.query(templateId);
      if (mountedRef.current) {
        setContracts(result as Contract<T>[]);
        setLoading(false);
      }
    } catch (e) {
      console.error('Query error:', e);
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [ctx.ledger, templateId]);

  useEffect(() => {
    mountedRef.current = true;
    fetchContracts();
    const interval = setInterval(fetchContracts, pollIntervalMs);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchContracts, pollIntervalMs]);

  return { contracts, loading };
}

export default DamlLedger;
