import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (session?.user) redirect('/');

  return <>{children}</>;
}
