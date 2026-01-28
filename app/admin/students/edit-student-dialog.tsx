'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { Student } from '@/lib/models/student';
import { type ActionResult } from './actions';
import { type UpdateStudentInput, updateStudentSchema, } from '@/lib/validations/student.validation';
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

interface EditStudentDialogProps {
  student: Student | null;
  updateStudentAction: (id: number, data: UpdateStudentInput) => Promise<ActionResult>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditStudentDialog({student, updateStudentAction, open, onOpenChange,}: EditStudentDialogProps) {
  const router = useRouter();

  const form = useForm<UpdateStudentInput>({
    resolver: zodResolver(updateStudentSchema),
    defaultValues: {
      lastName: '',
      firstName: '',
      class: '',
      feedingRegime: '',
      parentEmail: '',
    },
  });

  // Reset form when student changes
  useEffect(() => {
    if (student && open) {
      form.reset({
        lastName: student.lastName,
        firstName: student.firstName,
        class: student.class,
        feedingRegime: student.feedingRegime || '',
        parentEmail: student.parentEmail || '',
      });
    }
  }, [student, open, form]);

  const handleSubmit = async (data: UpdateStudentInput) => {
    if (!student) return;

    const result = await updateStudentAction(student.id, data);
    if (result.success && result.data) {
      toast.success('Élève modifié avec succès');
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(result.error || 'Erreur lors de la modification');
    }
  };

  if (!student) return null;

  return (
    <Dialog open={open}
            onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier l&apos;élève</DialogTitle>
          <DialogDescription>
            Modifiez les informations de l&apos;élève.
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
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nom de l'élève"/>
                  </FormControl>
                  <FormMessage/>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="firstName"
              render={({field}) => (
                <FormItem>
                  <FormLabel>Prénom</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Prénom de l'élève"/>
                  </FormControl>
                  <FormMessage/>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="class"
              render={({field}) => (
                <FormItem>
                  <FormLabel>Classe</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Classe"/>
                  </FormControl>
                  <FormMessage/>
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
                  <FormMessage/>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="parentEmail"
              render={({field}) => (
                <FormItem>
                  <FormLabel>Email du parent</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      value={field.value || ''}
                      placeholder="Email du parent (optionnel)"
                    />
                  </FormControl>
                  <FormMessage/>
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
