import { NextRequest, NextResponse } from 'next/server';
import { createWeeklyMenu, getAllWeeklyMenus } from '@/lib/services/weekly-menu.service';
import { createWeeklyMenuSchema } from '@/lib/validations/weekly-menu.validation';

/**
 * GET /api/admin/weekly-menus
 * Get all weekly menus (admin use: orders table).
 */
export async function GET() {
  try {
    const menus = await getAllWeeklyMenus();
    return NextResponse.json({
      data: menus,
      count: menus.length,
    });
  } catch (error) {
    console.error('Error fetching admin weekly menus:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to fetch weekly menus',
      },
      {status: 500}
    );
  }
}

/**
 * POST /api/admin/weekly-menus
 * Create a new weekly menu (admin).
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
      days: validationResult.data.days.map((day) => ({
        ...day,
        price:
          typeof day.price === 'string' ? parseFloat(day.price) : day.price,
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
