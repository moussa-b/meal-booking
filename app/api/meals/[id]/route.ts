import { NextRequest, NextResponse } from 'next/server';
import {
  getMealById,
  updateMeal,
  deleteMeal,
} from '@/lib/services/meal.service';
import {
  updateMealSchema,
} from '@/lib/validations/meal.validation';

/**
 * GET /api/meals/[id]
 * Get a meal by ID
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
          message: 'Invalid meal ID',
        },
        { status: 400 }
      );
    }
    
    const meal = await getMealById(id);
    
    if (!meal) {
      return NextResponse.json(
        {
          error: 'Not Found',
          message: 'Meal not found',
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      data: meal,
    });
  } catch (error) {
    console.error('Error fetching meal:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to fetch meal',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/meals/[id]
 * Update a meal
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
          message: 'Invalid meal ID',
        },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Validate input
    const validationResult = updateMealSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: validationResult.error.issues.map((e) => e.message).join(', '),
        },
        { status: 400 }
      );
    }
    
    const meal = await updateMeal(id, validationResult.data);
    
    return NextResponse.json({
      data: meal,
      message: 'Meal updated successfully',
    });
  } catch (error) {
    console.error('Error updating meal:', error);
    
    if (error instanceof Error && error.message === 'Meal not found') {
      return NextResponse.json(
        {
          error: 'Not Found',
          message: 'Meal not found',
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to update meal',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/meals/[id]
 * Delete a meal
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
          message: 'Invalid meal ID',
        },
        { status: 400 }
      );
    }
    
    await deleteMeal(id);
    
    return NextResponse.json(
      {
        message: 'Meal deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting meal:', error);
    
    if (error instanceof Error && error.message === 'Meal not found') {
      return NextResponse.json(
        {
          error: 'Not Found',
          message: 'Meal not found',
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to delete meal',
      },
      { status: 500 }
    );
  }
}
