"use client";

import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StepSchoolInfo } from "./step-school-info";
import { StepChildren } from "./step-children";
import { StepMenuSelection } from "./step-menu-selection";
import { ConfirmationScreen } from "./confirmation-screen";

// Define the complete form schema
const formSchema = z.object({
  schoolCode: z.string().min(1, "Le code école est requis"),
  email: z.string().email("Email invalide"),
  children: z
    .array(
      z.object({
        lastName: z.string().min(1, "Le nom de famille est requis"),
        firstName: z.string().min(1, "Le prénom est requis"),
        class: z.string().min(1, "La classe est requise"),
        feedingRegime: z.string().optional(),
      })
    )
    .min(1, "Au moins un enfant est requis"),
  menuSelections: z
    .record(
      z.string(),
      z.object({
        lundi: z.boolean(),
        mardi: z.boolean(),
        jeudi: z.boolean(),
        vendredi: z.boolean(),
      })
    )
    .refine(
      (menuSelections) => {
        // Check if at least one day is selected for at least one child
        return Object.values(menuSelections).some((selection) =>
          Object.values(selection).some((daySelected) => daySelected === true)
        );
      },
      {
        message: "Veuillez sélectionner au moins un jour pour au moins un enfant",
      }
    ),
});

export type BookingFormData = z.infer<typeof formSchema>;

type Step = 1 | 2 | 3 | 100;

export function BookingWizard() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const methods = useForm<BookingFormData>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      schoolCode: "",
      email: "",
      children: [
        {
          lastName: "",
          firstName: "",
          class: "",
          feedingRegime: "",
        },
      ],
      menuSelections: {},
    },
  });

  const handleNext = async () => {
    let fieldsToValidate: (keyof BookingFormData)[] = [];

    if (currentStep === 1) {
      fieldsToValidate = ["schoolCode", "email"];
    } else if (currentStep === 2) {
      fieldsToValidate = ["children"];
    } else if (currentStep === 3) {
      fieldsToValidate = ["menuSelections"];
    }

    const isValid = await methods.trigger(fieldsToValidate);

    if (isValid) {
      if (currentStep === 3) {
        setCurrentStep(100);
      } else {
        setCurrentStep((currentStep + 1) as Step);
      }
    }
  };

  const handleBack = () => {
    if (currentStep === 100) {
      setCurrentStep(3);
    } else if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepSchoolInfo />;
      case 2:
        return <StepChildren />;
      case 3:
        return <StepMenuSelection />;
      case 100:
        return <ConfirmationScreen onSubmitted={() => setIsSubmitted(true)} />;
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Informations de l'école";
      case 2:
        return "Informations des enfants";
      case 3:
        return "Sélection des repas";
      case 100:
        return "Confirmation";
      default:
        return "";
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg pt-0">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
              <CardTitle className="text-2xl font-bold text-center">
                Réservation des repas
              </CardTitle>
              {currentStep !== 100 && (
                <div className="text-center text-sm opacity-90 my-1">
                  Étape {currentStep} sur 3
                </div>
              )}
              {currentStep === 100 && (
                <div className="text-center text-sm opacity-90 my-1">
                  Confirmation
                </div>
              )}
            </CardHeader>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-6 text-slate-800">
                {getStepTitle()}
              </h2>

              {renderStep()}

              {currentStep === 3 &&
                methods.formState.errors.menuSelections && (
                  <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg mt-6">
                    <p className="text-sm text-red-700 font-medium">
                      {methods.formState.errors.menuSelections.message as string}
                    </p>
                  </div>
                )}

              <div className="flex gap-3 mt-8">
                {currentStep === 100 && isSubmitted ? (
                  <div className="flex-1 text-center py-3 px-4 bg-green-50 border-2 border-green-200 rounded-lg">
                    <p className="text-green-800 font-medium">
                      ✓ Réservation confirmée ! Vous pouvez fermer cette fenêtre.
                    </p>
                  </div>
                ) : (
                  <>
                    {(currentStep > 1 || currentStep === 100) && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleBack}
                        className="flex-1"
                      >
                        Précédent
                      </Button>
                    )}

                    {currentStep !== 100 && (
                      <Button
                        type="button"
                        onClick={handleNext}
                        className="flex-1"
                      >
                        {currentStep === 3 ? "Voir le récapitulatif" : "Suivant"}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </FormProvider>
  );
}
