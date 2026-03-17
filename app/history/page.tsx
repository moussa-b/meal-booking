import { z } from 'zod';
import { HistoryWizard } from '../components/history-wizard';
import { getOrganizationByCode } from '@/lib/services/organization.service';
import { getBookingsWithDetailsByEmailAndOrganization } from '@/lib/services/booking.service';
import type { BookingWithDetails } from '@/lib/models/booking-with-details';

type SearchParams = {
  searchParams?: Promise<Record<string, string | string[]>>;
};

export default async function HistoryPage({ searchParams }: SearchParams) {
  const params = await searchParams;
  const code = typeof params?.code === 'string' ? params.code : undefined;
  const email = typeof params?.email === 'string' ? params.email : undefined;

  let initialBookings: BookingWithDetails[] | null = null;
  let initialOrganizationId: number | undefined;

  if (code) {
    const organization = await getOrganizationByCode(code);
    if (organization) {
      initialOrganizationId = organization.id;
      if (email) {
        const emailSchema = z.email();
        const emailValidation = emailSchema.safeParse(email);
        if (emailValidation.success) {
          initialBookings = await getBookingsWithDetailsByEmailAndOrganization(email, organization.id);
        }
      }
    }
  }

  return (
    <main>
      <HistoryWizard email={email} initialBookings={initialBookings} initialOrganizationId={initialOrganizationId} />
    </main>
  );
}
