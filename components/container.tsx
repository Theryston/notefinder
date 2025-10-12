import { AnonymousHeader, Header } from './header';
import { Footer } from './footer';
import { auth } from '@/auth';
import { User } from '@prisma/client';
import { redirect } from 'next/navigation';
import { getUserById } from '@/lib/services/users/get-user';
import { Suspense } from 'react';

type Props = {
  children: React.ReactNode;
  showHeader?: boolean | 'desktop-only';
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
      {showHeader && (
        <Suspense fallback={<AnonymousHeader />}>
          <Header desktopOnly={showHeader === 'desktop-only'} />
        </Suspense>
      )}

      <main className="w-full max-w-screen-2xl px-4 mx-auto">
        <Suspense>
          <SetupUser pathname={pathname} />
        </Suspense>
        {children}
      </main>

      {showFooter && <Footer />}
    </div>
  );
}

async function SetupUser({ pathname }: { pathname: string }) {
  const session = await auth();

  if (!session?.user || !session.user.id) return null;

  const isGoogle =
    (session.user as User & { provider: string }).provider === 'google';
  const isEmailVerified = (session.user as User).emailVerified;

  if (!isGoogle && !isEmailVerified) {
    const user = await getUserById(session.user.id);
    if (!user) return null;

    if (pathname !== '/verify-email' && !user?.emailVerified) {
      redirect(`/verify-email${pathname ? `?redirectTo=${pathname}` : ''}`);
    }
  } else if (session.user.id && !(session.user as User).username) {
    const user = await getUserById(session.user.id);
    if (!user) return null;

    if (pathname !== '/setup-username' && !user?.username) {
      redirect(`/setup-username${pathname ? `?redirectTo=${pathname}` : ''}`);
    }
  }

  return null;
}
