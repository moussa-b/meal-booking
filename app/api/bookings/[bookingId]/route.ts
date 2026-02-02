import { NextRequest, NextResponse } from 'next/server';
import { getBookingById } from '@/lib/services/booking.service';

/**
 * GET /api/bookings/[bookingId]
 * Get a booking by ID.
 */
export async function GET(_request: NextRequest, {params}: { params: Promise<{ bookingId: string }> }) {
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

    // Serialize full booking with dates as ISO strings for JSON
    const data = {
      ...booking,
      created: booking.created.toISOString(),
      paymentEmailSentAt: booking.paymentEmailSentAt?.toISOString() ?? null,
      confirmationEmailSentAt: booking.confirmationEmailSentAt?.toISOString() ?? null,
    };

    return NextResponse.json({data});
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json(
      {error: 'Internal Server Error', message: 'Failed to fetch booking'},
      {status: 500}
    );
  }
}
