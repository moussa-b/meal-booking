"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Mail, School, User, UtensilsCrossed } from "lucide-react";
import type { BookingFormData } from "./booking-wizard";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import type { School as SchoolType } from "@/lib/models/school";
import type { WeeklyMenu, WeeklyMenuDay } from "@/lib/models/weekly-menu";
import { DayOfWeek } from "@/lib/models/weekly-menu";

const DAYS_FRENCH: Record<string, string> = {
  lundi: "Lundi",
  mardi: "Mardi",
  jeudi: "Jeudi",
  vendredi: "Vendredi",
};

// Map day of week (0-6) to lowercase key for form
const DAY_KEYS: Record<number, string | null> = {
  [DayOfWeek.MONDAY]: "lundi",
  [DayOfWeek.TUESDAY]: "mardi",
  [DayOfWeek.THURSDAY]: "jeudi",
  [DayOfWeek.FRIDAY]: "vendredi",
  [DayOfWeek.WEDNESDAY]: null,
  [DayOfWeek.SATURDAY]: null,
  [DayOfWeek.SUNDAY]: null,
};

interface ConfirmationScreenProps {
  onSubmitted?: () => void;
}

export function ConfirmationScreen({ onSubmitted }: ConfirmationScreenProps) {
  const { watch } = useFormContext<BookingFormData>();
  const formData = watch();
  const [schools, setSchools] = useState<SchoolType[]>([]);
  const [weeklyMenu, setWeeklyMenu] = useState<WeeklyMenu | null>(null);

  // Fetch schools to get school name
  useEffect(() => {
    async function fetchSchools() {
      try {
        const response = await fetch("/api/schools");
        if (response.ok) {
          const result = await response.json();
          setSchools(result.data || []);
        }
      } catch (error) {
        console.error("Error fetching schools:", error);
      }
    }
    fetchSchools();
  }, []);

  // Fetch weekly menu to calculate total price
  useEffect(() => {
    async function fetchMenu() {
      if (!formData.schoolId || formData.schoolId <= 0) {
        return;
      }

      try {
        const response = await fetch(`/api/weekly-menus?current=true&schoolId=${formData.schoolId}`);
        if (response.ok) {
          const result = await response.json();
          setWeeklyMenu(result.data);
        }
      } catch (error) {
        console.error("Error fetching weekly menu:", error);
      }
    }
    fetchMenu();
  }, [formData.schoolId]);

  // Find school name by id
  const school = schools.find((s) => s.id === formData.schoolId);
  const schoolName = school?.name || "École non trouvée";

  // Calculate total price
  const calculateTotalPrice = (): number => {
    if (!weeklyMenu?.days) return 0;

    let total = 0;
    formData.children.forEach((child, index) => {
      const childKey = `${child.firstName}-${child.lastName}-${index}`;
      const selections = formData.menuSelections[childKey] || {};

      Object.entries(selections).forEach(([dayKey, isSelected]) => {
        if (isSelected && weeklyMenu.days) {
          // Find the corresponding day in the menu
          const dayMenu = weeklyMenu.days.find((day: WeeklyMenuDay) => {
            const dayKeyForMenu = DAY_KEYS[day.dayOfWeek];
            return dayKeyForMenu === dayKey;
          });

          if (dayMenu) {
            total += dayMenu.price;
          }
        }
      });
    });

    return total;
  };

  const totalPrice = calculateTotalPrice();

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
              <div className="text-sm text-slate-500">École</div>
              <div className="font-semibold text-slate-900">
                {schoolName}
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
            
            // Create array of selected days with their prices
            const selectedDaysWithPrices = Object.entries(selections)
              .filter(([_, selected]) => selected)
              .map(([dayKey]) => {
                const dayName = DAYS_FRENCH[dayKey];
                // Find the price for this day
                let price = 0;
                if (weeklyMenu?.days) {
                  const dayMenu = weeklyMenu.days.find((day: WeeklyMenuDay) => {
                    const dayKeyForMenu = DAY_KEYS[day.dayOfWeek];
                    return dayKeyForMenu === dayKey;
                  });
                  if (dayMenu) {
                    price = dayMenu.price;
                  }
                }
                return { dayKey, dayName, price };
              });

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
                    {selectedDaysWithPrices.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedDaysWithPrices.map(({ dayKey, dayName, price }) => (
                          <span
                            key={dayKey}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200"
                          >
                            {dayName} - {price.toFixed(2)} €
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

      {/* Total Price */}
      <Card className="border-2 border-green-200 pt-0">
        <CardHeader className="bg-green-50 rounded-t-xl">
          <CardTitle className="text-lg font-semibold text-green-900 text-center pt-2">
            Prix total
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-700">
              {totalPrice.toFixed(2)} €
            </div>
          </div>
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
