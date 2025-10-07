import { auth } from '@/auth';
import { Container } from '@/components/container';
import { redirect } from 'next/navigation';
import { UsernameForm } from './components/username-form';
import prisma from '@/lib/prisma';

export default async function SetupUsername({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const redirectTo = params?.redirectTo || '/';

  if (!session?.user || !session.user.id) {
    redirect(`/sign-in${redirectTo ? `?redirectTo=${redirectTo}` : ''}`);
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
  });

  if (user?.username) {
    redirect(redirectTo);
  }

  return (
    <Container pathname="/setup-username">
      <div className="max-w-sm mx-auto py-12">
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Definir nome de usuário</h1>
            <p className="text-sm text-muted-foreground">
              Escolha um nome de usuário único para o seu perfil.
            </p>
          </div>

          <UsernameForm redirectTo={redirectTo} name={user?.name || ''} />
        </div>
      </div>
    </Container>
  );
}
