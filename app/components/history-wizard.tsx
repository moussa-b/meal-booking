'use client';

import React, { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StepSchoolInfo } from './step-school-info';
import { StepHistory } from './step-history';
import type { School } from '@/lib/models/school';

// Define the form schema compatible with StepSchoolInfo
const formSchema = z.object({
  schoolId: z.number().min(1, 'L\'école est requise'),
  email: z.string().email('Email invalide'),
});

export type HistoryFormData = z.infer<typeof formSchema>;

type Step = 1 | 2;

type HistoryWizardProps = {
  code?: string;
  email?: string;
};

export function HistoryWizard({ code, email }: HistoryWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [hasBookings, setHasBookings] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const methods = useForm<HistoryFormData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      schoolId: 0,
      email: '',
    },
  });

  async function validateSchoolCode(code: string): Promise<School | null> {
    try {
      const response = await fetch(`/api/schools/code/${code}`);
      if (response.ok) {
        const result = await response.json();
        return result.data || null;
      }
      return null;
    } catch (error) {
      console.error('Error validating school code:', error);
      return null;
    }
  }

  // Handle query parameters on mount
  useEffect(() => {
    // Validate and pre-populate email if valid
    const emailSchema = z.email();
    const emailValidation = email ? emailSchema.safeParse(email) : {success: false};
    const validEmail = emailValidation.success;

    if (validEmail && email) {
      methods.setValue('email', email);
    }

    // Validate code and pre-populate school if valid
    if (code) {
      validateSchoolCode(code).then((school) => {
        if (school) {
          methods.setValue('schoolId', school.id);

          // If both are valid, go directly to step 2
          if (validEmail) {
            // Use setTimeout to ensure form values are set before navigating
            setTimeout(() => {
              setCurrentStep(2);
              setIsLoadingHistory(true); // Set loading when navigating to step 2
              setHasBookings(false); // Reset bookings state
            }, 100);
          }
        }
      });
    } else if (validEmail) {
      // If only email is valid, stay on step 1 (already set email above)
    }
  }, [code, email, methods]);

  const handleNext = async () => {
    const isValid = await methods.trigger(['schoolId', 'email']);

    if (isValid) {
      setCurrentStep(2);
      setIsLoadingHistory(true); // Set loading when navigating to step 2
      setHasBookings(false); // Reset bookings state
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
      setHasBookings(false); // Reset bookings state when going back
      setIsLoadingHistory(false); // Reset loading state when going back
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepSchoolInfo/>;
      case 2:
        return (
          <StepHistory
            onBookingsLoaded={setHasBookings}
            onLoadingChange={setIsLoadingHistory}
          />
        );
      default:
        return null;
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
                {currentStep > 1 && !isLoadingHistory && !hasBookings && (
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
