"use client";

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { startOfDay } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import type { WeeklyMenu } from '@/lib/models/weekly-menu';
import { DayOfWeek } from '@/lib/models/weekly-menu';
import type { Meal } from '@/lib/models/meal';
import { MealType } from '@/lib/models/meal';
import { type ActionResult } from './actions';
import {
  type UpdateWeeklyMenuInput,
  updateWeeklyMenuSchema,
} from '@/lib/validations/weekly-menu.validation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { isMonday } from '@/lib/utils/date.utils';
import { MenuDayForm } from './menu-day-form';

const DEFAULT_DAYS = [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY];

interface EditMenuDialogProps {
  menu: WeeklyMenu | null;
  meals: Meal[];
  updateWeeklyMenuAction: (
    id: number,
    data: UpdateWeeklyMenuInput
  ) => Promise<ActionResult>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditMenuDialog({
  menu,
  meals,
  updateWeeklyMenuAction,
  open,
  onOpenChange,
}: EditMenuDialogProps) {
  const router = useRouter();

  // Filter meals by type
  const mainDishes = meals.filter(m => m.type === MealType.MAIN_COURSE);
  const appetizers = meals.filter(m => m.type === MealType.APPETIZER);
  const desserts = meals.filter(m => m.type === MealType.DESSERT);

  const form = useForm<UpdateWeeklyMenuInput>({
    resolver: zodResolver(updateWeeklyMenuSchema),
    defaultValues: {
      weekStartDate: undefined,
      days: undefined,
    },
  });

  // Reset form when menu changes
  useEffect(() => {
    if (menu && open) {
      const days = menu.days || [];
      form.reset({
        weekStartDate: menu.weekStartDate,
        days: days.length > 0 ? days.map(day => ({
          dayOfWeek: day.dayOfWeek,
          mainDishId: day.mainDishId,
          appetizerId: day.appetizerId ?? null,
          dessertId: day.dessertId ?? null,
        })) : DEFAULT_DAYS.map(dayOfWeek => ({
          dayOfWeek,
          mainDishId: 0,
          appetizerId: null,
          dessertId: null,
        })),
      });
    }
  }, [menu, open, form]);

  const handleSubmit = async (data: UpdateWeeklyMenuInput) => {
    if (!menu) return;

    const result = await updateWeeklyMenuAction(menu.id, data);
    if (result.success && result.data) {
      toast.success("Menu modifié avec succès");
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(result.error || "Erreur lors de la modification");
    }
  };

  // Disable dates that are not Mondays
  const isDateDisabled = (date: Date) => {
    return !isMonday(date);
  };

  // Set minimum date to today
  const minDate = startOfDay(new Date());

  if (!menu) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[50vw] md:w-[50vw] max-h-[90vh] overflow-y-auto max-w-none" customWidth={true} showCloseButton={true}>
        <DialogHeader>
          <DialogTitle>Modifier le menu</DialogTitle>
          <DialogDescription>
            Modifiez les informations du menu hebdomadaire.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="weekStartDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date de début de semaine (Lundi)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: fr })
                          ) : (
                            <span>Sélectionner une date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={isDateDisabled}
                        minDate={minDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Composition des repas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DEFAULT_DAYS.map((dayOfWeek, index) => {
                  const currentDays = form.watch('days') || [];
                  // Find or create day data
                  let dayData = currentDays.find(d => d.dayOfWeek === dayOfWeek);
                  if (!dayData) {
                    dayData = {
                      dayOfWeek,
                      mainDishId: 0,
                      appetizerId: null,
                      dessertId: null,
                    };
                    const newDays = [...currentDays, dayData];
                    form.setValue('days', newDays);
                  }
                  const actualIndex = currentDays.findIndex(d => d.dayOfWeek === dayOfWeek);
                  const finalIndex = actualIndex >= 0 ? actualIndex : currentDays.length;

                  return (
                    <MenuDayForm
                      key={dayOfWeek}
                      control={form.control}
                      dayOfWeek={dayOfWeek}
                      dayIndex={finalIndex}
                      mainDishes={mainDishes}
                      appetizers={appetizers}
                      desserts={desserts}
                      mainDishFieldName={`days.${finalIndex}.mainDishId`}
                      appetizerFieldName={`days.${finalIndex}.appetizerId`}
                      dessertFieldName={`days.${finalIndex}.dessertId`}
                    />
                  );
                })}
              </div>
            </div>

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
