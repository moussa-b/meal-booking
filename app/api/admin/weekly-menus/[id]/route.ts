import { NextRequest, NextResponse } from 'next/server';
import {
  getWeeklyMenuById,
  updateWeeklyMenu,
  deleteWeeklyMenu,
} from '@/lib/services/weekly-menu.service';
import { updateWeeklyMenuSchema } from '@/lib/validations/weekly-menu.validation';

/**
 * GET /api/admin/weekly-menus/[id]
 * Get a weekly menu by ID (admin).
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
          message: 'Invalid weekly menu ID',
        },
        { status: 400 }
      );
    }

    const menu = await getWeeklyMenuById(id);

    if (!menu) {
      return NextResponse.json(
        {
          error: 'Not Found',
          message: 'Weekly menu not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: menu,
    });
  } catch (error) {
    console.error('Error fetching weekly menu:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to fetch weekly menu',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/weekly-menus/[id]
 * Update a weekly menu (admin).
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
          message: 'Invalid weekly menu ID',
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Convert weekStartDate string to Date if needed
    if (body.weekStartDate && typeof body.weekStartDate === 'string') {
      body.weekStartDate = new Date(body.weekStartDate);
    }

    // Validate input
    const validationResult = updateWeeklyMenuSchema.safeParse(body);
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
      days: validationResult.data.days
        ? validationResult.data.days.map((day) => ({
            ...day,
            price: typeof day.price === 'string' ? parseFloat(day.price) : day.price,
          }))
        : undefined,
    };

    const menu = await updateWeeklyMenu(id, menuData);

    return NextResponse.json({
      data: menu,
      message: 'Weekly menu updated successfully',
    });
  } catch (error) {
    console.error('Error updating weekly menu:', error);

    if (error instanceof Error && error.message === 'Weekly menu not found') {
      return NextResponse.json(
        {
          error: 'Not Found',
          message: 'Weekly menu not found',
        },
        { status: 404 }
      );
    }

    if (error instanceof Error && error.message.includes('Un menu existe déjà pour cet établissement et cette date')) {
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
        message: 'Failed to update weekly menu',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/weekly-menus/[id]
 * Delete a weekly menu (admin).
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
          message: 'Invalid weekly menu ID',
        },
        { status: 400 }
      );
    }

    await deleteWeeklyMenu(id);

    return NextResponse.json(
      {
        message: 'Weekly menu deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting weekly menu:', error);

    if (error instanceof Error && error.message === 'Weekly menu not found') {
      return NextResponse.json(
        {
          error: 'Not Found',
          message: 'Weekly menu not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to delete weekly menu',
      },
      { status: 500 }
    );
  }
}
