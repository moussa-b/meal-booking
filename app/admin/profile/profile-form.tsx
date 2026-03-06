'use client';

import { useActionState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdminUserSetter } from '@/hooks/use-admin-user';
import {
  updateProfileAction,
  type ProfileUpdateResult,
} from './actions';

interface ProfileFormUser {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
}

interface ProfileFormProps {
  user: ProfileFormUser;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const setAdminUser = useAdminUserSetter();
  const [state, formAction, isPending] = useActionState<ProfileUpdateResult | null, FormData>(updateProfileAction, null);

  useEffect(() => {
    if (state?.success && state.data) {
      setAdminUser({
        id: state.data.id,
        username: state.data.username,
        firstname: state.data.firstname,
        lastname: state.data.lastname,
        email: state.data.email,
      });
    }
  }, [state, setAdminUser]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="firstname">Prénom</Label>
        <Input
          id="firstname"
          name="firstname"
          type="text"
          defaultValue={user.firstname}
          required
          disabled={isPending}
          autoComplete="given-name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lastname">Nom</Label>
        <Input
          id="lastname"
          name="lastname"
          type="text"
          defaultValue={user.lastname}
          required
          disabled={isPending}
          autoComplete="family-name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={user.email}
          required
          disabled={isPending}
          autoComplete="email"
        />
      </div>
      {state?.error && (
        <p className="text-sm text-destructive"
           role="alert">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="text-sm text-green-600 dark:text-green-400"
           role="status">
          Profil mis à jour.
        </p>
      )}
      <Button type="submit"
              disabled={isPending}>
        {isPending ? 'Enregistrement…' : 'Enregistrer'}
      </Button>
    </form>
  );
}
