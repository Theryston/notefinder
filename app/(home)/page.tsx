import { Container } from '@/components/container';
import { HomeSkeleton } from './components/home-skeleton';
import { Suspense } from 'react';
import { HomeContent } from './content';

export default async function Home() {
  return (
    <Container pathname="/">
      <Suspense fallback={<HomeSkeleton />}>
        <HomeContent />
      </Suspense>
    </Container>
  );
}
