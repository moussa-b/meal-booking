'use client';

import { useEffect, useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react';
import type { Booking } from '@/lib/models/booking';
import type { WeeklyMenu } from '@/lib/models/weekly-menu';
import { PaymentStatus } from '@/lib/models/payment-status';
import type { School } from '@/lib/models/school';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, formatDayWithDate } from '@/lib/utils/date.utils';

interface DayStats {
  total: number;
  paid: number;
  pending: number;
  error: number;
}

interface DayBookings {
  dayOfWeek: number;
  menuDayId: number;
  stats: DayStats;
  bookings: Array<{
    booking: Booking;
    studentIds: number[];
  }>;
}

interface MenuGroup {
  menu: WeeklyMenu;
  days: DayBookings[];
}

// Helper function to get badge className for payment status badges
const getStatusBadgeClass = (type: 'paid' | 'pending' | 'error'): string => {
  switch (type) {
    case 'paid':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'error':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return '';
  }
};

export function OrdersTable() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [menus, setMenus] = useState<WeeklyMenu[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Fetch bookings, menus, and schools in parallel
        const [bookingsResponse, menusResponse, schoolsResponse] = await Promise.all([
          fetch('/api/admin/bookings'),
          fetch('/api/admin/weekly-menus'),
          fetch('/api/admin/schools'),
        ]);

        if (!bookingsResponse.ok) {
          throw new Error('Failed to fetch bookings');
        }
        if (!menusResponse.ok) {
          throw new Error('Failed to fetch menus');
        }
        if (!schoolsResponse.ok) {
          throw new Error('Failed to fetch schools');
        }

        const bookingsData = await bookingsResponse.json();
        const menusData = await menusResponse.json();
        const schoolsData = await schoolsResponse.json();

        setBookings(bookingsData.data || []);
        setMenus(menusData.data || []);
        setSchools(schoolsData.data || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Group bookings by menu and calculate day statistics
  const menuGroups: MenuGroup[] = menus
    .map((menu) => {
      // Get all bookings for this menu
      const menuBookings = bookings.filter((b) => b.menuId === menu.id);

      if (menuBookings.length === 0) {
        return null;
      }

      // Create a map of menuDayId -> dayOfWeek from the menu
      const dayMap = new Map<number, number>();
      menu.days?.forEach((day) => {
        dayMap.set(day.id, day.dayOfWeek);
      });

      // Group bookings by day
      const dayBookingsMap = new Map<number, DayBookings>();

      menuBookings.forEach((booking) => {
        booking.students?.forEach((student) => {
          student.menuSelections?.forEach((selection) => {
            const dayOfWeek = dayMap.get(selection.weeklyMenuDayId);
            if (dayOfWeek === undefined) return;

            const menuDayId = selection.weeklyMenuDayId;
            if (!dayBookingsMap.has(menuDayId)) {
              dayBookingsMap.set(menuDayId, {
                dayOfWeek,
                menuDayId,
                stats: {total: 0, paid: 0, pending: 0, error: 0},
                bookings: [],
              });
            }

            const dayData = dayBookingsMap.get(menuDayId)!;
            dayData.stats.total++;

            // Count by payment status
            if (booking.status === PaymentStatus.PAID) {
              dayData.stats.paid++;
            } else if (
              booking.status === PaymentStatus.PENDING ||
              booking.status === PaymentStatus.PROCESSING
            ) {
              dayData.stats.pending++;
            } else if (
              booking.status === PaymentStatus.FAILED ||
              booking.status === PaymentStatus.CANCELED ||
              booking.status === PaymentStatus.EXPIRED ||
              booking.status === PaymentStatus.REFUNDED
            ) {
              dayData.stats.error++;
            }

            // Add booking to day if not already present
            const existingBooking = dayData.bookings.find(
              (b) => b.booking.id === booking.id
            );
            if (!existingBooking) {
              dayData.bookings.push({
                booking,
                studentIds: [],
              });
            }

            // Track which students have selections for this day
            const bookingData = dayData.bookings.find(
              (b) => b.booking.id === booking.id
            )!;
            if (!bookingData.studentIds.includes(student.id)) {
              bookingData.studentIds.push(student.id);
            }
          });
        });
      });

      const days = Array.from(dayBookingsMap.values()).sort(
        (a, b) => a.dayOfWeek - b.dayOfWeek
      );

      return {
        menu,
        days,
      };
    })
    .filter((group): group is MenuGroup => group !== null)
    .sort((a, b) => {
      // Sort by weekStartDate descending (most recent first)
      return (
        new Date(b.menu.weekStartDate).getTime() -
        new Date(a.menu.weekStartDate).getTime()
      );
    });

  const toggleDay = (menuId: number, dayOfWeek: number) => {
    const key = `${menuId}-${dayOfWeek}`;
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const isDayExpanded = (menuId: number, dayOfWeek: number): boolean => {
    return expandedDays.has(`${menuId}-${dayOfWeek}`);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-muted-foreground">Chargement en cours...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (menuGroups.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-muted-foreground">
            Aucune commande enregistrée.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Create a map of schoolId -> school name for quick lookup
  const schoolsMap = new Map<number, string>();
  schools.forEach((school) => {
    schoolsMap.set(school.id, school.name);
  });

  return (
    <div className="space-y-6">
      {menuGroups.map((group) => {
        const weekStart = formatDate(new Date(group.menu.weekStartDate));
        const weekInfo =
          group.menu.weekNumber && group.menu.year
            ? `Semaine ${group.menu.weekNumber} - ${group.menu.year}`
            : weekStart;
        const schoolName = schoolsMap.get(group.menu.schoolId) || 'inconnue';

        return (
          <Card key={group.menu.id}>
            <CardHeader>
              <CardTitle>
                École {schoolName} - Menu de la semaine du {weekStart}
                {group.menu.weekNumber && group.menu.year && (
                  <span className="text-muted-foreground font-normal ml-2">
                    ({weekInfo})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {group.days.map((dayData) => {
                  const dayWithDate = formatDayWithDate(
                    new Date(group.menu.weekStartDate),
                    dayData.dayOfWeek
                  );
                  const isExpanded = isDayExpanded(group.menu.id, dayData.dayOfWeek);

                  return (
                    <div key={dayData.menuDayId}
                         className="border rounded-lg">
                      <Button
                        variant="ghost"
                        className="w-full justify-between p-4 h-auto"
                        onClick={() => toggleDay(group.menu.id, dayData.dayOfWeek)}
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{dayWithDate}</span>
                          {dayData.stats.paid > 0 && (
                            <Badge variant="outline"
                                   className={`text-sm font-normal ${getStatusBadgeClass('paid')}`}>
                              {dayData.stats.paid} payés
                            </Badge>
                          )}
                          {dayData.stats.pending > 0 && (
                            <Badge variant="outline"
                                   className={`text-sm font-normal ${getStatusBadgeClass('pending')}`}>
                              {dayData.stats.pending} en attente
                            </Badge>
                          )}
                          {dayData.stats.error > 0 && (
                            <Badge variant="outline"
                                   className={`text-sm font-normal ${getStatusBadgeClass('error')}`}>
                              {dayData.stats.error} en erreur
                            </Badge>
                          )}
                          <Badge variant="outline"
                                 className="text-sm font-normal">
                            Total : {dayData.stats.total} repas
                          </Badge>
                        </div>
                        {isExpanded ? (
                          <ChevronDownIcon className="h-4 w-4 ml-2"/>
                        ) : (
                          <ChevronRightIcon className="h-4 w-4 ml-2"/>
                        )}
                      </Button>

                      {isExpanded && (
                        <div className="px-4 pb-4 pt-2 border-t">
                          <div className="space-y-4 mt-2">
                            {dayData.bookings.map(({booking, studentIds}) => {
                              const students = booking.students?.filter((s) =>
                                studentIds.includes(s.id)
                              ) || [];

                              return (
                                <div
                                  key={booking.id}
                                  className="border-l-2 border-muted pl-3"
                                >
                                  <div className="font-medium text-sm mb-1">
                                    {booking.email}
                                  </div>
                                  <div className="text-sm text-muted-foreground space-y-1">
                                    {students.map((student) => (
                                      <div key={student.id}>
                                        {student.firstName} {student.lastName}
                                        {student.class && ` (${student.class})`}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
