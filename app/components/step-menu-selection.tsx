"use client";

import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import type { BookingFormData } from './booking-wizard';
import { useEffect } from 'react';
import type { WeeklyMenu, WeeklyMenuDay } from '@/lib/models/weekly-menu';
import { DAY_LABELS } from '@/lib/utils/date.utils';

// Format date to French format
function formatDateFrench(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

type StepMenuSelectionProps = {
  weeklyMenu: WeeklyMenu | null;
  isLoading: boolean;
};

export function StepMenuSelection({ weeklyMenu, isLoading }: StepMenuSelectionProps) {
  const { watch, setValue } = useFormContext<BookingFormData>();
  const mealParticipants = watch("mealParticipants");
  const menuSelections = watch("menuSelections");

  // Initialize menu selections for all meal participants if not already set
  useEffect(() => {
    const selections = { ...menuSelections };
    let needsUpdate = false;

    mealParticipants.forEach((mealParticipant, index) => {
      const mealParticipantKey = `${mealParticipant.firstName}-${mealParticipant.lastName}-${index}`;
      if (!selections[mealParticipantKey] || !Array.isArray(selections[mealParticipantKey])) {
        selections[mealParticipantKey] = [];
        needsUpdate = true;
      }
    });

    if (needsUpdate) {
      setValue("menuSelections", selections);
    }
  }, [mealParticipants, menuSelections, setValue]);

  const handleDayChange = (
    mealParticipantKey: string,
    weeklyMenuDayId: number,
    checked: boolean
  ) => {
    const currentSelection = menuSelections[mealParticipantKey] || [];
    const newSelection = checked
      ? [...currentSelection, weeklyMenuDayId]
      : currentSelection.filter((id) => id !== weeklyMenuDayId);
    setValue(`menuSelections.${mealParticipantKey}`, newSelection);
  };

  const handleSelectAll = (mealParticipantKey: string, checked: boolean) => {
    if (!weeklyMenu || !weeklyMenu.days) return;

    if (checked) {
      const allIds = weeklyMenu.days.map((day) => day.id);
      setValue(`menuSelections.${mealParticipantKey}`, allIds);
    } else {
      setValue(`menuSelections.${mealParticipantKey}`, []);
    }
  };

  const isAllSelected = (mealParticipantKey: string) => {
    if (!weeklyMenu || !weeklyMenu.days) return false;
    const selection = menuSelections[mealParticipantKey] || [];
    if (!Array.isArray(selection)) return false;

    return weeklyMenu.days.every((day) => selection.includes(day.id));
  };

  // All menu days for the organization (already constrained by organization.menuDayOfWeek)
  const menuDays = weeklyMenu?.days || [];

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
      {mealParticipants.map((mealParticipant, index) => {
        const mealParticipantKey = `${mealParticipant.firstName}-${mealParticipant.lastName}-${index}`;
        const selection = menuSelections[mealParticipantKey] || [];
        const selectedIds = Array.isArray(selection) ? selection : [];

        return (
          <Card
            key={mealParticipantKey}
            className="border-2 border-blue-200 bg-blue-50/30 pt-0 gap-1"
          >
            <CardHeader className="bg-blue-100/50 gap-1 rounded-t-xl">
              <CardTitle className="text-lg font-semibold text-blue-900 text-center pt-2">
                Menu pour {mealParticipant.firstName} {mealParticipant.lastName}
              </CardTitle>
              {mealParticipant.feedingRegime && (
                <p className="text-sm text-blue-700 my-1 text-center">
                  Régime alimentaire: {mealParticipant.feedingRegime}
                </p>
              )}
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Select All Option */}
              <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border-2 border-blue-300">
                <Checkbox
                  id={`${mealParticipantKey}-select-all`}
                  checked={isAllSelected(mealParticipantKey)}
                  onCheckedChange={(checked) =>
                    handleSelectAll(mealParticipantKey, checked as boolean)
                  }
                />
                <Label
                  htmlFor={`${mealParticipantKey}-select-all`}
                  className="text-base font-semibold cursor-pointer flex-1"
                >
                  Sélectionner tous les jours
                </Label>
              </div>

              <Separator />

              {/* Individual Days */}
              <div className="grid gap-3">
                {menuDays.map((dayMenu: WeeklyMenuDay) => {
                  const dayName = DAY_LABELS[dayMenu.dayOfWeek];
                  const dayDate = getDayDate(dayMenu.dayOfWeek);

                  return (
                    <Card
                      key={dayMenu.id}
                      className="border border-slate-200 bg-white hover:shadow-md transition-shadow gap-1"
                    >
                      <CardHeader className="p-4 pb-3 pt-0">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id={`${mealParticipantKey}-${dayMenu.id}`}
                            checked={selectedIds.includes(dayMenu.id)}
                            onCheckedChange={(checked) =>
                              handleDayChange(
                                mealParticipantKey,
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
