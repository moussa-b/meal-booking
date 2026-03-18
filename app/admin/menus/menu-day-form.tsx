"use client";

import { Control, FieldPath, FieldValues } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group';
import { RequiredMark } from '@/components/ui/required-mark';
import type { Meal } from '@/lib/models/meal';
import { DAY_LABELS } from '@/lib/utils/date.utils';

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
              <FormLabel className="gap-0.5">
                Plat principal<RequiredMark />
              </FormLabel>
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
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={priceFieldName}
          render={({ field }) => {
            // Format value to show 2 decimal places when it's a number
            const formatDisplayValue = (val: string | number | undefined | null): string => {
              if (val === undefined || val === null || val === '') return '';
              if (typeof val === 'number') {
                return val.toFixed(2);
              }
              return val.toString();
            };

            return (
              <FormItem>
                <FormLabel className="gap-0.5">
                  Prix<RequiredMark />
                </FormLabel>
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
              </FormItem>
            );
          }}
        />
      </CardContent>
    </Card>
  );
}
