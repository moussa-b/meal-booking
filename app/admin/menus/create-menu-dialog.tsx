"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { startOfDay } from 'date-fns';
import { CalendarIcon, PlusIcon } from 'lucide-react';
import { DayOfWeek } from '@/lib/models/weekly-menu';
import type { Meal } from '@/lib/models/meal';
import { MealType } from '@/lib/models/meal';
import { type ActionResult } from './actions';
import {
  type CreateWeeklyMenuInput,
  createWeeklyMenuSchema,
} from '@/lib/validations/weekly-menu.validation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { getMonday, isMonday } from '@/lib/utils/date.utils';
import { MenuDayForm } from './menu-day-form';

const DEFAULT_DAYS = [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY];

interface CreateMenuDialogProps {
  meals: Meal[];
  createWeeklyMenuAction: (data: CreateWeeklyMenuInput) => Promise<ActionResult>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateMenuDialog({
  meals,
  createWeeklyMenuAction,
  open,
  onOpenChange,
}: CreateMenuDialogProps) {
  const router = useRouter();

  // Filter meals by type
  const mainDishes = meals.filter(m => m.type === MealType.MAIN_COURSE);
  const appetizers = meals.filter(m => m.type === MealType.APPETIZER);
  const desserts = meals.filter(m => m.type === MealType.DESSERT);

  // Get next Monday as default
  const getDefaultMonday = () => {
    const monday = getMonday(new Date());
    if (monday <= new Date()) {
      monday.setDate(monday.getDate() + 7);
    }
    return monday;
  };

  const form = useForm<CreateWeeklyMenuInput>({
    resolver: zodResolver(createWeeklyMenuSchema),
    defaultValues: {
      weekStartDate: getDefaultMonday(),
      days: DEFAULT_DAYS.map(dayOfWeek => ({
        dayOfWeek,
        mainDishId: 0,
        appetizerId: null,
        dessertId: null,
        price: 0.0,
      })),
    },
  });

  const handleSubmit = async (data: CreateWeeklyMenuInput) => {
    const result = await createWeeklyMenuAction(data);
    if (result.success && result.data) {
      toast.success("Menu créé avec succès");
      form.reset({
        weekStartDate: getDefaultMonday(),
        days: DEFAULT_DAYS.map(dayOfWeek => ({
          dayOfWeek,
          mainDishId: 0,
          appetizerId: null,
          dessertId: null,
          price: 0.0,
        })),
      });
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(result.error || "Erreur lors de la création");
    }
  };

  // Disable dates that are not Mondays
  const isDateDisabled = (date: Date) => {
    return !isMonday(date);
  };

  // Set minimum date to today
  const minDate = startOfDay(new Date());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          Ajouter un menu
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[50vw] md:w-[50vw] max-h-[90vh] overflow-y-auto max-w-none" customWidth={true} showCloseButton={true}>
        <DialogHeader>
          <DialogTitle>Créer un menu</DialogTitle>
          <DialogDescription>
            Remplissez les informations pour créer un nouveau menu hebdomadaire.
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
                {DEFAULT_DAYS.map((dayOfWeek, index) => (
                  <MenuDayForm
                    key={dayOfWeek}
                    control={form.control}
                    dayOfWeek={dayOfWeek}
                    dayIndex={index}
                    mainDishes={mainDishes}
                    appetizers={appetizers}
                    desserts={desserts}
                    mainDishFieldName={`days.${index}.mainDishId`}
                    appetizerFieldName={`days.${index}.appetizerId`}
                    dessertFieldName={`days.${index}.dessertId`}
                    priceFieldName={`days.${index}.price`}
                  />
                ))}
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
              <Button type="submit">Créer</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
