'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { getAdminJwtCookieName, verifyAdminJwt } from '@/lib/auth/jwt';
import { updateUser } from '@/lib/services/user.service';
import type { User } from '@/lib/models/user';

const profileUpdateSchema = z.object({
  firstname: z.string().min(1, 'Prénom requis'),
  lastname: z.string().min(1, 'Nom requis'),
  email: z.email('Email invalide'),
});

export type ProfileUpdateResult = {
  success: boolean;
  data?: User;
  error?: string;
};

export async function updateProfileAction(
  _prevState: ProfileUpdateResult | null,
  formData: FormData
): Promise<ProfileUpdateResult> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(getAdminJwtCookieName())?.value;
    if (!token) {
      return {success: false, error: 'Non authentifié.'};
    }

    const payload = verifyAdminJwt(token);
    const userId = payload.userId;

    const parsed = profileUpdateSchema.safeParse({
      firstname: formData.get('firstname') ?? '',
      lastname: formData.get('lastname') ?? '',
      email: formData.get('email') ?? '',
    });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((e) => e.message).join(', '),
      };
    }

    const user = await updateUser(userId, parsed.data);
    revalidatePath('/admin/profile');
    return {
      success: true,
      data: user,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur lors de la mise à jour.';
    return {
      success: false,
      error: message,
    };
  }
}
