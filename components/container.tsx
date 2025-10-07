import { Header } from './header';
import { Footer } from './footer';
import { auth } from '@/auth';
import { User } from '@prisma/client';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';

type Props = {
  children: React.ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
  pathname: string;
};

export function Container({
  children,
  showHeader = true,
  showFooter = true,
  pathname,
}: Props) {
  return (
    <div className="flex flex-col min-h-screen gap-8">
      {showHeader && <Header />}

      <main className="w-full max-w-screen-2xl px-4 mx-auto">
        <SetupUser pathname={pathname}>{children}</SetupUser>
      </main>

      {showFooter && <Footer />}
    </div>
  );
}

async function SetupUser({
  children,
  pathname,
}: {
  children: React.ReactNode;
  pathname: string;
}) {
  const session = await auth();

  if (!session?.user) return children;

  const isGoogle =
    (session.user as User & { provider: string }).provider === 'google';
  const isEmailVerified = (session.user as User).emailVerified;

  if (!isGoogle && !isEmailVerified) {
    if (pathname !== '/verify-email')
      redirect(`/verify-email${pathname ? `?redirectTo=${pathname}` : ''}`);
  } else if (session.user.id && !(session.user as User).username) {
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
    });

    if (pathname !== '/setup-username' && !user?.username) {
      redirect(`/setup-username${pathname ? `?redirectTo=${pathname}` : ''}`);
    }
  }

  return children;
}
