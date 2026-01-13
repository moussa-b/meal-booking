"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Mail, School, User, UtensilsCrossed } from "lucide-react";
import type { BookingFormData } from "./booking-wizard";
import { toast } from "sonner";

const DAYS_FRENCH: Record<string, string> = {
  lundi: "Lundi",
  mardi: "Mardi",
  jeudi: "Jeudi",
  vendredi: "Vendredi",
};

interface ConfirmationScreenProps {
  onSubmitted?: () => void;
}

export function ConfirmationScreen({ onSubmitted }: ConfirmationScreenProps) {
  const { watch } = useFormContext<BookingFormData>();
  const formData = watch();

  const handleSubmit = () => {
    // Placeholder for future implementation
    console.log("Form data to submit:", formData);
    console.log("Form data to submit:", JSON.stringify(formData));
    toast.success("Réservation enregistrée avec succès!", {
      description: "Vous recevrez une confirmation par email.",
      duration: 5000,
    });
    onSubmitted?.();
  };

  return (
    <div className="space-y-6">
      {/* Success Icon */}
      <div className="flex justify-center mb-4">
        <div className="rounded-full bg-green-100 p-3">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
        </div>
      </div>

      <p className="text-center text-slate-600 mb-6">
        Veuillez vérifier vos informations avant de soumettre votre réservation.
      </p>

      {/* School Information */}
      <Card className="border-2 border-slate-200 pt-0">
        <CardHeader className="bg-slate-50 rounded-t-xl">
          <CardTitle className="text-lg font-semibold text-blue-900 text-center pt-2 flex items-center justify-center gap-2">
            <School className="h-5 w-5 text-blue-600" />
            Informations de l'école
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-start gap-3">
            <School className="h-5 w-5 text-slate-400 mt-0.5" />
            <div>
              <div className="text-sm text-slate-500">Code école</div>
              <div className="font-semibold text-slate-900">
                {formData.schoolCode}
              </div>
            </div>
          </div>
          <Separator />
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-slate-400 mt-0.5" />
            <div>
              <div className="text-sm text-slate-500">Email</div>
              <div className="font-semibold text-slate-900">
                {formData.email}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Children and Menu Selections */}
      <Card className="border-2 border-blue-200 pt-0">
        <CardHeader className="bg-blue-50 rounded-t-xl">
          <CardTitle className="text-lg font-semibold text-blue-900 text-center pt-2 flex items-center justify-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Enfants inscrits
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-6">
          {formData.children.map((child, index) => {
            const childKey = `${child.firstName}-${child.lastName}-${index}`;
            const selections = formData.menuSelections[childKey] || {};
            const selectedDays = Object.entries(selections)
              .filter(([_, selected]) => selected)
              .map(([day]) => DAYS_FRENCH[day]);

            return (
              <div key={childKey}>
                {index > 0 && <Separator className="my-4" />}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-semibold text-lg text-slate-900">
                        {child.firstName} {child.lastName}
                      </div>
                      <div className="text-sm text-slate-600 mt-1">
                        Classe: <span className="font-medium">{child.class}</span>
                      </div>
                      {child.feedingRegime && (
                        <div className="text-sm text-slate-600 mt-1">
                          Régime alimentaire:{" "}
                          <span className="font-medium">
                            {child.feedingRegime}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ml-8 mt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <UtensilsCrossed className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-semibold text-slate-700">
                        Jours sélectionnés:
                      </span>
                    </div>
                    {selectedDays.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedDays.map((day) => (
                          <span
                            key={day}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200"
                          >
                            {day}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-amber-600 italic">
                        Aucun jour sélectionné
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="pt-4">
        <Button
          type="button"
          onClick={handleSubmit}
          className="w-full h-12 text-base font-semibold bg-green-600 hover:bg-green-700"
        >
          <CheckCircle2 className="h-5 w-5 mr-2" />
          Soumettre la réservation
        </Button>
      </div>
    </div>
  );
}
