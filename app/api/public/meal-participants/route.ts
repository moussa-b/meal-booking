import { NextRequest, NextResponse } from 'next/server';
import { getMealParticipantsByParentEmail } from '@/lib/services/meal-participant.service';
import { z } from 'zod';

const emailSchema = z.email();

/**
 * GET /api/public/meal-participants?parentEmail=...
 * Get meal participants by parent email (for prefilling the booking form).
 */
export async function GET(request: NextRequest) {
  try {
    const parentEmail = request.nextUrl.searchParams.get('parentEmail');
    if (!parentEmail) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'parentEmail query parameter is required',
        },
        { status: 400 }
      );
    }

    const emailValidation = emailSchema.safeParse(parentEmail);
    if (!emailValidation.success) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid email format',
        },
        { status: 400 }
      );
    }

    const mealParticipants = await getMealParticipantsByParentEmail(emailValidation.data);
    return NextResponse.json({
      data: mealParticipants,
      count: mealParticipants.length,
    });
  } catch (error) {
    console.error('Error fetching meal participants by parent email:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to fetch meal participants',
      },
      { status: 500 }
    );
  }
}
