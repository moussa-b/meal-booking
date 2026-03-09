'use server';

import { revalidatePath } from 'next/cache';
import { deleteMealParticipant, updateMealParticipant } from '@/lib/services/meal-participant.service';
import { type UpdateMealParticipantInput, updateMealParticipantSchema } from '@/lib/validations/meal-participant.validation';
import type { MealParticipant } from '@/lib/models/meal-participant';

export type ActionResult<T = MealParticipant> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Server Action to update a meal participant
 */
export async function updateMealParticipantAction(id: number, data: UpdateMealParticipantInput): Promise<ActionResult> {
  try {
    // Validate input
    const validationResult = updateMealParticipantSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues
          .map((e) => e.message)
          .join(', '),
      };
    }

    const mealParticipant = await updateMealParticipant(id, validationResult.data);

    // Revalidate the meal participants page
    revalidatePath('/admin/meal-participants');

    return {
      success: true,
      data: mealParticipant,
    };
  } catch (error) {
    console.error('Error updating meal participant:', error);

    if (error instanceof Error && error.message === 'Meal participant not found') {
      return {
        success: false,
        error: 'Participant non trouvé',
      };
    }

    return {
      success: false,
      error: 'Erreur lors de la modification du participant',
    };
  }
}

/**
 * Server Action to delete a meal participant
 */
export async function deleteMealParticipantAction(id: number): Promise<ActionResult<void>> {
  try {
    await deleteMealParticipant(id);

    // Revalidate the meal participants page
    revalidatePath('/admin/meal-participants');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error deleting meal participant:', error);

    if (error instanceof Error && error.message === 'Meal participant not found') {
      return {
        success: false,
        error: 'Participant non trouvé',
      };
    }

    return {
      success: false,
      error: 'Erreur lors de la suppression du participant',
    };
  }
}
