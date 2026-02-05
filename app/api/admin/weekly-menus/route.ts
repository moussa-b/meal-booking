import { NextResponse } from 'next/server';
import { getAllWeeklyMenus } from '@/lib/services/weekly-menu.service';

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
