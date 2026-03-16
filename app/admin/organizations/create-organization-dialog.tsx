"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PlusIcon } from 'lucide-react';
import { type ActionResult } from './actions';
import {
  type CreateOrganizationInput,
  createOrganizationSchema,
} from '@/lib/validations/organization.validation';
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
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { DAY_LABELS_SHORT, DEFAULT_DAYS } from '@/lib/utils/date.utils';

interface CreateOrganizationDialogProps {
  createOrganizationAction: (data: CreateOrganizationInput) => Promise<ActionResult>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateOrganizationDialog({
  createOrganizationAction,
  open,
  onOpenChange,
}: CreateOrganizationDialogProps) {
  const router = useRouter();

  const form = useForm<CreateOrganizationInput>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: "",
      type: "school",
      description: "",
      payLaterEnabled: true,
      menuDayOfWeek: DEFAULT_DAYS,
    },
  });

  const handleSubmit = async (data: CreateOrganizationInput) => {
    const result = await createOrganizationAction(data);
    if (result.success && result.data) {
      toast.success("Établissement créé avec succès");
      form.reset();
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(result.error || "Erreur lors de la création");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          Ajouter un établissement
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer un établissement</DialogTitle>
          <DialogDescription>
            Remplissez les informations pour créer un nouvel établissement. Le code sera généré automatiquement.
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
                    <Input {...field} placeholder="Nom de l'établissement" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="school">École</SelectItem>
                      <SelectItem value="company">Entreprise</SelectItem>
                    </SelectContent>
                  </Select>
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
                      placeholder="Description (optionnel)"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="payLaterEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <FormLabel>Activer le bouton « Payer plus tard »</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="menuDayOfWeek"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jours du menu</FormLabel>
                  <div className="flex flex-wrap gap-4">
                    {DEFAULT_DAYS.map((day) => {
                      const checked = field.value?.includes(day) ?? false;
                      return (
                        <div key={day} className="flex items-center space-x-2">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(isChecked) => {
                              const current = field.value ?? [];
                              const next = isChecked
                                ? Array.from(new Set([...current, day])).sort((a, b) => a - b)
                                : current.filter((d) => d !== day);
                              field.onChange(next);
                            }}
                          />
                          <span className="text-sm">{DAY_LABELS_SHORT[day]}</span>
                        </div>
                      );
                    })}
                  </div>
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
              <Button type="submit">Créer</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
