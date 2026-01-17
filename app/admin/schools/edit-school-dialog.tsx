"use client";

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { School } from '@/lib/models/school';
import { type ActionResult } from './actions';
import {
  type UpdateSchoolInput,
  updateSchoolSchema,
} from '@/lib/validations/school.validation';
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

interface EditSchoolDialogProps {
  school: School | null;
  updateSchoolAction: (
    id: number,
    data: UpdateSchoolInput
  ) => Promise<ActionResult>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditSchoolDialog({
  school,
  updateSchoolAction,
  open,
  onOpenChange,
}: EditSchoolDialogProps) {
  const router = useRouter();

  const form = useForm<UpdateSchoolInput>({
    resolver: zodResolver(updateSchoolSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Reset form when school changes
  useEffect(() => {
    if (school && open) {
      form.reset({
        name: school.name,
        description: school.description,
      });
    }
  }, [school, open, form]);

  const handleSubmit = async (data: UpdateSchoolInput) => {
    if (!school) return;

    const result = await updateSchoolAction(school.id, data);
    if (result.success && result.data) {
      toast.success("École modifiée avec succès");
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(result.error || "Erreur lors de la modification");
    }
  };

  if (!school) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier l&apos;établissement</DialogTitle>
          <DialogDescription>
            Modifiez les informations de l&apos;établissement scolaire. Le code ne peut pas être modifié.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium">Code</label>
              <Input
                value={school.code}
                disabled
                readOnly
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Le code est généré automatiquement et ne peut pas être modifié
              </p>
            </div>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nom de l'établissement" />
                  </FormControl>
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
                      placeholder="Description (optionnel)"
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
