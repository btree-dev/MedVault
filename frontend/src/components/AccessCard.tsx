import React from 'react';
import { Card, Button, Label } from 'semantic-ui-react';

interface Props {
  title: string;
  party: string;
  description?: string;
  expiresAt?: string | null;
  onRevoke?: () => void;
  revoking?: boolean;
}

const AccessCard: React.FC<Props> = ({ title, party, description, expiresAt, onRevoke, revoking }) => {
  return (
    <Card>
      <Card.Content>
        <Card.Header>{title}</Card.Header>
        <Card.Meta>{party}</Card.Meta>
        {description && <Card.Description>{description}</Card.Description>}
        {expiresAt && (
          <Label size="small" color="blue">
            Expires: {expiresAt}
          </Label>
        )}
        {expiresAt === null && (
          <Label size="small" color="green">
            Indefinite
          </Label>
        )}
      </Card.Content>
      {onRevoke && (
        <Card.Content extra>
          <Button negative size="small" onClick={onRevoke} loading={revoking}>
            Revoke Access
          </Button>
        </Card.Content>
      )}
    </Card>
  );
};

export default AccessCard;
