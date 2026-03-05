import { NextRequest, NextResponse } from 'next/server';
import { getWeeklyMenuWithMealsForDate, } from '@/lib/services/weekly-menu.service';
import { getNextMonday } from '@/lib/utils/date.utils';

/**
 * GET /api/public/weekly-menus
 * Returns the current week's menu for a school (public booking flow).
 * Query params:
 *   - current: must be "true"
 *   - schoolId: required, the school ID to get the menu for
 * For listing all menus (admin), use GET /api/admin/weekly-menus.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const current = searchParams.get('current');

    if (current !== 'true') {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'current=true and schoolId are required',
        },
        { status: 400 }
      );
    }

    const schoolIdParam = searchParams.get('schoolId');
    if (!schoolIdParam) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'schoolId is required when current=true',
        },
        { status: 400 }
      );
    }

    const schoolId = parseInt(schoolIdParam, 10);
    if (isNaN(schoolId) || schoolId <= 0) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'schoolId must be a positive number',
        },
        { status: 400 }
      );
    }

    const weekStartDate = getNextMonday(new Date());
    weekStartDate.setHours(0, 0, 0, 0);
    const menu = await getWeeklyMenuWithMealsForDate(weekStartDate, schoolId);
    if (!menu) {
      return NextResponse.json(
        {
          error: 'Not Found',
          message: 'No weekly menu found for the current week',
        },
        { status: 404 }
      );
    }
    return NextResponse.json({
      data: menu,
    });
  } catch (error) {
    console.error('Error fetching weekly menus:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to fetch weekly menus',
      },
      { status: 500 }
    );
  }
}

