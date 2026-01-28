'use server';

import { revalidatePath } from 'next/cache';
import { deleteStudent, updateStudent } from '@/lib/services/student.service';
import { type UpdateStudentInput, updateStudentSchema } from '@/lib/validations/student.validation';
import type { Student } from '@/lib/models/student';

export type ActionResult<T = Student> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Server Action to update a student
 */
export async function updateStudentAction(id: number, data: UpdateStudentInput): Promise<ActionResult> {
  try {
    // Validate input
    const validationResult = updateStudentSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues
          .map((e) => e.message)
          .join(', '),
      };
    }

    const student = await updateStudent(id, validationResult.data);

    // Revalidate the students page
    revalidatePath('/admin/students');

    return {
      success: true,
      data: student,
    };
  } catch (error) {
    console.error('Error updating student:', error);

    if (error instanceof Error && error.message === 'Student not found') {
      return {
        success: false,
        error: 'Élève non trouvé',
      };
    }

    return {
      success: false,
      error: 'Erreur lors de la modification de l\'élève',
    };
  }
}

/**
 * Server Action to delete a student
 */
export async function deleteStudentAction(id: number): Promise<ActionResult<void>> {
  try {
    await deleteStudent(id);

    // Revalidate the students page
    revalidatePath('/admin/students');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error deleting student:', error);

    if (error instanceof Error && error.message === 'Student not found') {
      return {
        success: false,
        error: 'Élève non trouvé',
      };
    }

    return {
      success: false,
      error: 'Erreur lors de la suppression de l\'élève',
    };
  }
}
