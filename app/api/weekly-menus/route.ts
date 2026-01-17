import { NextRequest, NextResponse } from 'next/server';
import {
  getAllWeeklyMenus,
  createWeeklyMenu,
} from '@/lib/services/weekly-menu.service';
import {
  createWeeklyMenuSchema,
} from '@/lib/validations/weekly-menu.validation';

/**
 * GET /api/weekly-menus
 * Get all weekly menus
 */
export async function GET() {
  try {
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

    const menu = await createWeeklyMenu(validationResult.data);

    return NextResponse.json(
      {
        data: menu,
        message: 'Weekly menu created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating weekly menu:', error);

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to create weekly menu',
      },
      { status: 500 }
    );
  }
}
