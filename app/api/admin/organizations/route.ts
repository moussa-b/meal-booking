import { NextRequest, NextResponse } from 'next/server';
import { getAllOrganizations, createOrganization } from '@/lib/services/organization.service';
import { createOrganizationSchema } from '@/lib/validations/organization.validation';

/**
 * GET /api/admin/organizations
 * Get all organizations (admin use: orders table, menu dialogs).
 */
export async function GET() {
  try {
    const organizations = await getAllOrganizations();
    return NextResponse.json({
      data: organizations,
      count: organizations.length,
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to fetch organizations',
      },
      {status: 500}
    );
  }
}

/**
 * POST /api/admin/organizations
 * Create a new organization (admin).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = createOrganizationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: validationResult.error.issues.map((e) => e.message).join(', '),
        },
        { status: 400 }
      );
    }

    const organization = await createOrganization(validationResult.data);

    return NextResponse.json(
      {
        data: organization,
        message: 'Organization created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating organization:', error);

    // Handle duplicate code error
    if (error instanceof Error && error.message.includes('Duplicate entry')) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Une organisation avec ce code existe déjà',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to create organization',
      },
      { status: 500 }
    );
  }
}
