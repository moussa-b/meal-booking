import { NextRequest, NextResponse } from 'next/server';
import { getOrganizationByCode } from '@/lib/services/organization.service';

/**
 * GET /api/admin/organizations/code/[code]
 * Get an organization by code (admin).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    if (!code) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Organization code is required',
        },
        { status: 400 }
      );
    }

    const organization = await getOrganizationByCode(code);

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
    console.error('Error fetching organization by code:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to fetch organization',
      },
      { status: 500 }
    );
  }
}
