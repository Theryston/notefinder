import { Container } from '@/components/container';

export default async function Track({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <Container pathname={`/tracks/${id}`}>Track {id}</Container>;
}
