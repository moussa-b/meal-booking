import { NextResponse } from 'next/server';
import { getAllBookings } from '@/lib/services/booking.service';

/**
 * GET /api/admin/bookings
 * Returns all bookings for admin use (e.g. orders table).
 */
export async function GET() {
  try {
    const bookings = await getAllBookings();

    return NextResponse.json({
      data: bookings,
      count: bookings.length,
    });
  } catch (error) {
    console.error('Error fetching admin bookings:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to fetch bookings',
      },
      {status: 500}
    );
  }
}
