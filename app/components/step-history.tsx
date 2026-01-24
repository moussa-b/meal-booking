'use client';

import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import type { HistoryFormData } from './history-wizard';
import type { Booking } from '@/lib/models/booking';
import { formatDate } from '@/lib/utils/date.utils';

interface BookingWithDetails extends Booking {
  totalMeals: number;
  totalAmount: number;
  schoolName?: string;
  weekStartDate?: Date;
}

interface StepHistoryProps {
  onBookingsLoaded?: (hasBookings: boolean) => void;
  onLoadingChange?: (isLoading: boolean) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

export function StepHistory({onBookingsLoaded, onLoadingChange}: StepHistoryProps) {
  // Access form from parent via FormProvider context
  const {watch} = useFormContext<HistoryFormData>();
  // Watch form values reactively (re-renders when they change)
  const email = watch('email');
  const schoolId = watch('schoolId');
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!email || !schoolId) {
      setLoading(false);
      if (onLoadingChange) {
        onLoadingChange(false);
      }
      return;
    }

    async function fetchBookings() {
      try {
        setLoading(true);
        setError(null);
        if (onLoadingChange) {
          onLoadingChange(true);
        }

        // Fetch bookings by email
        const response = await fetch(`/api/bookings?email=${encodeURIComponent(email)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch bookings');
        }

        const result = await response.json();
        const fetchedBookings: Booking[] = result.data || [];

        // Filter bookings by schoolId and calculate totals
        const bookingsForSchool = await Promise.all(
          fetchedBookings
            .filter((booking) => booking.schoolId === schoolId)
            .map(async (booking) => {
              // Get the weekly menu to access menu day prices and weekStartDate
              const menuResponse = await fetch(`/api/weekly-menus/${booking.menuId}`);
              let menuDays: Array<{ id: number; price: number }> = [];
              let weekStartDate: Date | undefined;

              if (menuResponse.ok) {
                const menuResult = await menuResponse.json();
                menuDays = menuResult.data?.days || [];
                // Extract weekStartDate from the menu
                if (menuResult.data?.weekStartDate) {
                  weekStartDate = new Date(menuResult.data.weekStartDate);
                }
              }

              // Create a map of menu day ID to price
              const priceMap = new Map<number, number>();
              menuDays.forEach((day: { id: number; price: number }) => {
                priceMap.set(day.id, day.price);
              });

              // Calculate total meals and amount for this booking
              let totalMeals = 0;
              let totalAmount = 0;

              booking.students?.forEach((student) => {
                student.menuSelections?.forEach((selection) => {
                  totalMeals++;
                  const price = priceMap.get(selection.weeklyMenuDayId) || 0;
                  totalAmount += price;
                });
              });

              return {
                ...booking,
                totalMeals,
                totalAmount,
                weekStartDate,
              };
            })
        );

        setBookings(bookingsForSchool);
        // Notify parent about bookings status
        if (onBookingsLoaded) {
          onBookingsLoaded(bookingsForSchool.length > 0);
        }
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('Erreur lors du chargement de l\'historique');
        // Notify parent that there are no bookings on error
        if (onBookingsLoaded) {
          onBookingsLoaded(false);
        }
      } finally {
        setLoading(false);
        if (onLoadingChange) {
          onLoadingChange(false);
        }
      }
    }

    fetchBookings();
  }, [email, schoolId, onBookingsLoaded, onLoadingChange]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-600">Chargement de l&apos;historique...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
        <p className="text-sm text-red-700 font-medium">{error}</p>
      </div>
    );
  }

  if (bookings.length === 0) {
    // Notify parent that there are no bookings
    if (onBookingsLoaded) {
      onBookingsLoaded(false);
    }
    return (
      <div className="text-center py-8">
        <p className="text-slate-600">Aucune réservation trouvée pour cet email et cette école.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <div
          key={booking.id}
          className="p-4 border border-slate-200 rounded-lg bg-white shadow-sm"
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="font-semibold text-slate-800">
                {formatDate(booking.created)}
              </p>
              {booking.weekStartDate && (
                <p className="text-xs text-slate-500 mt-1">
                  Semaine du {formatDate(booking.weekStartDate)}
                </p>
              )}
              <p className="text-sm text-slate-600 mt-1">
                {booking.students
                  ?.map((s) => `${s.firstName} ${s.lastName}`)
                  .join(', ')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600">
                {booking.totalMeals} repas
              </p>
              <p className="font-semibold text-blue-600">
                {formatCurrency(booking.totalAmount)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
