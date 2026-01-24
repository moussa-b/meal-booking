import { NextRequest, NextResponse } from 'next/server';
import { getSchoolByCode } from '@/lib/services/school.service';

/**
 * GET /api/schools/code/[code]
 * Get a school by code
 */
export async function GET(
  request: NextRequest,
  {params}: { params: Promise<{ code: string }> }
) {
  try {
    const {code} = await params;

    if (!code) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'School code is required',
        },
        {status: 400}
      );
    }

    const school = await getSchoolByCode(code);

    if (!school) {
      return NextResponse.json(
        {
          error: 'Not Found',
          message: 'School not found',
        },
        {status: 404}
      );
    }

    return NextResponse.json({
      data: school,
    });
  } catch (error) {
    console.error('Error fetching school by code:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to fetch school',
      },
      {status: 500}
    );
  }
}
