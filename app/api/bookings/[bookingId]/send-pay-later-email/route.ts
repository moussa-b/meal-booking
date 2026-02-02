import { NextRequest, NextResponse } from 'next/server';
import { getBookingById, updatePaymentEmailSentAt, } from '@/lib/services/booking.service';
import { getSchoolById } from '@/lib/services/school.service';
import { sendBookingPayLater } from '@/lib/services/email.service';

/**
 * POST /api/bookings/[bookingId]/send-pay-later-email
 * Sends the pay-later email for the booking if it has not been sent yet (paymentEmailSentAt is null).
 */
export async function POST(_request: NextRequest, {params}: { params: Promise<{ bookingId: string }> }) {
  try {
    const {bookingId: idParam} = await params;
    const bookingId = parseInt(idParam, 10);

    if (isNaN(bookingId) || bookingId < 1) {
      return NextResponse.json(
        {error: 'Bad Request', message: 'Invalid bookingId'},
        {status: 400}
      );
    }

    const booking = await getBookingById(bookingId);

    if (!booking) {
      return NextResponse.json(
        {error: 'Not Found', message: 'Booking not found'},
        {status: 404}
      );
    }

    if (booking.paymentEmailSentAt) {
      return NextResponse.json({
        data: {sent: false, message: 'Pay-later email was already sent'},
      });
    }

    const school = await getSchoolById(booking.schoolId);
    if (!school) {
      return NextResponse.json(
        {error: 'Not Found', message: 'School not found'},
        {status: 404}
      );
    }

    await sendBookingPayLater(booking, school.code, school.name);
    await updatePaymentEmailSentAt(bookingId);

    return NextResponse.json({
      data: {sent: true, message: 'Pay-later email sent'},
    });
  } catch (error) {
    console.error('Error sending pay-later email:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to send pay-later email',
      },
      {status: 500}
    );
  }
}
