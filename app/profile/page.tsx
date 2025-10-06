import { auth } from '@/auth';
import { Container } from '@/components/container';
import { redirect } from 'next/navigation';

export default async function Profile() {
  const session = await auth();

  if (!session?.user) redirect('/sign-in?redirectTo=/profile');

  return <Container>Profile {session.user.name}</Container>;
}
