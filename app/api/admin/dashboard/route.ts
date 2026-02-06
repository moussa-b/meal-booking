import { NextResponse } from 'next/server';
import { getMonday, getNextMonday } from '@/lib/utils/date.utils';
import { getSchoolById } from '@/lib/services/school.service';
import { getWeeklyMenuByWeekStart, getWeeklyMenuWithMeals } from '@/lib/services/weekly-menu.service';
import {
  getPaidMealsByWeekdayForMenu,
  getBookingCountsByStatusForMenu,
  getTotalPaidAmountForMenu,
} from '@/lib/services/booking.service';
import type { WeeklyMenu } from '@/lib/models/weekly-menu';

interface DashboardWeekMenu {
  menu: WeeklyMenu;
  schoolId: number;
  schoolName: string;
  paidMealsByDay: Record<number, number>;
  bookingCountByStatus: Record<string, number>;
  totalPaidAmount: number;
}

interface DashboardWeek {
  weekStartDate: string;
  menus: DashboardWeekMenu[];
  noData: boolean;
}

/**
 * GET /api/admin/dashboard?date=YYYY-MM-DD&schoolId=1
 * Returns dashboard data for two weeks (selected week and next week) for the given school.
 * schoolId is required. date defaults to today.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const schoolIdParam = searchParams.get('schoolId');

    if (!schoolIdParam || schoolIdParam.trim() === '') {
      return NextResponse.json(
        { error: 'Bad Request', message: 'schoolId is required' },
        { status: 400 }
      );
    }

    const schoolId = parseInt(schoolIdParam, 10);
    if (Number.isNaN(schoolId) || schoolId < 1) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'schoolId must be a positive integer' },
        { status: 400 }
      );
    }

    const school = await getSchoolById(schoolId);
    if (!school) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'School not found' },
        { status: 400 }
      );
    }

    const date = dateParam ? new Date(dateParam) : new Date();
    const weekStart1 = getMonday(date);
    const weekStart2 = getNextMonday(weekStart1);

    const buildWeek = async (
      weekStart: Date
    ): Promise<DashboardWeek> => {
      const menu = await getWeeklyMenuByWeekStart(weekStart, schoolId);
      if (!menu) {
        return {
          weekStartDate: weekStart.toISOString(),
          menus: [],
          noData: true,
        };
      }

      const menuWithMeals = await getWeeklyMenuWithMeals(menu.id);
      if (!menuWithMeals) {
        return {
          weekStartDate: weekStart.toISOString(),
          menus: [],
          noData: true,
        };
      }
      const [paidMealsByDay, bookingCountByStatus, totalPaidAmount] = await Promise.all([
        getPaidMealsByWeekdayForMenu(menu.id),
        getBookingCountsByStatusForMenu(menu.id),
        getTotalPaidAmountForMenu(menu.id),
      ]);

      return {
        weekStartDate: weekStart.toISOString(),
        menus: [
          {
            menu: menuWithMeals,
            schoolId,
            schoolName: school.name,
            paidMealsByDay,
            bookingCountByStatus,
            totalPaidAmount,
          },
        ],
        noData: false,
      };
    };

    const [week1, week2] = await Promise.all([
      buildWeek(weekStart1),
      buildWeek(weekStart2),
    ]);

    return NextResponse.json({ week1, week2 });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to fetch dashboard data',
      },
      { status: 500 }
    );
  }
}
