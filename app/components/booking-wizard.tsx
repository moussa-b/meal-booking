"use client";

import { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ORGANIZATION_TYPES } from "@/lib/models/organization";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StepOrganizationInfo } from "./step-organization-info";
import { StepChildren } from "./step-children";
import { StepMenuSelection } from "./step-menu-selection";
import { ConfirmationScreen } from "./confirmation-screen";
import type { WeeklyMenu } from "@/lib/models/weekly-menu";
import type { Organization } from "@/lib/models/organization";

// Define the complete form schema
const mealParticipantSchema = z.object({
  lastName: z.string().min(1, "Le nom de famille est requis"),
  firstName: z.string().min(1, "Le prénom est requis"),
  class: z.string(),
  feedingRegime: z.string().optional(),
  type: z.enum(ORGANIZATION_TYPES),
}).superRefine((mealParticipant, ctx) => {
  if (mealParticipant.type === "school" && mealParticipant.class.trim().length === 0) {
    ctx.addIssue({
      code: 'custom',
      path: ["class"],
      message: "La classe est requise",
    });
  }
});

const formSchema = z.object({
  organizationId: z.number().min(1, "L'établissement est requis"),
  email: z.email("Email invalide"),
  phone: z.string().max(50).optional().or(z.literal("")),
  mealParticipants: z
    .array(mealParticipantSchema)
    .min(1, "Au moins un élève est requis"),
  menuSelections: z
    .record(z.string(), z.array(z.number()))
    .refine(
      (menuSelections) => {
        // Check if at least one WeeklyMenuDay ID is selected for at least one student
        return Object.values(menuSelections).some(
          (selection) => Array.isArray(selection) && selection.length > 0
        );
      },
      {
        message: "Veuillez sélectionner au moins un jour pour au moins un élève",
      }
    ),
  saveChildrenInfo: z.boolean().optional(),
  comment: z.string().max(2000).optional().or(z.literal("")),
});

export type BookingFormData = z.infer<typeof formSchema>;

type Step = 1 | 2 | 3 | 99 | 100;

export function BookingWizard() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [weeklyMenu, setWeeklyMenu] = useState<WeeklyMenu | null>(null);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);

  const methods = useForm<BookingFormData>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      organizationId: 0,
      email: "",
      phone: "",
      mealParticipants: [
        {
          lastName: "",
          firstName: "",
          class: "",
          feedingRegime: "",
          type: "school",
        },
      ],
      menuSelections: {},
      saveChildrenInfo: false,
      comment: "",
    },
  });

  const handleNext = async () => {
    let fieldsToValidate: (keyof BookingFormData)[] = [];

    if (currentStep === 1) {
      fieldsToValidate = ["organizationId", "email"];
    } else if (currentStep === 2) {
      fieldsToValidate = ["mealParticipants"];
    } else if (currentStep === 3) {
      fieldsToValidate = ["menuSelections"];
    }

    const isValid = await methods.trigger(fieldsToValidate);

    if (isValid) {
      if (currentStep === 1) {
        if (isLoadingMenu) return;
        if (!hasMenu) {
          setCurrentStep(99);
          return;
        }
        setCurrentStep(2);
      } else if (currentStep === 3) {
        setCurrentStep(100);
      } else {
        setCurrentStep((currentStep + 1) as Step);
      }
    }
  };

  const handleBack = () => {
    if (currentStep === 100) {
      setCurrentStep(3);
    } else if (currentStep === 99) {
      setCurrentStep(1);
    } else if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const organizationId = methods.watch('organizationId');
  const selectedOrganizationType = selectedOrganization?.type ?? 'school';

  useEffect(() => {
    if (!organizationId || organizationId <= 0) {
      setSelectedOrganization(null);
      return;
    }
  }, [organizationId]);

  useEffect(() => {
    if (!organizationId || organizationId <= 0) return;

    const currentMealParticipants = methods.getValues('mealParticipants');
    if (currentMealParticipants.length === 0) return;

    const shouldUpdateMealParticipants = currentMealParticipants.some(
      (mealParticipant) =>
        mealParticipant.type !== selectedOrganizationType ||
        (selectedOrganizationType === 'company' && mealParticipant.class !== '')
    );

    if (!shouldUpdateMealParticipants) return;

    methods.setValue(
      'mealParticipants',
      currentMealParticipants.map((mealParticipant) => ({
        ...mealParticipant,
        type: selectedOrganizationType,
        class: selectedOrganizationType === 'company' ? '' : mealParticipant.class,
      })),
      {shouldDirty: true, shouldValidate: currentStep === 2}
    );
  }, [currentStep, methods, organizationId, selectedOrganizationType]);

  useEffect(() => {
    async function fetchMenu() {
      if (!organizationId || organizationId <= 0) {
        setWeeklyMenu(null);
        setIsLoadingMenu(false);
        return;
      }

      try {
        setIsLoadingMenu(true);
        const response = await fetch(`/api/public/weekly-menus?current=true&organizationId=${organizationId}`);
        if (!response.ok) {
          setWeeklyMenu(null);
          return;
        }
        const result = await response.json();
        setWeeklyMenu(result.data);
      } catch {
        setWeeklyMenu(null);
      } finally {
        setIsLoadingMenu(false);
      }
    }
    fetchMenu();
  }, [organizationId]);

  const hasMenu = (weeklyMenu?.days?.length ?? 0) > 0;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepOrganizationInfo onOrganizationSelect={setSelectedOrganization} />;
      case 99:
        return (
          <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
            <p className="text-yellow-700 font-medium">
              Aucun menu disponible pour le moment.
            </p>
          </div>
        );
      case 2:
        return <StepChildren organizationType={selectedOrganizationType} />;
      case 3:
        return (
          <StepMenuSelection
            weeklyMenu={weeklyMenu}
            isLoading={isLoadingMenu}
          />
        );
      case 100:
        return <ConfirmationScreen onSubmitted={() => setIsSubmitted(true)} />;
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Informations de l'établissement";
      case 99:
        return "Aucun menu disponible";
      case 2:
        return selectedOrganizationType === "company"
          ? "Informations sur les bénéficiaires de repas"
          : "Informations des élèves";
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
              {currentStep !== 100 && currentStep !== 99 && (
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
                      {typeof methods.formState.errors.menuSelections.message === 'string'
                        ? methods.formState.errors.menuSelections.message
                        : 'Une erreur est survenue'}
                    </p>
                  </div>
                )}

              <div className="flex gap-3 mt-8">
                {currentStep === 100 && isSubmitted
                  ? null
                  : (
                    <>
                      {(currentStep > 1 || currentStep === 99 || currentStep === 100) && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleBack}
                          className="flex-1"
                        >
                          Précédent
                        </Button>
                      )}

                      {currentStep !== 100 && currentStep !== 99 && (currentStep !== 3 || hasMenu) && (
                        <Button
                          type="button"
                          onClick={handleNext}
                          className="flex-1"
                          disabled={currentStep === 1 && isLoadingMenu}
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
