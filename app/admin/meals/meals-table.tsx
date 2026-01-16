"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { PencilIcon, PlusIcon, TrashIcon } from 'lucide-react';
import type { Meal } from '@/lib/models/meal';
import { MealType } from '@/lib/models/meal';
import { type ActionResult, } from './actions';
import {
  type CreateMealInput,
  createMealSchema,
  type UpdateMealInput,
  updateMealSchema,
} from '@/lib/validations/meal.validation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';

interface MealsTableProps {
  meals: Meal[];
  createMealAction: (data: CreateMealInput) => Promise<ActionResult<Meal>>;
  updateMealAction: (
    id: number,
    data: UpdateMealInput
  ) => Promise<ActionResult<Meal>>;
  deleteMealAction: (id: number) => Promise<ActionResult<void>>;
  error?: string | null;
}

export function MealsTable({
  meals: initialMeals,
  createMealAction,
  updateMealAction,
  deleteMealAction,
  error,
}: MealsTableProps) {
  const router = useRouter();
  const [meals, setMeals] = useState(initialMeals);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Create form
  const createForm = useForm<CreateMealInput>({
    resolver: zodResolver(createMealSchema),
    defaultValues: {
      name: "",
      type: MealType.MAIN_COURSE,
      description: "",
    },
  });

  // Edit form
  const editForm = useForm<UpdateMealInput>({
    resolver: zodResolver(updateMealSchema),
    defaultValues: {
      name: "",
      type: MealType.MAIN_COURSE,
      description: "",
    },
  });

  // Update meals when initialMeals changes (after revalidation)
  useEffect(() => {
    setMeals(initialMeals);
  }, [initialMeals]);

  // Handle create
  const handleCreateSubmit = async (data: CreateMealInput) => {
    const result = await createMealAction(data);
    if (result.success && result.data) {
      toast.success("Repas créé avec succès");
      createForm.reset();
      setIsCreateDialogOpen(false);
      router.refresh();
    } else {
      toast.error(result.error || "Erreur lors de la création");
    }
  };

  // Handle edit
  const handleEditClick = (meal: Meal) => {
    setSelectedMeal(meal);
    editForm.reset({
      name: meal.name,
      type: meal.type,
      description: meal.description,
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (data: UpdateMealInput) => {
    if (!selectedMeal) return;

    const result = await updateMealAction(selectedMeal.id, data);
    if (result.success && result.data) {
      toast.success("Repas modifié avec succès");
      setIsEditDialogOpen(false);
      setSelectedMeal(null);
      router.refresh();
    } else {
      toast.error(result.error || "Erreur lors de la modification");
    }
  };

  // Handle delete
  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deleteId === null) return;

    const result = await deleteMealAction(deleteId);
    if (result.success) {
      toast.success("Repas supprimé avec succès");
      setIsDeleteDialogOpen(false);
      setDeleteId(null);
      router.refresh();
    } else {
      toast.error(result.error || "Erreur lors de la suppression");
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const mealToDelete = deleteId
    ? meals.find((m) => m.id === deleteId)
    : null;

  const mealTypeLabels: Record<MealType, string> = {
    [MealType.APPETIZER]: "Entrée",
    [MealType.MAIN_COURSE]: "Plat principal",
    [MealType.DESSERT]: "Dessert",
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Gestion des repas</CardTitle>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Ajouter un repas
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer un repas</DialogTitle>
                  <DialogDescription>
                    Remplissez les informations pour créer un nouveau repas.
                  </DialogDescription>
                </DialogHeader>
                <Form {...createForm}>
                  <form
                    onSubmit={createForm.handleSubmit(handleCreateSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={createForm.control}
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
                      control={createForm.control}
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
                      control={createForm.control}
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
                        onClick={() => setIsCreateDialogOpen(false)}
                      >
                        Annuler
                      </Button>
                      <Button type="submit">Créer</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}
          {meals.length === 0 ? (
            <p className="text-center text-muted-foreground">
              Aucun repas enregistré.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date de création</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meals.map((meal) => (
                  <TableRow key={meal.id}>
                    <TableCell className="font-medium">{meal.name}</TableCell>
                    <TableCell>{mealTypeLabels[meal.type]}</TableCell>
                    <TableCell>{meal.description}</TableCell>
                    <TableCell>{formatDate(meal.created)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(meal)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(meal.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le repas</DialogTitle>
            <DialogDescription>
              Modifiez les informations du repas.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(handleEditSubmit)}
              className="space-y-4"
            >
              <FormField
                control={editForm.control}
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
                control={editForm.control}
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
                control={editForm.control}
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
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit">Enregistrer</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le repas{" "}
              <strong>{mealToDelete?.name}</strong> ? Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
