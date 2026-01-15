import { NextRequest, NextResponse } from 'next/server';
import {
  getAllSchools,
  createSchool,
} from '@/lib/services/school.service';
import {
  createSchoolSchema,
} from '@/lib/validations/school.validation';

/**
 * GET /api/schools
 * Get all schools
 */
export async function GET() {
  try {
    const schools = await getAllSchools();
    return NextResponse.json({
      data: schools,
      count: schools.length,
    });
  } catch (error) {
    console.error('Error fetching schools:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to fetch schools',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/schools
 * Create a new school
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = createSchoolSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: validationResult.error.issues.map((e) => e.message).join(', '),
        },
        { status: 400 }
      );
    }

    const school = await createSchool(validationResult.data);

    return NextResponse.json(
      {
        data: school,
        message: 'School created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating school:', error);

    // Handle duplicate code error
    if (error instanceof Error && error.message.includes('Duplicate entry')) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Un school avec ce code existe déjà',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to create school',
      },
      { status: 500 }
    );
  }
}
