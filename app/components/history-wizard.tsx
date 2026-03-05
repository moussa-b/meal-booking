'use client';

import React, { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StepSchoolInfo } from './step-school-info';
import { StepHistory } from './step-history';
import type { BookingWithDetails } from '@/lib/models/booking';

// Define the form schema compatible with StepSchoolInfo
const formSchema = z.object({
  schoolId: z.number().min(1, 'L\'école est requise'),
  email: z.string().email('Email invalide'),
});

export type HistoryFormData = z.infer<typeof formSchema>;

type Step = 1 | 2;

type HistoryWizardProps = {
  email?: string;
  initialBookings: BookingWithDetails[] | null;
  initialSchoolId?: number;
};

export function HistoryWizard({email, initialBookings, initialSchoolId,}: HistoryWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>(initialBookings ? 2 : 1);
  const [bookings, setBookings] = useState<BookingWithDetails[] | null>(initialBookings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasBookings = !!(bookings && bookings.length > 0);

  const methods = useForm<HistoryFormData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      schoolId: initialSchoolId ?? 0,
      email: email ?? '',
    },
  });

  // Prefill email from query param when it becomes available (e.g. client-side nav)
  useEffect(() => {
    if (!email) return;
    const emailSchema = z.email();
    if (emailSchema.safeParse(email).success) {
      methods.setValue('email', email);
    }
  }, [email, methods]);

  const fetchBookingsForForm = async () => {
    const { email: formEmail, schoolId } = methods.getValues();

    if (!formEmail || !schoolId) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setBookings(null);

      const response = await fetch(`/api/public/bookings?email=${encodeURIComponent(formEmail)}&schoolId=${schoolId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const result = await response.json();
      setBookings(result.data ?? []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Erreur lors du chargement de l\'historique');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    const isValid = await methods.trigger(['schoolId', 'email']);

    if (isValid) {
      setCurrentStep(2);
      await fetchBookingsForForm();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return 'Informations de l\'école';
      case 2:
        return 'Historique des réservations';
      default:
        return '';
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepSchoolInfo />;
      case 2:
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

        if (!bookings) {
          return null;
        }

        return <StepHistory bookings={bookings} />;
      default:
        return null;
    }
  };

  return (
    // FormProvider in parent: shares form state across StepSchoolInfo and StepHistory
    <FormProvider {...methods}>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg pt-0">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
              <CardTitle className="text-2xl font-bold text-center">
                Historique des réservations
              </CardTitle>
              <div className="text-center text-sm opacity-90 my-1">
                Étape {currentStep} sur 2
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-6 text-slate-800">
                {getStepTitle()}
              </h2>

              {renderStep()}

              <div className="flex gap-3 mt-8">
                {currentStep > 1 && !loading && !hasBookings && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1"
                  >
                    Précédent
                  </Button>
                )}

                {currentStep === 1 && (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="flex-1"
                  >
                    Suivant
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </FormProvider>
  );
}
