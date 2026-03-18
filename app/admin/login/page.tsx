'use client';

import { Suspense } from 'react';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RequiredMark } from '@/components/ui/required-mark';
import { useAdminUserSetter } from '@/hooks/use-admin-user';

type AdminLoginFormProps = {
  nextPath: string;
};

function AdminLoginForm({ nextPath }: AdminLoginFormProps) {
  const router = useRouter();
  const setAdminUser = useAdminUserSetter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message =
          data?.message ||
          (res.status === 401
            ? 'Identifiants invalides'
            : 'Erreur lors de la connexion');
        setError(message);
        return;
      }

      if (data?.user) {
        setAdminUser(data.user);
      }

      router.push(nextPath);
    } catch {
      setError('Erreur réseau lors de la connexion');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-semibold">
          Connexion administration
        </h1>

        {error && (
          <p className="mb-4 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="identifier">
              Identifiant ou email<RequiredMark />
            </Label>
            <Input
              id="identifier"
              type="text"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="password">
              Mot de passe<RequiredMark />
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </Button>
        </form>
      </div>
    </div>
  );
}

function AdminLoginPageContent() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/admin';

  return <AdminLoginForm nextPath={nextPath} />;
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<AdminLoginForm nextPath="/admin" />}>
      <AdminLoginPageContent />
    </Suspense>
  );
}

