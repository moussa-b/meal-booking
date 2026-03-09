import { NextResponse } from 'next/server';
import { getAllOrganizations } from '@/lib/services/organization.service';

/**
 * GET /api/public/organizations
 * Get all organizations for the public booking and history flows.
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
      { status: 500 }
    );
  }
}
