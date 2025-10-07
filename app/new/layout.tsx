import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function NewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) redirect('/sign-in?redirectTo=/new');

  return <>{children}</>;
}
