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

export interface StudentSummary {
  firstName: string;
  lastName: string;
  dayNames: string[];
  amount: number;
}

export interface BookingConfirmationPaidEmailProps {
  historyUrl: string;
  organizationName: string;
  totalAmount: number;
  studentSummaries: StudentSummary[];
  weekLabel?: string;
}

export function BookingConfirmationPaidEmail({
                                               historyUrl,
                                               organizationName,
                                               totalAmount,
                                               studentSummaries,
                                               weekLabel,
                                             }: BookingConfirmationPaidEmailProps) {
  const previewText = `Paiement confirmé – Réservation ${organizationName}`;
  const totalFormatted = totalAmount.toFixed(2).replace('.', ',');
  return (
    <Html lang="fr">
      <Head/>
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Paiement confirmé</Heading>
          <Text style={text}>
            Votre paiement pour la réservation à <strong>{organizationName}</strong> a bien été enregistré.
          </Text>
          {weekLabel && (
            <Text style={text}>
              <strong>Semaine :</strong> {weekLabel}
            </Text>
          )}
          <Section style={summaryBox}>
            <Text style={summaryTitle}>Récapitulatif</Text>
            {studentSummaries.map((s, i) => (
              <Text key={i}
                    style={summaryRow}>
                {s.firstName} {s.lastName} : {s.dayNames.join(', ')} – {s.amount.toFixed(2).replace('.', ',')} €
              </Text>
            ))}
            <Text style={totalRow}>
              <strong>Total : {totalFormatted} €</strong>
            </Text>
          </Section>
          <Text style={text}>
            Vous pouvez consulter l&apos;historique de vos réservations via le lien ci-dessous.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button}
                    href={historyUrl}>
              Voir l&apos;historique
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

export default BookingConfirmationPaidEmail;

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

const summaryBox = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '16px',
  margin: '16px 0',
};

const summaryTitle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#1a1a2e',
  margin: '0 0 12px',
};

const summaryRow = {
  fontSize: '14px',
  color: '#525f7f',
  margin: '4px 0',
};

const totalRow = {
  fontSize: '14px',
  color: '#1a1a2e',
  margin: '12px 0 0',
  paddingTop: '8px',
  borderTop: '1px solid #e2e8f0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#16a34a',
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
