import { NextResponse } from 'next/server';
import { getAllSchools } from '@/lib/services/school.service';

/**
 * GET /api/public/schools
 * Get all schools for the public booking and history flows.
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
