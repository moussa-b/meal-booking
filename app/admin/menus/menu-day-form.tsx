"use client";

import { Control, FieldPath, FieldValues } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Meal } from '@/lib/models/meal';
import { DayOfWeek } from '@/lib/models/weekly-menu';

const DAY_LABELS: Record<number, string> = {
  [DayOfWeek.MONDAY]: 'Lundi',
  [DayOfWeek.TUESDAY]: 'Mardi',
  [DayOfWeek.WEDNESDAY]: 'Mercredi',
  [DayOfWeek.THURSDAY]: 'Jeudi',
  [DayOfWeek.FRIDAY]: 'Vendredi',
  [DayOfWeek.SATURDAY]: 'Samedi',
  [DayOfWeek.SUNDAY]: 'Dimanche',
};

interface MenuDayFormProps<T extends FieldValues> {
  control: Control<T>;
  dayOfWeek: number;
  dayIndex: number;
  mainDishes: Meal[];
  appetizers: Meal[];
  desserts: Meal[];
  mainDishFieldName: FieldPath<T>;
  appetizerFieldName: FieldPath<T>;
  dessertFieldName: FieldPath<T>;
}

export function MenuDayForm<T extends FieldValues>({
  control,
  dayOfWeek,
  dayIndex,
  mainDishes,
  appetizers,
  desserts,
  mainDishFieldName,
  appetizerFieldName,
  dessertFieldName,
}: MenuDayFormProps<T>) {
  return (
    <Card className="gap-3">
      <CardHeader>
        <CardTitle className="text-base">{DAY_LABELS[dayOfWeek]}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name={mainDishFieldName}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plat principal *</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un plat principal" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {mainDishes.map((meal) => (
                    <SelectItem key={meal.id} value={meal.id.toString()}>
                      {meal.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={appetizerFieldName}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Entrée (optionnel)</FormLabel>
              <Select
                onValueChange={(value) =>
                  field.onChange(value === "none" ? null : parseInt(value))
                }
                value={field.value?.toString() || "none"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Aucune" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Aucune</SelectItem>
                  {appetizers.map((meal) => (
                    <SelectItem key={meal.id} value={meal.id.toString()}>
                      {meal.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={dessertFieldName}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dessert (optionnel)</FormLabel>
              <Select
                onValueChange={(value) =>
                  field.onChange(value === "none" ? null : parseInt(value))
                }
                value={field.value?.toString() || "none"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Aucun" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {desserts.map((meal) => (
                    <SelectItem key={meal.id} value={meal.id.toString()}>
                      {meal.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
