import { NextRequest, NextResponse } from 'next/server';
import {
  getSchoolById,
  updateSchool,
  deleteSchool,
} from '@/lib/services/school.service';
import {
  updateSchoolSchema,
} from '@/lib/validations/school.validation';

/**
 * GET /api/schools/[id]
 * Get a school by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid school ID',
        },
        { status: 400 }
      );
    }

    const school = await getSchoolById(id);

    if (!school) {
      return NextResponse.json(
        {
          error: 'Not Found',
          message: 'School not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: school,
    });
  } catch (error) {
    console.error('Error fetching school:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to fetch school',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/schools/[id]
 * Update a school
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid school ID',
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate input
    const validationResult = updateSchoolSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: validationResult.error.issues.map((e) => e.message).join(', '),
        },
        { status: 400 }
      );
    }

    const school = await updateSchool(id, validationResult.data);

    return NextResponse.json({
      data: school,
      message: 'School updated successfully',
    });
  } catch (error) {
    console.error('Error updating school:', error);

    if (error instanceof Error && error.message === 'School not found') {
      return NextResponse.json(
        {
          error: 'Not Found',
          message: 'School not found',
        },
        { status: 404 }
      );
    }

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
        message: 'Failed to update school',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/schools/[id]
 * Delete a school
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid school ID',
        },
        { status: 400 }
      );
    }

    await deleteSchool(id);

    return NextResponse.json(
      {
        message: 'School deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting school:', error);

    if (error instanceof Error && error.message === 'School not found') {
      return NextResponse.json(
        {
          error: 'Not Found',
          message: 'School not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to delete school',
      },
      { status: 500 }
    );
  }
}
