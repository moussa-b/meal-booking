import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

export interface PayLaterEmailProps {
  historyUrl: string;
  schoolName: string;
}

export function PayLaterEmail({historyUrl, schoolName}: PayLaterEmailProps) {
  const previewText = `Réservation enregistrée – Paiement depuis la page historique`;
  return (
    <Html lang="fr">
      <Head/>
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Réservation enregistrée</Heading>
          <Text style={text}>
            Votre réservation pour <strong>{schoolName}</strong> a bien été enregistrée.
          </Text>
          <Text style={text}>
            Vous pouvez effectuer le paiement plus tard depuis la page historique en cliquant sur le lien ci-dessous.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button}
                    href={historyUrl}>
              Voir l&apos;historique et payer
            </Button>
          </Section>
          <Hr style={hr}/>
          <Text style={footer}>
            Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :{' '}
            <Link href={historyUrl}
                  style={link}>
              {historyUrl}
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default PayLaterEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  marginBottom: '64px',
  borderRadius: '8px',
  maxWidth: '480px',
};

const h1 = {
  color: '#1a1a2e',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.3',
  margin: '0 0 24px',
  textAlign: 'center' as const,
};

const text = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  padding: '12px 24px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '24px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '1.5',
};

const link = {
  color: '#2563eb',
  wordBreak: 'break-all' as const,
};
