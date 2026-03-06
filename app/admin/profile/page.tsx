import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAdminJwtCookieName, verifyAdminJwt } from '@/lib/auth/jwt';
import { getUserById } from '@/lib/services/user.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileForm } from './profile-form';

export default async function AdminProfilePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getAdminJwtCookieName())?.value;

  if (!token) {
    redirect('/admin/login');
  }

  let userId: number;
  try {
    const payload = verifyAdminJwt(token);
    userId = payload.userId;
  } catch {
    redirect('/admin/login');
  }

  const user = await getUserById(userId);
  if (!user) {
    redirect('/admin/login');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil</CardTitle>
      </CardHeader>
      <CardContent>
        <ProfileForm
          user={{
            id: user.id,
            username: user.username,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
          }}
        />
      </CardContent>
    </Card>
  );
}
