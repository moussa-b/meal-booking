"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { weeklyMenu } from "@/lib/mock-menu-data";
import type { BookingFormData } from "./booking-wizard";
import { useEffect } from "react";

const DAYS = ["lundi", "mardi", "jeudi", "vendredi"] as const;

export function StepMenuSelection() {
  const { watch, setValue } = useFormContext<BookingFormData>();
  const children = watch("children");
  const menuSelections = watch("menuSelections");

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
            <CardHeader className="bg-blue-100/50">
              <CardTitle className="text-lg font-semibold text-blue-900 text-center pt-2">
                Menu pour {child.firstName} {child.lastName}
              </CardTitle>
              {child.feedingRegime && (
                <p className="text-sm text-blue-700 mt-1">
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
                {weeklyMenu.map((dayMenu) => {
                  const dayKey = dayMenu.jour.toLowerCase() as (typeof DAYS)[number];

                  return (
                    <Card
                      key={dayMenu.jour}
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
                              {dayMenu.jour}
                            </div>
                            <div className="text-sm text-slate-500">
                              {dayMenu.date}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 px-4 pb-4">
                        <div className="space-y-1 text-sm">
                          <div className="text-slate-700">
                            <span className="font-medium">Plat:</span>{" "}
                            {dayMenu.menu.plat}
                          </div>
                          <div className="text-slate-700">
                            <span className="font-medium">
                              Accompagnement:
                            </span>{" "}
                            {dayMenu.menu.accompagnement}
                          </div>
                          <div className="text-slate-700">
                            <span className="font-medium">Dessert:</span>{" "}
                            {dayMenu.menu.dessert}
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
