import { z } from 'zod';
import { HistoryWizard } from '../components/history-wizard';
import { getSchoolByCode } from '@/lib/services/school.service';
import { getBookingsWithDetailsByEmailAndSchool } from '@/lib/services/booking.service';
import type { BookingWithDetails } from '@/lib/models/booking';

type SearchParams = {
  searchParams?: Promise<Record<string, string | string[]>>;
};

export default async function HistoryPage({ searchParams }: SearchParams) {
  const params = await searchParams;
  const code = typeof params?.code === 'string' ? params.code : undefined;
  const email = typeof params?.email === 'string' ? params.email : undefined;

  let initialBookings: BookingWithDetails[] | null = null;
  let initialSchoolId: number | undefined;

  if (code) {
    const school = await getSchoolByCode(code);
    if (school) {
      initialSchoolId = school.id;
      if (email) {
        const emailSchema = z.email();
        const emailValidation = emailSchema.safeParse(email);
        if (emailValidation.success) {
          initialBookings = await getBookingsWithDetailsByEmailAndSchool(email, school.id);
        }
      }
    }
  }

  return (
    <main>
      <HistoryWizard email={email} initialBookings={initialBookings} initialSchoolId={initialSchoolId} />
    </main>
  );
}
