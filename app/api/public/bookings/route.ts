import { NextRequest, NextResponse } from 'next/server';
import { createBooking, getBookingsWithDetailsByEmailAndOrganization } from '@/lib/services/booking.service';
import { z } from 'zod';
import { ORGANIZATION_TYPES } from '@/lib/models/organization';

/**
 * Validation schema for booking submission
 */
const bookingSubmissionSchema = z.object({
  organizationId: z.number().min(1),
  menuId: z.number().min(1),
  email: z.email(),
  mealParticipants: z.array(
    z.object({
      lastName: z.string().min(1),
      firstName: z.string().min(1),
      class: z.string().min(1),
      feedingRegime: z.string().optional().nullable(),
      type: z.enum(ORGANIZATION_TYPES),
    })
  ).min(1),
  menuSelections: z.record(z.string(), z.array(z.number())),
  saveChildrenInfo: z.boolean(),
  sendPayLaterEmail: z.boolean().optional().default(true),
});

/**
 * POST /api/public/bookings
 * Create a new booking (public flow).
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

    return NextResponse.json(
      {
        data: {
          id: booking.id,
          created: booking.created,
          email: booking.email,
          organizationId: booking.organizationId,
          menuId: booking.menuId,
          status: booking.status,
        },
      },
      { status: 201 }
    );
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
 * GET /api/public/bookings
 * Returns BookingWithDetails[] for the given email and organization (public history flow).
 * Query params (both required):
 *   - email: valid email
 *   - organizationId: positive integer
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    const emailSchema = z.email();
    const emailValidation = emailSchema.safeParse(email);
    if (!emailValidation.success) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Invalid or missing email',
        },
        { status: 400 }
      );
    }

    const organizationIdParam = searchParams.get('organizationId');
    const organizationIdSchema = z.coerce.number().min(1);
    const organizationIdValidation = organizationIdSchema.safeParse(organizationIdParam);
    if (!organizationIdValidation.success) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Invalid or missing organizationId',
        },
        { status: 400 }
      );
    }

    const bookings = await getBookingsWithDetailsByEmailAndOrganization(
      emailValidation.data,
      organizationIdValidation.data
    );

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
