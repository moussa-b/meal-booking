'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

function BookingReturnContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const bookingId = searchParams.get('bookingId');
    const orderId = searchParams.get('token') ?? searchParams.get('orderId');

    if (!bookingId || !orderId) {
      setStatus('error');
      setMessage('Paramètres de retour invalides.');
      return;
    }

    const capture = async () => {
      try {
        const res = await fetch('/api/payments/capture', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            orderId,
            bookingId: Number(bookingId),
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message ?? 'Capture failed');
        }

        setStatus('success');
        if (typeof window !== 'undefined' && window.opener) {
          window.opener.postMessage({type: 'payment_captured'}, window.location.origin);
          window.close();
        }
      } catch (e) {
        console.error('Capture error:', e);
        setStatus('error');
        setMessage(e instanceof Error ? e.message : 'Le paiement n\'a pas pu être finalisé.');
      }
    };

    capture();
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 p-6">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600"
                 aria-hidden/>
        <p className="text-slate-700 font-medium">Finalisation du paiement...</p>
        <p className="text-slate-500 text-sm">Veuillez patienter.</p>
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
        <p className="text-red-700 font-semibold text-center">Paiement échoué</p>
        <p className="text-slate-600 text-center text-sm max-w-sm">{message}</p>
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 p-6">
      <div className="rounded-full bg-green-100 p-3">
        <CheckCircle2 className="h-12 w-12 text-green-600"
                      aria-hidden/>
      </div>
      <p className="text-green-800 font-semibold text-center">Paiement effectué avec succès</p>
      <p className="text-slate-600 text-center text-sm">Votre réservation a bien été enregistrée et payée.</p>
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

function ReturnFallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 p-6">
      <Loader2 className="h-12 w-12 animate-spin text-blue-600" aria-hidden />
      <p className="text-slate-700 font-medium">Chargement...</p>
    </div>
  );
}

export default function BookingReturnPage() {
  return (
    <Suspense fallback={<ReturnFallback />}>
      <BookingReturnContent />
    </Suspense>
  );
}
