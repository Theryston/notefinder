import { Container } from '@/components/container';
import { HomeContent } from './content';

export default async function Home() {
  return (
    <Container pathname="/">
      <HomeContent />
    </Container>
  );
}
