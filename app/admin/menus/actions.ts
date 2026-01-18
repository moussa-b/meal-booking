"use server";

import { revalidatePath } from "next/cache";
import {
  createWeeklyMenu,
  updateWeeklyMenu,
  deleteWeeklyMenu,
} from "@/lib/services/weekly-menu.service";
import {
  createWeeklyMenuSchema,
  updateWeeklyMenuSchema,
  type CreateWeeklyMenuInput,
  type UpdateWeeklyMenuInput,
} from "@/lib/validations/weekly-menu.validation";
import type { WeeklyMenu } from "@/lib/models/weekly-menu";

export type ActionResult<T = WeeklyMenu> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Server Action to create a new weekly menu
 */
export async function createWeeklyMenuAction(
  data: CreateWeeklyMenuInput
): Promise<ActionResult> {
  try {
    // Validate input
    const validationResult = createWeeklyMenuSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues
          .map((e) => e.message)
          .join(", "),
      };
    }

    const menuData = {
      ...validationResult.data,
      days: validationResult.data.days.map(day => ({
        ...day,
        price: typeof day.price === 'string' ? parseFloat(day.price) : day.price,
      })),
    };

    const menu = await createWeeklyMenu(menuData);

    // Revalidate the menus page
    revalidatePath("/admin/menus");

    return {
      success: true,
      data: menu,
    };
  } catch (error) {
    console.error("Error creating weekly menu:", error);

    return {
      success: false,
      error: "Erreur lors de la création du menu",
    };
  }
}

/**
 * Server Action to update a weekly menu
 */
export async function updateWeeklyMenuAction(
  id: number,
  data: UpdateWeeklyMenuInput
): Promise<ActionResult> {
  try {
    // Validate input
    const validationResult = updateWeeklyMenuSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues
          .map((e) => e.message)
          .join(", "),
      };
    }

    const menuData = {
      ...validationResult.data,
      days: validationResult.data.days
        ? validationResult.data.days.map(day => ({
            ...day,
            price: typeof day.price === 'string' ? parseFloat(day.price) : day.price,
          }))
        : undefined,
    };

    const menu = await updateWeeklyMenu(id, menuData);

    // Revalidate the menus page
    revalidatePath("/admin/menus");

    return {
      success: true,
      data: menu,
    };
  } catch (error) {
    console.error("Error updating weekly menu:", error);

    if (error instanceof Error && error.message === "Weekly menu not found") {
      return {
        success: false,
        error: "Menu non trouvé",
      };
    }

    return {
      success: false,
      error: "Erreur lors de la modification du menu",
    };
  }
}

/**
 * Server Action to delete a weekly menu
 */
export async function deleteWeeklyMenuAction(
  id: number
): Promise<ActionResult<void>> {
  try {
    await deleteWeeklyMenu(id);

    // Revalidate the menus page
    revalidatePath("/admin/menus");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting weekly menu:", error);

    if (error instanceof Error && error.message === "Weekly menu not found") {
      return {
        success: false,
        error: "Menu non trouvé",
      };
    }

    return {
      success: false,
      error: "Erreur lors de la suppression du menu",
    };
  }
}
