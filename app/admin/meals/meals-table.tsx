"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PencilIcon, TrashIcon, PlusIcon } from 'lucide-react';
import type { Meal } from '@/lib/models/meal';
import { MealType } from '@/lib/models/meal';
import { type ActionResult } from './actions';
import {
  type CreateMealInput,
  type UpdateMealInput,
} from '@/lib/validations/meal.validation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  const [createDialogType, setCreateDialogType] = useState<MealType | null>(null);
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

  const mealToDelete = deleteId
    ? meals.find((m) => m.id === deleteId)
    : null;

  const mealTypeLabels: Record<MealType, string> = {
    [MealType.APPETIZER]: "Entrée",
    [MealType.MAIN_COURSE]: "Plat principal",
    [MealType.DESSERT]: "Dessert",
  };

  // Filter meals by type
  const mainCourseMeals = meals.filter((m) => m.type === MealType.MAIN_COURSE).sort((m1, m2) => m1.name.localeCompare(m2.name));
  const dessertMeals = meals.filter((m) => m.type === MealType.DESSERT).sort((m1, m2) => m1.name.localeCompare(m2.name));
  const appetizerMeals = meals.filter((m) => m.type === MealType.APPETIZER).sort((m1, m2) => m1.name.localeCompare(m2.name));

  // Handle create dialog opening with specific type
  const handleCreateClick = (type: MealType) => {
    setCreateDialogType(type);
    setIsCreateDialogOpen(true);
  };

  const handleCreateDialogClose = (open: boolean) => {
    setIsCreateDialogOpen(open);
    if (!open) {
      setCreateDialogType(null);
    }
  };

  // Render meal list for a column
  const renderMealList = (mealsList: Meal[]) => {
    if (mealsList.length === 0) {
      return (
        <p className="text-center text-sm text-muted-foreground py-4">
          Aucun repas enregistré.
        </p>
      );
    }

    return (
      <div className="space-y-3">
        {mealsList.map((meal) => (
          <div
            key={meal.id}
            className="rounded-lg border p-4 space-y-2 hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-1">
                <h4 className="font-semibold text-sm">{meal.name}</h4>
                {meal.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {meal.description}
                  </p>
                )}
              </div>
              <div className="flex gap-1 ml-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleEditClick(meal)}
                >
                  <PencilIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleDeleteClick(meal.id)}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="space-y-6">
        {error && (
          <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
            {error}
            {errorDetail && (
              <div className="mt-2 text-xs font-mono opacity-75">
                {errorDetail}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: Main Course */}
          <Card className="bg-blue-50/30 dark:bg-blue-950/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Plats principaux</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => handleCreateClick(MealType.MAIN_COURSE)}
                className="w-full"
                variant="outline"
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                Ajouter un plat principal
              </Button>
              {renderMealList(mainCourseMeals)}
            </CardContent>
          </Card>

          {/* Column 2: Dessert */}
          <Card className="bg-purple-50/30 dark:bg-purple-950/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Desserts</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => handleCreateClick(MealType.DESSERT)}
                className="w-full"
                variant="outline"
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                Ajouter un dessert
              </Button>
              {renderMealList(dessertMeals)}
            </CardContent>
          </Card>

          {/* Column 3: Appetizer */}
          <Card className="bg-green-50/30 dark:bg-green-950/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Entrées</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => handleCreateClick(MealType.APPETIZER)}
                className="w-full"
                variant="outline"
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                Ajouter une entrée
              </Button>
              {renderMealList(appetizerMeals)}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Dialog */}
      <CreateMealDialog
        createMealAction={createMealAction}
        open={isCreateDialogOpen}
        onOpenChange={handleCreateDialogClose}
        initialType={createDialogType || MealType.MAIN_COURSE}
      />

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
