import { Container } from '@/components/container';

export default async function Profile({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  return <Container pathname="/profile">Profile {username}</Container>;
}
