"use client";

import { Control, FieldPath, FieldValues } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InputGroup, InputGroupInput, InputGroupAddon, InputGroupText } from '@/components/ui/input-group';
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
  priceFieldName: FieldPath<T>;
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
  priceFieldName,
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
                  <SelectTrigger fullWidth>
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
                  <SelectTrigger fullWidth>
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
                  <SelectTrigger fullWidth>
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
        <FormField
          control={control}
          name={priceFieldName}
          render={({ field }) => {
            // Format value to show 2 decimal places when it's a number
            const formatDisplayValue = (val: string | number | undefined | null): string => {
              if (val === 0 || val === undefined || val === null || val === '') return '';
              if (typeof val === 'number') {
                return val.toFixed(2);
              }
              return val.toString();
            };

            return (
              <FormItem>
                <FormLabel>Prix *</FormLabel>
                <FormControl>
                  <InputGroup>
                    <InputGroupInput
                      type="text"
                      placeholder="0.00"
                      value={formatDisplayValue(field.value)}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value);
                      }}
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupText>€</InputGroupText>
                    </InputGroupAddon>
                  </InputGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      </CardContent>
    </Card>
  );
}
