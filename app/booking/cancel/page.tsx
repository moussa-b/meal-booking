'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Info, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

function BookingCancelContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!bookingId) {
        return;
      }

      const id = Number(bookingId);
      if (Number.isNaN(id) || id < 1) {
        setStatus('error');
        setErrorMessage('Identifiant de réservation invalide.');
        return;
      }

      setStatus('loading');

      try {
        const res = await fetch(`/api/public/bookings/${id}`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setStatus('error');
          setErrorMessage(err.message ?? 'Réservation introuvable.');
          return;
        }

        const json = await res.json();
        const paymentEmailSentAt = json?.data?.paymentEmailSentAt ?? null;

        if (!paymentEmailSentAt) {
          const sendRes = await fetch(`/api/public/bookings/${id}/send-pay-later-email`, {
            method: 'POST',
          });
          if (!sendRes.ok) {
            console.error('Failed to send pay-later email:', await sendRes.text());
          }
        }

        if (!cancelled) {
          setStatus('ready');
          if (typeof window !== 'undefined' && window.opener && !window.closed) {
            window.opener.postMessage({ type: 'payment_cancelled', bookingId: id }, window.location.origin);
          }
        }
      } catch (e) {
        if (!cancelled) {
          console.error('Cancel page error:', e);
          setStatus('error');
          setErrorMessage('Une erreur est survenue.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  if (!bookingId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 p-6">
        <div className="rounded-full bg-red-100 p-3">
          <XCircle className="h-12 w-12 text-red-600"
                   aria-hidden/>
        </div>
        <p className="text-red-700 font-semibold text-center">Paramètres invalides</p>
        <p className="text-slate-600 text-center text-sm max-w-sm">
          L&apos;identifiant de réservation (bookingId) est manquant dans l&apos;URL.
        </p>
        <p className="text-slate-500 text-sm">Cette fenêtre peut se fermer.</p>
        <Button type="button"
                variant="outline"
                onClick={() => window.close()}
                className="mt-2">
          Fermer cette fenêtre
        </Button>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 p-6">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" aria-hidden />
        <p className="text-slate-700 font-medium">Chargement...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 p-6">
        <div className="rounded-full bg-red-100 p-3">
          <XCircle className="h-12 w-12 text-red-600"
                   aria-hidden/>
        </div>
        <p className="text-red-700 font-semibold text-center">Erreur</p>
        <p className="text-slate-600 text-center text-sm max-w-sm">{errorMessage}</p>
        <Button type="button"
                variant="outline"
                onClick={() => window.close()}
                className="mt-2">
          Fermer cette fenêtre
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 p-6">
      <div className="rounded-full bg-amber-100 p-3">
        <Info className="h-12 w-12 text-amber-600"
              aria-hidden/>
      </div>
      <p className="text-amber-800 font-semibold text-center">Paiement annulé</p>
      <p className="text-slate-600 text-center text-sm max-w-sm">
        Vous pouvez terminer le paiement plus tard depuis l&apos;historique des réservations.
      </p>
      <p className="text-slate-500 text-sm">Cette fenêtre peut se fermer.</p>
      <Button type="button"
              variant="outline"
              onClick={() => window.close()}
              className="mt-2">
        Fermer cette fenêtre
      </Button>
    </div>
  );
}

function CancelFallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 p-6">
      <Loader2 className="h-12 w-12 animate-spin text-blue-600" aria-hidden />
      <p className="text-slate-700 font-medium">Chargement...</p>
    </div>
  );
}

export default function BookingCancelPage() {
  return (
    <Suspense fallback={<CancelFallback />}>
      <BookingCancelContent />
    </Suspense>
  );
}
