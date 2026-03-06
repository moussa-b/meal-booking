'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdminUserSetter } from '@/hooks/use-admin-user';
import { updateCredentialsAction, type CredentialsUpdateResult, } from './actions';

interface ChangeCredentialsDialogProps {
  initialUsername: string;
}

function PasswordField({id, name, label, hint, autoComplete, disabled, 'aria-label': ariaLabel,}: {
  id: string;
  name: string;
  label: string;
  hint?: string;
  autoComplete: string;
  disabled: boolean;
  'aria-label': string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          disabled={disabled}
          className="pr-10"
          aria-label={ariaLabel}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => setVisible((v) => !v)}
          disabled={disabled}
          aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          aria-pressed={visible}
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden />
          ) : (
            <Eye className="h-4 w-4" aria-hidden />
          )}
        </Button>
      </div>
      {hint && (
        <p className="text-xs italic text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

export function ChangeCredentialsDialog({initialUsername}: ChangeCredentialsDialogProps) {
  const router = useRouter();
  const setAdminUser = useAdminUserSetter();
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<CredentialsUpdateResult | null, FormData>(
    updateCredentialsAction,
    null
  );

  useEffect(() => {
    if (state?.success) {
      (async () => {
        await fetch('/api/admin/auth/logout', {method: 'POST'});
        setAdminUser(null);
        router.push('/admin/login');
        router.refresh();
      })();
    }
  }, [state, setAdminUser, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button"
                variant="outline"
                size="sm">
          Changer mes identifiants
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Changer mes identifiants</DialogTitle>
          <DialogDescription>
            Après la modification, vous serez déconnecté et devrez vous reconnecter avec vos
            nouveaux identifiants.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}
              className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="credentials-username">Identifiant</Label>
            <Input
              id="credentials-username"
              name="username"
              type="text"
              defaultValue={initialUsername}
              required
              disabled={isPending}
              autoComplete="username"
            />
          </div>
          <PasswordField
            id="credentials-current-password"
            name="currentPassword"
            label="Mot de passe actuel"
            autoComplete="current-password"
            disabled={isPending}
            aria-label="Mot de passe actuel"
          />
          <PasswordField
            id="credentials-new-password"
            name="newPassword"
            label="Nouveau mot de passe"
            hint="Laisser vide pour ne changer que l'identifiant"
            autoComplete="new-password"
            disabled={isPending}
            aria-label="Nouveau mot de passe"
          />
          <PasswordField
            id="credentials-new-password-confirm"
            name="newPasswordConfirm"
            label="Confirmation du nouveau mot de passe"
            hint="Laisser vide pour ne changer que l'identifiant"
            autoComplete="new-password"
            disabled={isPending}
            aria-label="Confirmation du nouveau mot de passe"
          />
          {state?.error && (
            <p className="text-sm text-destructive"
               role="alert">
              {state.error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit"
                    disabled={isPending}>
              {isPending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
