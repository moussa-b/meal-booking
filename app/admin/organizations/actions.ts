"use server";

import { revalidatePath } from "next/cache";
import {
  createOrganization,
  updateOrganization,
  deleteOrganization,
} from "@/lib/services/organization.service";
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  type CreateOrganizationInput,
  type UpdateOrganizationInput,
} from "@/lib/validations/organization.validation";
import type { Organization } from "@/lib/models/organization";

export type ActionResult<T = Organization> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Server Action to create a new organization
 */
export async function createOrganizationAction(
  data: CreateOrganizationInput
): Promise<ActionResult> {
  try {
    // Validate input
    const validationResult = createOrganizationSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues
          .map((e) => e.message)
          .join(", "),
      };
    }

    const organization = await createOrganization(validationResult.data);

    // Revalidate the organizations page
    revalidatePath("/admin/organizations");

    return {
      success: true,
      data: organization,
    };
  } catch (error) {
    console.error("Error creating organization:", error);

    // Handle code generation failure
    if (
      error instanceof Error &&
      error.message.includes("Failed to generate unique organization code")
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
 * Server Action to update an organization
 */
export async function updateOrganizationAction(
  id: number,
  data: UpdateOrganizationInput
): Promise<ActionResult> {
  try {
    // Validate input
    const validationResult = updateOrganizationSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues
          .map((e) => e.message)
          .join(", "),
      };
    }

    const organization = await updateOrganization(id, validationResult.data);

    // Revalidate the organizations page
    revalidatePath("/admin/organizations");

    return {
      success: true,
      data: organization,
    };
  } catch (error) {
    console.error("Error updating organization:", error);

    if (error instanceof Error && error.message === "Organization not found") {
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
 * Server Action to delete an organization
 */
export async function deleteOrganizationAction(
  id: number
): Promise<ActionResult<void>> {
  try {
    await deleteOrganization(id);

    // Revalidate the organizations page
    revalidatePath("/admin/organizations");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting organization:", error);

    if (error instanceof Error && error.message === "Organization not found") {
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
