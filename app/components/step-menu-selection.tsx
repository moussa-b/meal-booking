"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { BookingFormData } from "./booking-wizard";
import { useEffect, useState } from "react";
import type { WeeklyMenu, WeeklyMenuDay } from "@/lib/models/weekly-menu";
import { DayOfWeek } from "@/lib/models/weekly-menu";

const DAYS = ["lundi", "mardi", "jeudi", "vendredi"] as const;

// Map day of week (0-6) to French day names
const DAY_NAMES: Record<number, string> = {
  [DayOfWeek.MONDAY]: "Lundi",
  [DayOfWeek.TUESDAY]: "Mardi",
  [DayOfWeek.WEDNESDAY]: "Mercredi",
  [DayOfWeek.THURSDAY]: "Jeudi",
  [DayOfWeek.FRIDAY]: "Vendredi",
  [DayOfWeek.SATURDAY]: "Samedi",
  [DayOfWeek.SUNDAY]: "Dimanche",
};

// Map day of week to lowercase key for form
const DAY_KEYS: Record<number, (typeof DAYS)[number] | null> = {
  [DayOfWeek.MONDAY]: "lundi",
  [DayOfWeek.TUESDAY]: "mardi",
  [DayOfWeek.THURSDAY]: "jeudi",
  [DayOfWeek.FRIDAY]: "vendredi",
  [DayOfWeek.WEDNESDAY]: null,
  [DayOfWeek.SATURDAY]: null,
  [DayOfWeek.SUNDAY]: null,
};

// Format date to French format
function formatDateFrench(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function StepMenuSelection() {
  const { watch, setValue } = useFormContext<BookingFormData>();
  const children = watch("children");
  const menuSelections = watch("menuSelections");
  const schoolId = watch("schoolId");
  const [weeklyMenu, setWeeklyMenu] = useState<WeeklyMenu | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch weekly menu from API
  useEffect(() => {
    async function fetchMenu() {
      if (!schoolId || schoolId <= 0) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/weekly-menus?current=true&schoolId=${schoolId}`);
        if (!response.ok) {
          throw new Error("Impossible de charger le menu");
        }
        const result = await response.json();
        setWeeklyMenu(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue");
      } finally {
        setIsLoading(false);
      }
    }
    fetchMenu();
  }, [schoolId]);

  // Initialize menu selections for all children if not already set
  useEffect(() => {
    const selections = { ...menuSelections };
    let needsUpdate = false;

    children.forEach((child, index) => {
      const childKey = `${child.firstName}-${child.lastName}-${index}`;
      if (!selections[childKey]) {
        selections[childKey] = {
          lundi: false,
          mardi: false,
          jeudi: false,
          vendredi: false,
        };
        needsUpdate = true;
      }
    });

    if (needsUpdate) {
      setValue("menuSelections", selections);
    }
  }, [children, menuSelections, setValue]);

  const handleDayChange = (
    childKey: string,
    day: (typeof DAYS)[number],
    checked: boolean
  ) => {
    setValue(`menuSelections.${childKey}.${day}`, checked);
  };

  const handleSelectAll = (childKey: string, checked: boolean) => {
    DAYS.forEach((day) => {
      setValue(`menuSelections.${childKey}.${day}`, checked);
    });
  };

  const isAllSelected = (childKey: string) => {
    const selection = menuSelections[childKey];
    if (!selection) return false;
    return DAYS.every((day) => selection[day]);
  };

  // Get menu days filtered to only show Monday, Tuesday, Thursday, Friday
  const menuDays = weeklyMenu?.days?.filter(
    (day) => DAY_KEYS[day.dayOfWeek] !== null
  ) || [];

  // Calculate date for each day based on weekStartDate
  const getDayDate = (dayOfWeek: number): Date => {
    if (!weeklyMenu) return new Date();
    const date = new Date(weeklyMenu.weekStartDate);
    date.setDate(date.getDate() + dayOfWeek);
    return date;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-slate-600">Chargement du menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!weeklyMenu || menuDays.length === 0) {
    return (
      <div className="space-y-6">
        <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
          <p className="text-yellow-700 font-medium">
            Aucun menu disponible pour le moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {children.map((child, index) => {
        const childKey = `${child.firstName}-${child.lastName}-${index}`;
        const selection = menuSelections[childKey] || {
          lundi: false,
          mardi: false,
          jeudi: false,
          vendredi: false,
        };

        return (
          <Card
            key={childKey}
            className="border-2 border-blue-200 bg-blue-50/30 pt-0 gap-1"
          >
            <CardHeader className="bg-blue-100/50 gap-1 rounded-t-xl">
              <CardTitle className="text-lg font-semibold text-blue-900 text-center pt-2">
                Menu pour {child.firstName} {child.lastName}
              </CardTitle>
              {child.feedingRegime && (
                <p className="text-sm text-blue-700 my-1 text-center">
                  Régime alimentaire: {child.feedingRegime}
                </p>
              )}
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Select All Option */}
              <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border-2 border-blue-300">
                <Checkbox
                  id={`${childKey}-select-all`}
                  checked={isAllSelected(childKey)}
                  onCheckedChange={(checked) =>
                    handleSelectAll(childKey, checked as boolean)
                  }
                />
                <Label
                  htmlFor={`${childKey}-select-all`}
                  className="text-base font-semibold cursor-pointer flex-1"
                >
                  Sélectionner tous les jours
                </Label>
              </div>

              <Separator />

              {/* Individual Days */}
              <div className="grid gap-3">
                {menuDays.map((dayMenu: WeeklyMenuDay) => {
                  const dayKey = DAY_KEYS[dayMenu.dayOfWeek];
                  if (!dayKey) return null;

                  const dayName = DAY_NAMES[dayMenu.dayOfWeek];
                  const dayDate = getDayDate(dayMenu.dayOfWeek);

                  return (
                    <Card
                      key={dayMenu.id}
                      className="border border-slate-200 bg-white hover:shadow-md transition-shadow gap-1"
                    >
                      <CardHeader className="p-4 pb-3 pt-0">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id={`${childKey}-${dayKey}`}
                            checked={selection[dayKey]}
                            onCheckedChange={(checked) =>
                              handleDayChange(
                                childKey,
                                dayKey,
                                checked as boolean
                              )
                            }
                            className="mt-1"
                          />
                          <div className="flex-1 flex-row flex items-center gap-2">
                            <div className="font-semibold text-slate-900 text-base">
                              {dayName}
                            </div>
                            <div className="text-sm text-slate-500">
                              {formatDateFrench(dayDate)}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 px-4">
                        <div className="space-y-1 text-sm">
                          {dayMenu.appetizer && (
                            <div className="text-slate-700">
                              <span className="font-medium underline">Entrée:</span>{" "}
                              {dayMenu.appetizer.name}
                              {dayMenu.appetizer.description && (
                                <span className="text-slate-500">
                                  {" "}
                                  - {dayMenu.appetizer.description}
                                </span>
                              )}
                            </div>
                          )}
                          {dayMenu.mainDish && (
                            <div className="text-slate-700">
                              <span className="font-medium underline">Plat:</span>{" "}
                              {dayMenu.mainDish.name}
                              {dayMenu.mainDish.description && (
                                <span className="text-slate-500">
                                  {" "}
                                  - {dayMenu.mainDish.description}
                                </span>
                              )}
                            </div>
                          )}
                          {dayMenu.dessert && (
                            <div className="text-slate-700">
                              <span className="font-medium underline">Dessert:</span>{" "}
                              {dayMenu.dessert.name}
                              {dayMenu.dessert.description && (
                                <span className="text-slate-500">
                                  {" "}
                                  - {dayMenu.dessert.description}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <div className="text-lg font-bold text-slate-900">
                            Prix: {dayMenu.price.toFixed(2)} €
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
