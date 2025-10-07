import { auth } from '@/auth';
import { Container } from '@/components/container';
import { redirect } from 'next/navigation';
import { VerifyEmailForm } from './components/verify-email-form';
import { User } from '@prisma/client';

export default async function VerifyEmail({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const redirectTo = params?.redirectTo;

  if (!session?.user) {
    redirect(`/sign-in${redirectTo ? `?redirectTo=${redirectTo}` : ''}`);
  }

  if (
    (session?.user as User)?.emailVerified ||
    (session?.user as User & { provider: string })?.provider === 'google'
  ) {
    redirect(redirectTo || '/');
  }

  return (
    <Container pathname="/verify-email">
      <div className="max-w-sm mx-auto py-12">
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Verificar email</h1>
            <p className="text-sm text-muted-foreground">
              Insira o código que enviamos para o seu email.
            </p>
          </div>

          <VerifyEmailForm redirectTo={redirectTo || '/'} />
        </div>
      </div>
    </Container>
  );
}
