'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DAY_NAMES } from '@/lib/utils/date.utils';
import type { WeeklyMenu } from '@/lib/models/weekly-menu';
import { getStatusBadgeClass, getStatusBadgeType } from '@/lib/services/payment-status.service';

const DASHBOARD_DAY_ORDER = [0, 1, 3, 4]; // Lundi, Mardi, Jeudi, Vendredi

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PAID: 'Payé',
  PENDING: 'En attente',
  PROCESSING: 'En cours',
  FAILED: 'Échoué',
  CANCELED: 'Annulé',
  EXPIRED: 'Expiré',
  REFUNDED: 'Remboursé',
};

export interface DashboardWeekMenu {
  menu: WeeklyMenu;
  schoolId: number;
  schoolName: string;
  paidMealsByDay: Record<number, number>;
  bookingCountByStatus: Record<string, number>;
  totalPaidAmount: number;
}

export interface DashboardWeek {
  weekStartDate: string;
  menus: DashboardWeekMenu[];
  noData: boolean;
}

export function WeekColumnContent({week}: { week: DashboardWeek }) {
  const item = week.menus[0];
  if (!item) return null;

  const {menu, paidMealsByDay, bookingCountByStatus, totalPaidAmount} = item;
  const totalPaidFormatted = totalPaidAmount.toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  });
  const days = (menu.days ?? []).filter((d) => DASHBOARD_DAY_ORDER.includes(d.dayOfWeek));
  const sortedDays = [...days].sort((a, b) => a.dayOfWeek - b.dayOfWeek);

  return (
    <div className="space-y-6">
      {/* Menu of the week - grid: row1 Lundi|Mardi, row2 Jeudi|Vendredi */}
      <div>
        <h3 className="mb-2 text-sm font-medium">Menu</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {DASHBOARD_DAY_ORDER.map((dayOfWeek) => {
            const day = sortedDays.find((d) => d.dayOfWeek === dayOfWeek);
            const dayName = DAY_NAMES[dayOfWeek] ?? `Jour ${dayOfWeek}`;
            const mealsCount = paidMealsByDay[dayOfWeek] ?? 0;
            return (
              <div
                key={dayOfWeek}
                className="flex flex-col gap-1 border rounded-md p-2"
              >
                <span className="text-base font-semibold text-foreground">{dayName}</span>
                <div className="text-sm font-medium text-foreground">
                  Nombre de plat à préparer : <span className="tabular-nums">{mealsCount}</span>
                </div>
                {day ? (
                  <div className="text-muted-foreground text-sm space-y-0.5 pl-0.5">
                    <div>Plat principal : {day.mainDish?.name ?? 'Aucun'}</div>
                    <div>Entrée : {day.appetizer?.name ?? 'Aucun'}</div>
                    <div>Dessert : {day.dessert?.name ?? 'Aucun'}</div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm pl-0.5">Aucun jour défini.</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Total paid for the week */}
      <div className="rounded-md border bg-muted/50 p-3">
        <h3 className="mb-1 text-sm font-medium">Total des commandes payées</h3>
        <p className="text-lg font-semibold tabular-nums">{totalPaidFormatted}</p>
      </div>

      {/* Bookings by status */}
      <div>
        <h3 className="mb-2 text-sm font-medium">Commandes par statut</h3>
        {Object.entries(bookingCountByStatus).length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune commande.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {Object.entries(bookingCountByStatus)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([status, count]) => (
                <Badge
                  key={status}
                  variant="outline"
                  className={cn(
                    'text-sm font-normal',
                    getStatusBadgeClass(getStatusBadgeType(status))
                  )}
                >
                  {PAYMENT_STATUS_LABELS[status] ?? status} : {count}
                </Badge>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
