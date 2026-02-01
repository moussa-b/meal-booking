'use client';

import { useCallback, useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import type { HistoryFormData } from './history-wizard';
import type { Booking } from '@/lib/models/booking';
import { PaymentStatus } from '@/lib/models/payment-status';
import { formatDate } from '@/lib/utils/date.utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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

/**
 * Get badge className and French label for payment status
 * Colors: PAID => green, PENDING/PROCESSING => yellow, FAILED/CANCELED/EXPIRED => red, REFUNDED => blue
 */
const getPaymentStatusBadge = (status: PaymentStatus): { className: string; label: string } => {
  switch (status) {
    case PaymentStatus.PENDING:
      return { className: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'En attente' };
    case PaymentStatus.PROCESSING:
      return { className: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'En cours' };
    case PaymentStatus.PAID:
      return { className: 'bg-green-100 text-green-800 border-green-200', label: 'Payé' };
    case PaymentStatus.FAILED:
      return { className: 'bg-red-100 text-red-800 border-red-200', label: 'Échoué' };
    case PaymentStatus.CANCELED:
      return { className: 'bg-red-100 text-red-800 border-red-200', label: 'Annulé' };
    case PaymentStatus.EXPIRED:
      return { className: 'bg-red-100 text-red-800 border-red-200', label: 'Expiré' };
    case PaymentStatus.REFUNDED:
      return { className: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Remboursé' };
    default:
      return { className: 'bg-slate-100 text-slate-800 border-slate-200', label: status };
  }
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
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [payingBookingId, setPayingBookingId] = useState<number | null>(null);

  // function used in addEventListener/removeEventListener the reference must be unique to avoid memory leaks
  // and adding same listener several times
  const handlePaymentMessage = useCallback((event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;
    if (event.data?.type === 'payment_captured') {
      toast.success('Paiement effectué');
      setRefreshTrigger((t) => t + 1);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('message', handlePaymentMessage);
    return () => window.removeEventListener('message', handlePaymentMessage);
  }, [handlePaymentMessage]);

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
  }, [email, schoolId, onBookingsLoaded, onLoadingChange, refreshTrigger]);

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

  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? '';

  async function handlePayWithPayPal(bookingId: number): Promise<void> {
    setPayingBookingId(bookingId);
    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? 'Impossible de créer le paiement PayPal');
        return;
      }
      const approvalUrl = data.approvalUrl ?? data.approval_url;
      if (!approvalUrl) {
        toast.error('URL de paiement manquante.');
        return;
      }
      const width = 500;
      const height = 600;
      const left = Math.round((window.screen.width - width) / 2);
      const top = Math.round((window.screen.height - height) / 2);
      window.open(
        approvalUrl,
        'paypal-checkout',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
      );
    } catch (err) {
      console.error('Error starting PayPal:', err);
      toast.error('Erreur lors du paiement');
    } finally {
      setPayingBookingId(null);
    }
  }

  const content = (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <div
          key={booking.id}
          className="p-4 border border-slate-200 rounded-lg bg-white shadow-sm"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-slate-800">
                  {formatDate(booking.created)}
                </p>
                {(() => {
                  const { className, label } = getPaymentStatusBadge(booking.status);
                  return (
                    <Badge variant="outline" className={className}>
                      {label}
                    </Badge>
                  );
                })()}
              </div>
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
          {booking.status !== PaymentStatus.PAID && paypalClientId && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <Button
                type="button"
                onClick={() => handlePayWithPayPal(booking.id)}
                disabled={payingBookingId !== null}
                className="w-full h-10 text-sm font-semibold bg-[#0070ba] hover:bg-[#005ea6] text-white"
              >
                {payingBookingId === booking.id
                  ? 'Préparation du paiement...'
                  : 'Payer avec PayPal'}
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return content;
}
