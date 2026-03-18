'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { MealParticipant } from '@/lib/models/meal-participant';
import { type ActionResult } from './actions';
import { type UpdateMealParticipantInput, updateMealParticipantSchema, } from '@/lib/validations/meal-participant.validation';
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
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RequiredMark } from '@/components/ui/required-mark';

interface EditMealParticipantDialogProps {
  mealParticipant: MealParticipant | null;
  updateMealParticipantAction: (id: number, data: UpdateMealParticipantInput) => Promise<ActionResult>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditMealParticipantDialog({mealParticipant, updateMealParticipantAction, open, onOpenChange,}: EditMealParticipantDialogProps) {
  const router = useRouter();

  const form = useForm<UpdateMealParticipantInput>({
    resolver: zodResolver(updateMealParticipantSchema),
    defaultValues: {
      lastName: '',
      firstName: '',
      class: '',
      feedingRegime: '',
      type: 'school',
      email: '',
    },
  });

  // Reset form when mealParticipant changes
  useEffect(() => {
    if (mealParticipant && open) {
      form.reset({
        lastName: mealParticipant.lastName,
        firstName: mealParticipant.firstName,
        class: mealParticipant.class,
        type: mealParticipant.type,
        feedingRegime: mealParticipant.feedingRegime || '',
        email: mealParticipant.email || '',
      });
    }
  }, [mealParticipant, open, form]);

  const handleSubmit = async (data: UpdateMealParticipantInput) => {
    if (!mealParticipant) return;

    const result = await updateMealParticipantAction(mealParticipant.id, data);
    if (result.success && result.data) {
      toast.success('Participant modifié avec succès');
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(result.error || 'Erreur lors de la modification');
    }
  };

  if (!mealParticipant) return null;

  return (
    <Dialog open={open}
            onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier le participant</DialogTitle>
          <DialogDescription>
            Modifiez les informations du participant.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="lastName"
              render={({field}) => (
                <FormItem>
                  <FormLabel className="gap-0.5">
                    Nom<RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nom du participant"/>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="firstName"
              render={({field}) => (
                <FormItem>
                  <FormLabel className="gap-0.5">
                    Prénom<RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Prénom du participant"/>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="class"
              render={({field}) => (
                <FormItem>
                  <FormLabel className="gap-0.5">
                    Classe<RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Classe"/>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({field}) => (
                <FormItem>
                  <FormLabel className="gap-0.5">
                    Type<RequiredMark />
                  </FormLabel>
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
              name="feedingRegime"
              render={({field}) => (
                <FormItem>
                  <FormLabel>Régime alimentaire</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ''}
                      placeholder="Régime alimentaire (optionnel)"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({field}) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      value={field.value || ''}
                      placeholder="Email (optionnel)"
                    />
                  </FormControl>
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
