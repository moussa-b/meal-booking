import { NextRequest, NextResponse } from 'next/server';
import { getStudentsByParentEmail } from '@/lib/services/student.service';
import { z } from 'zod';

const emailSchema = z.email();

/**
 * GET /api/public/students?parentEmail=...
 * Get students by parent email (for prefilling the booking form).
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

    const students = await getStudentsByParentEmail(emailValidation.data);
    return NextResponse.json({
      data: students,
      count: students.length,
    });
  } catch (error) {
    console.error('Error fetching students by parent email:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to fetch students',
      },
      { status: 500 }
    );
  }
}
