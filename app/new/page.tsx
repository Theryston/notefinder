import { auth } from '@/auth';
import { Container } from '@/components/container';
import { redirect } from 'next/navigation';

export default async function New() {
  const session = await auth();

  if (!session?.user) redirect('/sign-in?redirectTo=/new');

  return <Container>New</Container>;
}
