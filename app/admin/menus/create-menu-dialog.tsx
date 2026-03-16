"use client";

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon, PlusIcon } from 'lucide-react';
import { DEFAULT_DAYS, getMonday, isMonday } from '@/lib/utils/date.utils';
import type { Meal } from '@/lib/models/meal';
import { MealType } from '@/lib/models/meal';
import type { Organization } from '@/lib/models/organization';
import { type ActionResult } from './actions';
import { type CreateWeeklyMenuInput, createWeeklyMenuSchema, } from '@/lib/validations/weekly-menu.validation';
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
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { MenuDayForm } from './menu-day-form';

interface CreateMenuDialogProps {
  meals: Meal[];
  createWeeklyMenuAction: (data: CreateWeeklyMenuInput) => Promise<ActionResult>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: Partial<CreateWeeklyMenuInput> | null;
}

export function CreateMenuDialog({
  meals,
  createWeeklyMenuAction,
  open,
  onOpenChange,
  initialValues,
}: CreateMenuDialogProps) {
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

  // Get next Monday as default
  const getDefaultMonday = () => {
    const monday = getMonday(new Date());
    if (monday <= new Date()) {
      monday.setDate(monday.getDate() + 7);
    }
    return monday;
  };

  const getMenuDaysForOrganization = (orgId: number | undefined) =>
    organizations.find((o) => o.id === orgId)?.menuDayOfWeek ?? DEFAULT_DAYS;

  const form = useForm<any>({
    resolver: zodResolver(createWeeklyMenuSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      organizationId: undefined,
      weekStartDate: getDefaultMonday(),
      days: DEFAULT_DAYS.map(dayOfWeek => ({
        dayOfWeek,
        mainDishId: 0,
        appetizerId: null,
        dessertId: null,
        price: '',
      })),
    },
  });

  const organizationId = form.watch('organizationId');
  const menuDays = getMenuDaysForOrganization(organizationId);

  // When dialog opens, initialize or reset the form with either provided initial values (for duplication)
  // or the default blank state.
  useEffect(() => {
    if (!open) {
      return;
    }

    if (initialValues) {
      const daysForOrg = getMenuDaysForOrganization(initialValues.organizationId);
      form.reset({
        organizationId: initialValues.organizationId ?? undefined,
        weekStartDate: initialValues.weekStartDate ?? getDefaultMonday(),
        days:
          initialValues.days && initialValues.days.length > 0
            ? initialValues.days
            : daysForOrg.map(dayOfWeek => ({
                dayOfWeek,
                mainDishId: 0,
                appetizerId: null,
                dessertId: null,
                price: '',
              })),
      });
    } else {
      form.reset({
        organizationId: undefined,
        weekStartDate: getDefaultMonday(),
        days: DEFAULT_DAYS.map(dayOfWeek => ({
          dayOfWeek,
          mainDishId: 0,
          appetizerId: null,
          dessertId: null,
          price: '',
        })),
      });
    }
  }, [open, initialValues, form]);

  // Convert Date to ISO string in format "YYYY-MM-DDTHH:mm:ss.sssZ"
  // This ensures the date is sent as a string without timezone conversion issues
  const dateToISOString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00.000Z`;
  };

  const handleSubmit = async (data: any) => {
    // Convert Date to ISO string before sending
    const dataWithStringDate = {
      ...data,
      weekStartDate: dateToISOString(data.weekStartDate),
    };

    const result = await createWeeklyMenuAction(dataWithStringDate);
    if (result.success && result.data) {
      toast.success("Menu créé avec succès");
      form.reset({
        organizationId: undefined,
        weekStartDate: getDefaultMonday(),
        days: DEFAULT_DAYS.map(dayOfWeek => ({
          dayOfWeek,
          mainDishId: 0,
          appetizerId: null,
          dessertId: null,
          price: '',
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="organizationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Établissement</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        const id = parseInt(value);
                        field.onChange(id);
                        const days = getMenuDaysForOrganization(id).map(dayOfWeek => ({
                          dayOfWeek,
                          mainDishId: 0,
                          appetizerId: null,
                          dessertId: null,
                          price: '',
                        }));
                        form.setValue('days', days);
                      }}
                      value={field.value?.toString() || ""}
                      disabled={loadingOrganizations}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un établissement" />
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
                    <FormLabel>Date de début de semaine (Lundi)</FormLabel>
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
                            <CalendarIcon className="h-4 w-4 opacity-50" />
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
                {menuDays.map((dayOfWeek, index) => (
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
