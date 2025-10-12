import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

export default async function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Suspense fallback={null}>
        <CheckSession />
      </Suspense>
    </>
  );
}

async function CheckSession() {
  const session = await auth();

  if (session?.user) redirect('/');

  return null;
}
