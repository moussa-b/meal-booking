"use client";

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import type { WeeklyMenu, WeeklyMenuDayInput } from '@/lib/models/weekly-menu';
import type { Meal } from '@/lib/models/meal';
import { MealType } from '@/lib/models/meal';
import type { Organization } from '@/lib/models/organization';
import { type ActionResult } from './actions';
import { type UpdateWeeklyMenuInput, updateWeeklyMenuSchema } from '@/lib/validations/weekly-menu.validation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { DEFAULT_DAYS, isMonday } from '@/lib/utils/date.utils';
import { MenuDayForm } from './menu-day-form';
import { RequiredMark } from '@/components/ui/required-mark';

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
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrganizations, setLoadingOrganizations] = useState(true);

  // Filter meals by type
  const mainDishes = meals.filter(m => m.type === MealType.MAIN_COURSE);
  const appetizers = meals.filter(m => m.type === MealType.APPETIZER);
  const desserts = meals.filter(m => m.type === MealType.DESSERT);

  // Fetch organizations
  useEffect(() => {
    async function fetchOrganizations() {
      try {
        const response = await fetch('/api/admin/organizations');
        if (response.ok) {
          const result = await response.json();
          setOrganizations(result.data || []);
        }
      } catch (error) {
        console.error('Error fetching organizations:', error);
      } finally {
        setLoadingOrganizations(false);
      }
    }

    if (open) {
      fetchOrganizations();
    }
  }, [open]);

  const form = useForm<any>({
    resolver: zodResolver(updateWeeklyMenuSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      weekStartDate: undefined,
      days: undefined,
    },
  });

  const menuDays = menu
    ? (organizations.find((o) => o.id === menu.organizationId)?.menuDayOfWeek ?? DEFAULT_DAYS)
    : DEFAULT_DAYS;

  // Reset form when menu changes
  useEffect(() => {
    if (menu && open) {
      const days = menu.days || [];
      const orgMenuDays = organizations.find((o) => o.id === menu.organizationId)?.menuDayOfWeek ?? DEFAULT_DAYS;
      form.reset({
        organizationId: menu.organizationId,
        weekStartDate: menu.weekStartDate,
        days: days.length > 0
          ? orgMenuDays.map(dayOfWeek => {
              const existing = days.find(d => d.dayOfWeek === dayOfWeek);
              return existing
                ? {
                    dayOfWeek: existing.dayOfWeek,
                    mainDishId: existing.mainDishId,
                    appetizerId: existing.appetizerId ?? null,
                    dessertId: existing.dessertId ?? null,
                    price: existing.price ?? 0.0,
                  }
                : {
                    dayOfWeek,
                    mainDishId: 0,
                    appetizerId: null,
                    dessertId: null,
                    price: '',
                  };
            })
          : orgMenuDays.map(dayOfWeek => ({
              dayOfWeek,
              mainDishId: 0,
              appetizerId: null,
              dessertId: null,
              price: '',
            })),
      });
    }
  }, [menu, open, form, organizations]);

  // Convert Date to ISO string in format "YYYY-MM-DDTHH:mm:ss.sssZ"
  // This ensures the date is sent as a string without timezone conversion issues
  const dateToISOString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00.000Z`;
  };

  const handleSubmit = async (data: any) => {
    if (!menu) return;

    // Convert Date to ISO string before sending if provided
    const dataWithStringDate = {
      ...data,
      weekStartDate: data.weekStartDate ? dateToISOString(data.weekStartDate) : undefined,
    };

    const result = await updateWeeklyMenuAction(menu.id, dataWithStringDate);
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="organizationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="gap-0.5">
                      Établissement<RequiredMark />
                    </FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString() || ""}
                      disabled={loadingOrganizations}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une établissement" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {organizations.map((organization) => (
                          <SelectItem key={organization.id} value={organization.id.toString()}>
                            {organization.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weekStartDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="gap-0.5">
                      Date de début de semaine (Lundi)<RequiredMark />
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl className="w-fit">
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
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
                          required
                          selected={field.value}
                          onSelect={(date) => {
                            if (date) {
                              field.onChange(date);
                            }
                          }}
                          disabled={isDateDisabled}
                          minDate={minDate}
                          autoFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Composition des repas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {menuDays.map((dayOfWeek, index) => {
                  const currentDays = form.watch('days') || [];
                  let dayData = currentDays.find((d: WeeklyMenuDayInput) => d.dayOfWeek === dayOfWeek);
                  if (!dayData) {
                    dayData = {
                      dayOfWeek,
                      mainDishId: 0,
                      appetizerId: null,
                      dessertId: null,
                      price: '',
                    };
                    const newDays = [...currentDays, dayData];
                    form.setValue('days', newDays);
                  }
                  const actualIndex = currentDays.findIndex((d: WeeklyMenuDayInput) => d.dayOfWeek === dayOfWeek);
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
                      priceFieldName={`days.${finalIndex}.price`}
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
