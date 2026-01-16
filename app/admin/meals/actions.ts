"use server";

import { revalidatePath } from "next/cache";
import {
  createMeal,
  updateMeal,
  deleteMeal,
} from "@/lib/services/meal.service";
import {
  createMealSchema,
  updateMealSchema,
  type CreateMealInput,
  type UpdateMealInput,
} from "@/lib/validations/meal.validation";
import type { Meal } from "@/lib/models/meal";

export type ActionResult<T = Meal> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Server Action to create a new meal
 */
export async function createMealAction(
  data: CreateMealInput
): Promise<ActionResult> {
  try {
    // Validate input
    const validationResult = createMealSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues
          .map((e) => e.message)
          .join(", "),
      };
    }

    const meal = await createMeal(validationResult.data);

    // Revalidate the meals page
    revalidatePath("/admin/meals");

    return {
      success: true,
      data: meal,
    };
  } catch (error) {
    console.error("Error creating meal:", error);

    return {
      success: false,
      error: "Erreur lors de la création du repas",
    };
  }
}

/**
 * Server Action to update a meal
 */
export async function updateMealAction(
  id: number,
  data: UpdateMealInput
): Promise<ActionResult> {
  try {
    // Validate input
    const validationResult = updateMealSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues
          .map((e) => e.message)
          .join(", "),
      };
    }

    const meal = await updateMeal(id, validationResult.data);

    // Revalidate the meals page
    revalidatePath("/admin/meals");

    return {
      success: true,
      data: meal,
    };
  } catch (error) {
    console.error("Error updating meal:", error);

    if (error instanceof Error && error.message === "Meal not found") {
      return {
        success: false,
        error: "Repas non trouvé",
      };
    }

    return {
      success: false,
      error: "Erreur lors de la modification du repas",
    };
  }
}

/**
 * Server Action to delete a meal
 */
export async function deleteMealAction(
  id: number
): Promise<ActionResult<void>> {
  try {
    await deleteMeal(id);

    // Revalidate the meals page
    revalidatePath("/admin/meals");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting meal:", error);

    if (error instanceof Error && error.message === "Meal not found") {
      return {
        success: false,
        error: "Repas non trouvé",
      };
    }

    return {
      success: false,
      error: "Erreur lors de la suppression du repas",
    };
  }
}
