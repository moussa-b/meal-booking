"use server";

import { revalidatePath } from "next/cache";
import {
  createSchool,
  updateSchool,
  deleteSchool,
} from "@/lib/services/school.service";
import {
  createSchoolSchema,
  updateSchoolSchema,
  type CreateSchoolInput,
  type UpdateSchoolInput,
} from "@/lib/validations/school.validation";
import type { School } from "@/lib/models/school";

export type ActionResult<T = School> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Server Action to create a new school
 */
export async function createSchoolAction(
  data: CreateSchoolInput
): Promise<ActionResult> {
  try {
    // Validate input
    const validationResult = createSchoolSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues
          .map((e) => e.message)
          .join(", "),
      };
    }

    const school = await createSchool(validationResult.data);

    // Revalidate the schools page
    revalidatePath("/admin/schools");

    return {
      success: true,
      data: school,
    };
  } catch (error) {
    console.error("Error creating school:", error);

    // Handle code generation failure
    if (
      error instanceof Error &&
      error.message.includes("Failed to generate unique school code")
    ) {
      return {
        success: false,
        error: "Erreur lors de la génération du code. Veuillez réessayer.",
      };
    }

    return {
      success: false,
      error: "Erreur lors de la création de l'établissement",
    };
  }
}

/**
 * Server Action to update a school
 */
export async function updateSchoolAction(
  id: number,
  data: UpdateSchoolInput
): Promise<ActionResult> {
  try {
    // Validate input
    const validationResult = updateSchoolSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues
          .map((e) => e.message)
          .join(", "),
      };
    }

    const school = await updateSchool(id, validationResult.data);

    // Revalidate the schools page
    revalidatePath("/admin/schools");

    return {
      success: true,
      data: school,
    };
  } catch (error) {
    console.error("Error updating school:", error);

    if (error instanceof Error && error.message === "School not found") {
      return {
        success: false,
        error: "Établissement non trouvé",
      };
    }

    // Handle duplicate code error
    if (
      error instanceof Error &&
      error.message.includes("Duplicate entry")
    ) {
      return {
        success: false,
        error: "Un établissement avec ce code existe déjà",
      };
    }

    return {
      success: false,
      error: "Erreur lors de la modification de l'établissement",
    };
  }
}

/**
 * Server Action to delete a school
 */
export async function deleteSchoolAction(
  id: number
): Promise<ActionResult<void>> {
  try {
    await deleteSchool(id);

    // Revalidate the schools page
    revalidatePath("/admin/schools");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting school:", error);

    if (error instanceof Error && error.message === "School not found") {
      return {
        success: false,
        error: "Établissement non trouvé",
      };
    }

    return {
      success: false,
      error: "Erreur lors de la suppression de l'établissement",
    };
  }
}
