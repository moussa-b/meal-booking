"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import type { BookingFormData } from "./booking-wizard";

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

export function StepChildren() {
  const { control, watch, formState } = useFormContext<BookingFormData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "children",
  });

  const children = watch("children");

  // Check if the last child form is valid
  const isLastChildValid = () => {
    if (fields.length === 0) return false;
    const lastIndex = fields.length - 1;
    const lastChild = children[lastIndex];
    return (
      lastChild?.lastName?.trim() !== "" &&
      lastChild?.firstName?.trim() !== "" &&
      lastChild?.class?.trim() !== ""
    );
  };

  const addChild = () => {
    append({
      lastName: "",
      firstName: "",
      class: "",
      feedingRegime: "",
    });
  };

  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <Card key={field.id} className="border-2 border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-slate-700">
                Enfant {index + 1}
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
              name={`children.${index}.lastName`}
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
              name={`children.${index}.firstName`}
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
              name={`children.${index}.class`}
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
              name={`children.${index}.feedingRegime`}
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
        onClick={addChild}
        disabled={!isLastChildValid()}
        className="w-full border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50 transition-colors"
      >
        <Plus className="h-4 w-4 mr-2" />
        Ajouter un autre enfant
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
