import { NextRequest, NextResponse } from 'next/server';
import { createBooking, getBookingsByEmail, getAllBookings } from '@/lib/services/booking.service';
import type { BookingSubmission } from '@/lib/models/booking-submission';
import { z } from 'zod';

/**
 * Validation schema for booking submission
 */
const bookingSubmissionSchema = z.object({
  schoolId: z.number().min(1),
  menuId: z.number().min(1),
  email: z.string().email(),
  students: z.array(
    z.object({
      lastName: z.string().min(1),
      firstName: z.string().min(1),
      class: z.string().min(1),
      feedingRegime: z.string().optional().nullable(),
    })
  ).min(1),
  menuSelections: z.record(z.string(), z.array(z.number())),
  saveChildrenInfo: z.boolean(),
  sendPayLaterEmail: z.boolean().optional().default(true),
});

/**
 * POST /api/bookings
 * Create a new booking
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validationResult = bookingSubmissionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Invalid booking data',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { sendPayLaterEmail, ...data } = validationResult.data;

    // Create booking
    const booking = await createBooking(data, data.saveChildrenInfo, sendPayLaterEmail);

    return NextResponse.json({
      data: {
        id: booking.id,
        created: booking.created,
        email: booking.email,
        schoolId: booking.schoolId,
        menuId: booking.menuId,
        status: booking.status,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);

    if (error instanceof Error) {
      // Handle specific error messages
      if (error.message.includes('not found')) {
        return NextResponse.json(
          {
            error: 'Not Found',
            message: error.message,
          },
          { status: 404 }
        );
      }

      if (error.message.includes('does not belong')) {
        return NextResponse.json(
          {
            error: 'Bad Request',
            message: error.message,
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to create booking',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bookings
 * Get bookings by email or all bookings
 * Query params:
 *   - email: optional, if provided, returns bookings for that email only
 *   - if no email param, returns all bookings
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    // If email is provided, get bookings by email
    if (email) {
      // Validate email format
      const emailSchema = z.string().email();
      const emailValidation = emailSchema.safeParse(email);
      if (!emailValidation.success) {
        return NextResponse.json(
          {
            error: 'Bad Request',
            message: 'Invalid email format',
          },
          { status: 400 }
        );
      }

      const bookings = await getBookingsByEmail(email);

      return NextResponse.json({
        data: bookings,
        count: bookings.length,
      });
    }

    // If no email param, get all bookings
    const bookings = await getAllBookings();

    return NextResponse.json({
      data: bookings,
      count: bookings.length,
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to fetch bookings',
      },
      { status: 500 }
    );
  }
}
