import { NextRequest, NextResponse } from 'next/server';
import { getAllMeals, createMeal } from '@/lib/services/meal.service';
import { createMealSchema } from '@/lib/validations/meal.validation';

/**
 * GET /api/admin/meals
 * Get all meals (admin).
 */
export async function GET() {
  try {
    const meals = await getAllMeals();
    return NextResponse.json({
      data: meals,
      count: meals.length,
    });
  } catch (error) {
    console.error('Error fetching meals:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to fetch meals',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/meals
 * Create a new meal (admin).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = createMealSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: validationResult.error.issues.map((e) => e.message).join(', '),
        },
        { status: 400 }
      );
    }

    const meal = await createMeal(validationResult.data);

    return NextResponse.json(
      {
        data: meal,
        message: 'Meal created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating meal:', error);

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to create meal',
      },
      { status: 500 }
    );
  }
}
