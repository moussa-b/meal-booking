'use client';

import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BookingCancelPage() {
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
