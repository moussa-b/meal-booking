"use client";

import { useEffect, useRef } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import type { BookingFormData } from './booking-wizard';

const CLASSES = [
  "Petite Section",
  "Moyenne Section",
  "Grande Section",
  "CP",
  "CE1",
  "CE2",
  "CM1",
  "CM2",
  "6ème",
  "5ème",
  "4ème",
  "3ème",
];

// True if no meal participants or all fields empty (don’t overwrite user input).
function isMealParticipantsEmpty(mealParticipants: BookingFormData['mealParticipants']): boolean {
  if (!mealParticipants?.length) return true;
  return mealParticipants.every(
    (s) =>
      !s.lastName?.trim() && !s.firstName?.trim() && !s.class?.trim()
  );
}

export function StepChildren() {
  const { control, watch, setValue } = useFormContext<BookingFormData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "mealParticipants",
  });
  const email = watch('email');
  const mealParticipants = watch("mealParticipants");
  // Email we already prefilled for; ref avoids re-fetch on re-render.
  const prefilledForEmail = useRef<string | null>(null);

  // On mount/email change: fetch meal participants by email and prefill when form is empty.
  useEffect(() => {
    if (!email?.trim()) return;

    const trimmedEmail = email.trim();
    if (prefilledForEmail.current === trimmedEmail) return; // Already did this email.
    if (!isMealParticipantsEmpty(mealParticipants)) return; // User already filled; don’t overwrite.

    let cancelled = false;

    async function fetchAndPrefill() {
      try {
        const response = await fetch(`/api/public/meal-participants?parentEmail=${encodeURIComponent(trimmedEmail)}`);
        if (!response.ok || cancelled) return;
        const result = await response.json();
        const fetched = result.data ?? [];
        if (cancelled) return;

        prefilledForEmail.current = trimmedEmail; // Mark so we don’t fetch again.
        if (fetched.length > 0 && !cancelled) {
          const formMealParticipants = fetched.map(
            (s: { lastName: string; firstName: string; class: string; type: 'school' | 'company'; feedingRegime?: string | null }) => ({
              lastName: s.lastName ?? '',
              firstName: s.firstName ?? '',
              class: s.class ?? '',
              feedingRegime: s.feedingRegime ?? '',
              type: s.type ?? 'school',
            })
          );
          setValue('mealParticipants', formMealParticipants, {shouldDirty: true});
        }
      } catch {
        // ignore; leave form as-is
      }
    }

    fetchAndPrefill();
    return () => {
      cancelled = true; // Ignore result if effect re-runs or unmounts.
    };
  }, [email, setValue, mealParticipants]);

  // Last row must have lastName, firstName, class before "Add another" works.
  const isLastStudentValid = () => {
    if (fields.length === 0) return false;
    const lastIndex = fields.length - 1;
    const lastMealParticipant = mealParticipants[lastIndex];
    return (
      lastMealParticipant?.lastName?.trim() !== "" &&
      lastMealParticipant?.firstName?.trim() !== "" &&
      lastMealParticipant?.class?.trim() !== ""
    );
  };

  const addMealParticipant = () => {
    append({
      lastName: "",
      firstName: "",
      class: "",
      feedingRegime: "",
      type: mealParticipants[0]?.type ?? "school",
    });
  };

  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <Card key={field.id} className="border-2 border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-slate-700">
                Élève {index + 1}
              </CardTitle>
              {index > 0 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => remove(index)}
                  className="h-8 px-3"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Supprimer
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={control}
              name={`mealParticipants.${index}.lastName`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de famille</FormLabel>
                  <FormControl>
                    <Input placeholder="Dupont" {...field} className="w-full" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`mealParticipants.${index}.firstName`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prénom</FormLabel>
                  <FormControl>
                    <Input placeholder="Marie" {...field} className="w-full" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`mealParticipants.${index}.class`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Classe</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sélectionnez une classe" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CLASSES.map((classe) => (
                        <SelectItem key={classe} value={classe}>
                          {classe}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`mealParticipants.${index}.feedingRegime`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Régime alimentaire{" "}
                    <span className="text-slate-400 text-sm">(optionnel)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: végétarien, allergies..."
                      {...field}
                      className="w-full"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      ))}

      <Separator className="my-6" />

      <Button
        type="button"
        variant="outline"
        onClick={addMealParticipant}
        disabled={!isLastStudentValid()}
        className="w-full border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50 transition-colors"
      >
        <Plus className="h-4 w-4 mr-2" />
        Ajouter un autre élève
      </Button>

      <div className="mt-6 pt-4">
        <FormField
          control={control}
          name="saveChildrenInfo"
          render={({ field }) => (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="saveChildrenInfo"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
              <Label
                htmlFor="saveChildrenInfo"
                className="text-sm font-normal cursor-pointer text-slate-700"
              >
                Enregistrer ces informations pour les prochaines réservations
              </Label>
            </div>
          )}
        />
      </div>
    </div>
  );
}
