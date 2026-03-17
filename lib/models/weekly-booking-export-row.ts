import { DayOfWeek } from '@/lib/utils/date.utils';

/**
 * Row model for weekly bookings Excel export.
 *
 * Maps directly to columns A–S in the Excel template:
 * A: bookingCreatedAt
 * B: email
 * C: organizationName
 * D: participantLastName
 * E: participantFirstName
 * F: participantClass
 * G: selectedDaysLabel (e.g. "Lundi, Mardi, Jeudi")
 * H–N: per-day flags (OUI / '')
 * O: feedingRegime
 * P: phone
 * Q: paidFlag (OUI / '')
 * R: comment
 * S: paymentEmailSentAt
 */
export interface WeeklyBookingExportRow {
  // Column A
  bookingCreatedAt: Date;

  // Column B
  email: string;

  // Column C
  organizationName: string;

  // Column D
  participantLastName: string;

  // Column E
  participantFirstName: string;

  // Column F
  participantClass?: string | null;

  // Column G: e.g. "Lundi, Mardi, Jeudi"
  selectedDaysLabel: string;

  // Columns H–N: Monday–Sunday flags ("OUI" or "")
  mondayFlag: string;
  tuesdayFlag: string;
  wednesdayFlag: string;
  thursdayFlag: string;
  fridayFlag: string;
  saturdayFlag: string;
  sundayFlag: string;

  // Column O
  feedingRegime?: string | null;

  // Column P
  phone?: string | null;

  // Column Q: "OUI" when status is PAID, else ""
  paidFlag: string;

  // Column R
  comment?: string | null;

  // Column S
  paymentEmailSentAt?: Date | null;
}

/**
 * Utility to map a DayOfWeek enum to the corresponding flag key on WeeklyBookingExportRow.
 */
export function getDayFlagKey(dayOfWeek: DayOfWeek): keyof WeeklyBookingExportRow {
  switch (dayOfWeek) {
    case DayOfWeek.MONDAY:
      return 'mondayFlag';
    case DayOfWeek.TUESDAY:
      return 'tuesdayFlag';
    case DayOfWeek.WEDNESDAY:
      return 'wednesdayFlag';
    case DayOfWeek.THURSDAY:
      return 'thursdayFlag';
    case DayOfWeek.FRIDAY:
      return 'fridayFlag';
    case DayOfWeek.SATURDAY:
      return 'saturdayFlag';
    case DayOfWeek.SUNDAY:
      return 'sundayFlag';
    default:
      return 'mondayFlag';
  }
}

