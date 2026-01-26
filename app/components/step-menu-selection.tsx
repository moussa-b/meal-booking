"use client";

import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import type { BookingFormData } from './booking-wizard';
import { useEffect, useState } from 'react';
import type { WeeklyMenu, WeeklyMenuDay } from '@/lib/models/weekly-menu';
import { DAY_KEYS, DAY_NAMES } from '@/lib/utils/date.utils';

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
  const students = watch("students");
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

  // Initialize menu selections for all students if not already set
  useEffect(() => {
    const selections = { ...menuSelections };
    let needsUpdate = false;

    students.forEach((student, index) => {
      const studentKey = `${student.firstName}-${student.lastName}-${index}`;
      if (!selections[studentKey] || !Array.isArray(selections[studentKey])) {
        selections[studentKey] = [];
        needsUpdate = true;
      }
    });

    if (needsUpdate) {
      setValue("menuSelections", selections);
    }
  }, [students, menuSelections, setValue]);

  const handleDayChange = (
    studentKey: string,
    weeklyMenuDayId: number,
    checked: boolean
  ) => {
    const currentSelection = menuSelections[studentKey] || [];
    const newSelection = checked
      ? [...currentSelection, weeklyMenuDayId]
      : currentSelection.filter((id) => id !== weeklyMenuDayId);
    setValue(`menuSelections.${studentKey}`, newSelection);
  };

  const handleSelectAll = (studentKey: string, checked: boolean) => {
    if (!weeklyMenu || !weeklyMenu.days) return;

    const menuDays = weeklyMenu.days.filter(
      (day) => DAY_KEYS[day.dayOfWeek] !== null
    );

    if (checked) {
      const allIds = menuDays.map((day) => day.id);
      setValue(`menuSelections.${studentKey}`, allIds);
    } else {
      setValue(`menuSelections.${studentKey}`, []);
    }
  };

  const isAllSelected = (studentKey: string) => {
    if (!weeklyMenu || !weeklyMenu.days) return false;
    const selection = menuSelections[studentKey] || [];
    if (!Array.isArray(selection)) return false;

    const menuDays = weeklyMenu.days.filter(
      (day) => DAY_KEYS[day.dayOfWeek] !== null
    );
    return menuDays.every((day) => selection.includes(day.id));
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
      {students.map((student, index) => {
        const studentKey = `${student.firstName}-${student.lastName}-${index}`;
        const selection = menuSelections[studentKey] || [];
        const selectedIds = Array.isArray(selection) ? selection : [];

        return (
          <Card
            key={studentKey}
            className="border-2 border-blue-200 bg-blue-50/30 pt-0 gap-1"
          >
            <CardHeader className="bg-blue-100/50 gap-1 rounded-t-xl">
              <CardTitle className="text-lg font-semibold text-blue-900 text-center pt-2">
                Menu pour {student.firstName} {student.lastName}
              </CardTitle>
              {student.feedingRegime && (
                <p className="text-sm text-blue-700 my-1 text-center">
                  Régime alimentaire: {student.feedingRegime}
                </p>
              )}
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Select All Option */}
              <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border-2 border-blue-300">
                <Checkbox
                  id={`${studentKey}-select-all`}
                  checked={isAllSelected(studentKey)}
                  onCheckedChange={(checked) =>
                    handleSelectAll(studentKey, checked as boolean)
                  }
                />
                <Label
                  htmlFor={`${studentKey}-select-all`}
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
                            id={`${studentKey}-${dayMenu.id}`}
                            checked={selectedIds.includes(dayMenu.id)}
                            onCheckedChange={(checked) =>
                              handleDayChange(
                                studentKey,
                                dayMenu.id,
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
