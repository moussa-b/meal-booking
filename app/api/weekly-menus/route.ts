import { NextRequest, NextResponse } from 'next/server';
import {
  createWeeklyMenu,
  getAllWeeklyMenus,
  getWeeklyMenuWithMealsForDate,
} from '@/lib/services/weekly-menu.service';
import { createWeeklyMenuSchema, } from '@/lib/validations/weekly-menu.validation';
import { getNextMonday } from '@/lib/utils/date.utils';

/**
 * GET /api/weekly-menus
 * Get all weekly menus
 * Query params:
 *   - current: if true, returns the current week's menu with full meal details
 *   - schoolId: required when current=true, the school ID to get the menu for
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const current = searchParams.get('current');

    if (current === 'true') {
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
    }

    const menus = await getAllWeeklyMenus();
    return NextResponse.json({
      data: menus,
      count: menus.length,
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

/**
 * POST /api/weekly-menus
 * Create a new weekly menu
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Convert weekStartDate string to Date if needed
    if (body.weekStartDate && typeof body.weekStartDate === 'string') {
      body.weekStartDate = new Date(body.weekStartDate);
    }

    // Validate input
    const validationResult = createWeeklyMenuSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: validationResult.error.issues.map((e) => e.message).join(', '),
        },
        { status: 400 }
      );
    }

    const menuData = {
      ...validationResult.data,
      days: validationResult.data.days.map(day => ({
        ...day,
        price: typeof day.price === 'string' ? parseFloat(day.price) : day.price,
      })),
    };

    const menu = await createWeeklyMenu(menuData);

    return NextResponse.json(
      {
        data: menu,
        message: 'Weekly menu created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating weekly menu:', error);

    if (error instanceof Error && error.message.includes('Un menu existe déjà pour cette école et cette date')) {
      return NextResponse.json(
        {
          error: 'Conflict',
          message: error.message,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to create weekly menu',
      },
      { status: 500 }
    );
  }
}
