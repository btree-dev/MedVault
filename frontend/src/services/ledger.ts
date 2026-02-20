// Canton v2 HTTP JSON API client

export interface LedgerConfig {
  baseUrl: string;
  userId: string;
  party: string;
}

export interface Contract<T = Record<string, unknown>> {
  contractId: string;
  templateId: string;
  payload: T;
}

interface AcsEntry {
  workflowId: string;
  contractEntry: {
    JsActiveContract: {
      createdEvent: {
        contractId: string;
        templateId: string;
        createArgument: Record<string, unknown>;
        packageName: string;
      };
    };
  };
}

let commandCounter = 0;

function nextCommandId(): string {
  commandCounter++;
  return `cmd-${Date.now()}-${commandCounter}`;
}

export class LedgerService {
  private config: LedgerConfig;

  constructor(config: LedgerConfig) {
    this.config = config;
  }

  get party(): string {
    return this.config.party;
  }

  async create(templateId: string, payload: Record<string, unknown>): Promise<string> {
    const res = await fetch(`${this.config.baseUrl}/v2/commands/submit-and-wait`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commands: [{
          CreateCommand: {
            templateId,
            createArguments: payload,
          },
        }],
        userId: this.config.userId,
        commandId: nextCommandId(),
        actAs: [this.config.party],
        readAs: [this.config.party],
      }),
    });
    const data = await res.json();
    if (data.code || data.errors) {
      throw new Error(data.cause || data.errors?.[0] || 'Create failed');
    }
    return data.updateId;
  }

  async exercise(
    templateId: string,
    contractId: string,
    choice: string,
    choiceArgument: Record<string, unknown>,
  ): Promise<string> {
    const res = await fetch(`${this.config.baseUrl}/v2/commands/submit-and-wait`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commands: [{
          ExerciseCommand: {
            templateId,
            contractId,
            choice,
            choiceArgument,
          },
        }],
        userId: this.config.userId,
        commandId: nextCommandId(),
        actAs: [this.config.party],
        readAs: [this.config.party],
      }),
    });
    const data = await res.json();
    if (data.code || data.errors) {
      throw new Error(data.cause || data.errors?.[0] || 'Exercise failed');
    }
    return data.updateId;
  }

  async query(templateId: string): Promise<Contract[]> {
    // First get ledger end
    const endRes = await fetch(`${this.config.baseUrl}/v2/state/ledger-end`);
    const endData = await endRes.json();
    const offset = endData.offset;

    const res = await fetch(`${this.config.baseUrl}/v2/state/active-contracts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filter: {
          filtersByParty: {
            [this.config.party]: {
              cumulative: [{
                identifierFilter: {
                  TemplateFilter: {
                    value: { templateId, includeCreatedEventBlob: false },
                  },
                },
              }],
            },
          },
        },
        verbose: true,
        activeAtOffset: offset,
      }),
    });
    const data: AcsEntry[] = await res.json();
    if (!Array.isArray(data)) {
      console.error('ACS query error:', data);
      return [];
    }
    return data.map((entry) => {
      const evt = entry.contractEntry.JsActiveContract.createdEvent;
      return {
        contractId: evt.contractId,
        templateId: evt.templateId,
        payload: evt.createArgument as Record<string, unknown>,
      };
    });
  }

  async getPartyId(userId: string): Promise<string> {
    const res = await fetch(`${this.config.baseUrl}/v2/users/${userId}`);
    const data = await res.json();
    return data.user?.primaryParty || '';
  }
}
