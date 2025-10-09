import { Container } from '@/components/container';
import { userAgent } from 'next/server';
import { headers } from 'next/headers';
import { SearchContent } from './components/search-content';
import { SearchInput } from '@/components/search-input';
import { Suspense } from 'react';

export const generateMetadata = async ({
  searchParams,
}: {
  searchParams: Promise<{ q: string }>;
}) => {
  const params = await searchParams;
  const q = params.q;

  if (!q) {
    return {
      title: 'Pesquisar música',
      description:
        'Encontre a musica que você quer cantar que o NoteFinder te mostra os vocais!',
    };
  }

  return {
    title: `Pesquisar música "${q}"`,
    description: `Encontre a musica "${q}" e veja as notas vocais para cantar!`,
  };
};

export default async function Search({
  searchParams,
}: {
  searchParams: Promise<{ q: string }>;
}) {
  const params = await searchParams;
  const q = params.q;

  const headersList = await headers();
  const { device } = userAgent({
    headers: headersList,
  });

  const deviceType = device.type || 'desktop';

  return (
    <Container pathname="/search" showHeader={deviceType === 'desktop'}>
      <div className="flex flex-col gap-4">
        <div className="w-full md:w-md pt-4 flex md:hidden">
          <Suspense
            fallback={<div className="w-full h-12 bg-muted rounded-md" />}
          >
            <SearchInput />
          </Suspense>
        </div>
        <SearchContent query={q || ''} />
      </div>
    </Container>
  );
}
