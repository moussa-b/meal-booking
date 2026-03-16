import { Resend } from 'resend';
import React from 'react';
import type { Booking } from '@/lib/models/booking';
import type { WeeklyMenu, WeeklyMenuDay } from '@/lib/models/weekly-menu';
import { DAY_LABELS } from '@/lib/utils/date.utils';
import { PayLaterEmail } from '@/lib/emails/pay-later-email';
import { BookingConfirmationPaidEmail, type MealParticipantSummary, } from '@/lib/emails/booking-confirmation-paid-email';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const fromEmail = process.env.EMAIL_FROM ?? 'onboarding@resend.dev';

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY is not set; skipping email send.');
    return null;
  }
  return new Resend(apiKey);
}

/**
 * Build the history page URL with email and organization code query params
 */
export function buildHistoryUrl(email: string, organizationCode: string): string {
  const params = new URLSearchParams({
    email: email,
    code: organizationCode,
  });
  return `${baseUrl}/history?${params.toString()}`;
}

/**
 * Send "pay later" email after booking creation
 */
export async function sendBookingPayLater(
  booking: Booking,
  organizationCode: string,
  organizationName: string
): Promise<void> {
  const resend = getResendClient();
  if (!resend) return;

  const historyUrl = buildHistoryUrl(booking.email, organizationCode);

  try {
    await resend.emails.send({
      from: fromEmail,
      to: booking.email,
      subject: 'Réservation enregistrée – Paiement depuis l\'historique',
      react: React.createElement(PayLaterEmail, {
        historyUrl,
        organizationName,
      }),
    });
  } catch (error) {
    console.error('Failed to send pay-later email:', error);
    throw error;
  }
}

/**
 * Build student summaries and total from booking + menu for confirmation email
 */
function buildBookingSummary(
  booking: Booking,
  menu: WeeklyMenu
): { mealParticipantSummaries: MealParticipantSummary[]; totalAmount: number } {
  const daysById = new Map<number, WeeklyMenuDay>(
    (menu.days ?? []).map((d) => [d.id, d])
  );
  const mealParticipantSummaries: MealParticipantSummary[] = [];
  let totalAmount = 0;

  for (const mealParticipant of booking.mealParticipants ?? []) {
    const dayNames: string[] = [];
    let amount = 0;
    for (const sel of mealParticipant.menuSelections ?? []) {
      const day = daysById.get(sel.weeklyMenuDayId);
      if (day) {
        dayNames.push(DAY_LABELS[day.dayOfWeek] ?? `Jour ${day.dayOfWeek}`);
        amount += day.price;
      }
    }
    dayNames.sort();
    totalAmount += amount;
    mealParticipantSummaries.push({
      firstName: mealParticipant.firstName,
      lastName: mealParticipant.lastName,
      dayNames,
      amount,
    });
  }

  return {mealParticipantSummaries, totalAmount};
}

/**
 * Send payment confirmation email with booking summary after PayPal capture
 */
export async function sendBookingConfirmationPaid(
  booking: Booking,
  organizationCode: string,
  organizationName: string,
  menu: WeeklyMenu
): Promise<void> {
  const resend = getResendClient();
  if (!resend) return;

  const historyUrl = buildHistoryUrl(booking.email, organizationCode);
  const {mealParticipantSummaries, totalAmount} = buildBookingSummary(booking, menu);
  const weekLabel = menu.weekStartDate
    ? (() => {
      const formatted = format(new Date(menu.weekStartDate), 'EEEE d MMMM', {locale: fr});
      return `Semaine : ${formatted.replace(/\b\w/g, (c) => c.toUpperCase())}`;
    })()
    : undefined;

  try {
    await resend.emails.send({
      from: fromEmail,
      to: booking.email,
      subject: 'Paiement confirmé – Réservation repas',
      react: React.createElement(BookingConfirmationPaidEmail, {
        historyUrl,
        organizationName,
        totalAmount,
        mealParticipantSummaries,
        weekLabel,
      }),
    });
  } catch (error) {
    console.error('Failed to send booking confirmation email:', error);
    throw error;
  }
}
