"use client";

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { Meal } from '@/lib/models/meal';
import { MealType } from '@/lib/models/meal';
import { type ActionResult } from './actions';
import {
  type UpdateMealInput,
  updateMealSchema,
} from '@/lib/validations/meal.validation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EditMealDialogProps {
  meal: Meal | null;
  updateMealAction: (
    id: number,
    data: UpdateMealInput
  ) => Promise<ActionResult>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditMealDialog({
  meal,
  updateMealAction,
  open,
  onOpenChange,
}: EditMealDialogProps) {
  const router = useRouter();

  const form = useForm<UpdateMealInput>({
    resolver: zodResolver(updateMealSchema),
    defaultValues: {
      name: "",
      type: MealType.MAIN_COURSE,
      description: "",
    },
  });

  // Reset form when meal changes
  useEffect(() => {
    if (meal && open) {
      form.reset({
        name: meal.name,
        type: meal.type,
        description: meal.description,
      });
    }
  }, [meal, open, form]);

  const handleSubmit = async (data: UpdateMealInput) => {
    if (!meal) return;

    const result = await updateMealAction(meal.id, data);
    if (result.success && result.data) {
      toast.success("Repas modifié avec succès");
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(result.error || "Erreur lors de la modification");
    }
  };

  if (!meal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier le repas</DialogTitle>
          <DialogDescription>
            Modifiez les informations du repas.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nom du repas" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={MealType.APPETIZER}>
                        Entrée
                      </SelectItem>
                      <SelectItem value={MealType.MAIN_COURSE}>
                        Plat principal
                      </SelectItem>
                      <SelectItem value={MealType.DESSERT}>
                        Dessert
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Description du repas"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button type="submit">Enregistrer</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
