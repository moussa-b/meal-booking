import { NextRequest, NextResponse } from 'next/server';
import { getMealParticipantsByEmail } from '@/lib/services/meal-participant.service';
import { z } from 'zod';

const emailSchema = z.email();

/**
 * GET /api/public/meal-participants?email=...
 * Get meal participants by email (for prefilling the booking form).
 */
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');
    if (!email) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'email query parameter is required',
        },
        { status: 400 }
      );
    }

    const emailValidation = emailSchema.safeParse(email);
    if (!emailValidation.success) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid email format',
        },
        { status: 400 }
      );
    }

    const mealParticipants = await getMealParticipantsByEmail(emailValidation.data);
    return NextResponse.json({
      data: mealParticipants,
      count: mealParticipants.length,
    });
  } catch (error) {
    console.error('Error fetching meal participants by email:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to fetch meal participants',
      },
      { status: 500 }
    );
  }
}
