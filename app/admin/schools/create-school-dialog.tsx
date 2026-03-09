"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PlusIcon } from 'lucide-react';
import { type ActionResult } from './actions';
import {
  type CreateSchoolInput,
  createSchoolSchema,
} from '@/lib/validations/school.validation';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface CreateSchoolDialogProps {
  createSchoolAction: (data: CreateSchoolInput) => Promise<ActionResult>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateSchoolDialog({
  createSchoolAction,
  open,
  onOpenChange,
}: CreateSchoolDialogProps) {
  const router = useRouter();

  const form = useForm<CreateSchoolInput>({
    resolver: zodResolver(createSchoolSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const handleSubmit = async (data: CreateSchoolInput) => {
    const result = await createSchoolAction(data);
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
              <Button type="submit">Créer</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
