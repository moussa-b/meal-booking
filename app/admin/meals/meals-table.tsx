"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PencilIcon, TrashIcon } from 'lucide-react';
import type { Meal } from '@/lib/models/meal';
import { MealType } from '@/lib/models/meal';
import { type ActionResult } from './actions';
import {
  type CreateMealInput,
  type UpdateMealInput,
} from '@/lib/validations/meal.validation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { CreateMealDialog } from './create-meal-dialog';
import { EditMealDialog } from './edit-meal-dialog';

interface MealsTableProps {
  meals: Meal[];
  createMealAction: (data: CreateMealInput) => Promise<ActionResult>;
  updateMealAction: (
    id: number,
    data: UpdateMealInput
  ) => Promise<ActionResult>;
  deleteMealAction: (id: number) => Promise<ActionResult<void>>;
  error?: string | null;
  errorDetail?: string | null;
}

export function MealsTable({
  meals: initialMeals,
  createMealAction,
  updateMealAction,
  deleteMealAction,
  error,
  errorDetail,
}: MealsTableProps) {
  const router = useRouter();
  const [meals, setMeals] = useState(initialMeals);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Update meals when initialMeals changes (after revalidation)
  useEffect(() => {
    setMeals(initialMeals);
  }, [initialMeals]);

  // Handle edit
  const handleEditClick = (meal: Meal) => {
    setSelectedMeal(meal);
    setIsEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setIsEditDialogOpen(false);
    setSelectedMeal(null);
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
            <CreateMealDialog
              createMealAction={createMealAction}
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            />
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 p-4 text-sm text-destructive">
              {error}
              {errorDetail && (
                <div className="mt-2 text-xs font-mono opacity-75">
                  {errorDetail}
                </div>
              )}
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
      <EditMealDialog
        meal={selectedMeal}
        updateMealAction={updateMealAction}
        open={isEditDialogOpen}
        onOpenChange={handleEditClose}
      />

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
