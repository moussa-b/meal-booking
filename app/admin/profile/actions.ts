'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { getAdminJwtCookieName, verifyAdminJwt } from '@/lib/auth/jwt';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { getUserWithPasswordById, updateUser, updateUserCredentials, } from '@/lib/services/user.service';
import type { User } from '@/lib/models/user';

const profileUpdateSchema = z.object({
  firstname: z.string().min(1, 'Prénom requis'),
  lastname: z.string().min(1, 'Nom requis'),
  email: z.email('Email invalide'),
});

const credentialsUpdateSchema = z
  .object({
    username: z.string().min(1, 'Identifiant requis'),
    currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
    newPassword: z.string().optional(),
    newPasswordConfirm: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const newPassword = (data.newPassword ?? '').trim();
    const newPasswordConfirm = (data.newPasswordConfirm ?? '').trim();

    // Allow username-only update: both empty.
    if (!newPassword && !newPasswordConfirm) {
      return;
    }

    // If one is provided, require both.
    if (!newPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'Nouveau mot de passe requis.',
        path: ['newPassword'],
      });
      return;
    }
    if (!newPasswordConfirm) {
      ctx.addIssue({
        code: 'custom',
        message: 'Confirmation du mot de passe requise.',
        path: ['newPasswordConfirm'],
      });
      return;
    }

    if (newPassword.length < 8) {
      ctx.addIssue({
        code: 'custom',
        message: 'Le nouveau mot de passe doit contenir au moins 8 caractères',
        path: ['newPassword'],
      });
    }

    if (newPassword !== newPasswordConfirm) {
      ctx.addIssue({
        code: 'custom',
        message: 'Les deux mots de passe ne correspondent pas.',
        path: ['newPasswordConfirm'],
      });
    }
  });

export type ProfileUpdateResult = {
  success: boolean;
  data?: User;
  error?: string;
};

export type CredentialsUpdateResult = {
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

export async function updateCredentialsAction(_prevState: CredentialsUpdateResult | null, formData: FormData): Promise<CredentialsUpdateResult> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(getAdminJwtCookieName())?.value;
    if (!token) {
      return { success: false, error: 'Non authentifié.' };
    }

    const payload = verifyAdminJwt(token);
    const userId = payload.userId;

    const parsed = credentialsUpdateSchema.safeParse({
      username: formData.get('username') ?? '',
      currentPassword: formData.get('currentPassword') ?? '',
      newPassword: formData.get('newPassword') ?? '',
      newPasswordConfirm: formData.get('newPasswordConfirm') ?? '',
    });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((e) => e.message).join(', '),
      };
    }

    const { username, currentPassword } = parsed.data;
    const newPassword = (parsed.data.newPassword ?? '').trim();
    const newPasswordConfirm = (parsed.data.newPasswordConfirm ?? '').trim();

    const user = await getUserWithPasswordById(userId);
    if (!user) {
      return { success: false, error: 'Utilisateur introuvable.' };
    }

    const passwordOk = await verifyPassword(currentPassword, user.password);
    if (!passwordOk) {
      return { success: false, error: 'Mot de passe actuel incorrect.' };
    }

    const passwordHash = newPassword && newPasswordConfirm ? await hashPassword(newPassword) : null;

    const updated = await updateUserCredentials(userId, { username, passwordHash });
    revalidatePath('/admin/profile');
    return {
      success: true,
      data: updated,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur lors de la mise à jour des identifiants.';
    return {
      success: false,
      error: message,
    };
  }
}
