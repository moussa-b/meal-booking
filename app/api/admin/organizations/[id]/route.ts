import { NextRequest, NextResponse } from 'next/server';
import {
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
} from '@/lib/services/organization.service';
import { updateOrganizationSchema } from '@/lib/validations/organization.validation';

/**
 * GET /api/admin/organizations/[id]
 * Get an organization by ID (admin).
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
          message: 'Invalid organization ID',
        },
        { status: 400 }
      );
    }

    const organization = await getOrganizationById(id);

    if (!organization) {
      return NextResponse.json(
        {
          error: 'Not Found',
          message: 'Organization not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: organization,
    });
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to fetch organization',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/organizations/[id]
 * Update an organization (admin).
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
          message: 'Invalid organization ID',
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate input
    const validationResult = updateOrganizationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: validationResult.error.issues.map((e) => e.message).join(', '),
        },
        { status: 400 }
      );
    }

    const organization = await updateOrganization(id, validationResult.data);

    return NextResponse.json({
      data: organization,
      message: 'Organization updated successfully',
    });
  } catch (error) {
    console.error('Error updating organization:', error);

    if (error instanceof Error && error.message === 'Organization not found') {
      return NextResponse.json(
        {
          error: 'Not Found',
          message: 'Organization not found',
        },
        { status: 404 }
      );
    }

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
        message: 'Failed to update organization',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/organizations/[id]
 * Delete an organization (admin).
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
          message: 'Invalid organization ID',
        },
        { status: 400 }
      );
    }

    await deleteOrganization(id);

    return NextResponse.json(
      {
        message: 'Organization deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting organization:', error);

    if (error instanceof Error && error.message === 'Organization not found') {
      return NextResponse.json(
        {
          error: 'Not Found',
          message: 'Organization not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to delete organization',
      },
      { status: 500 }
    );
  }
}
