import { Container } from '@/components/container';
import { SearchContent } from './components/search-content';
import { SearchInput } from '@/components/search-input';
import { Suspense } from 'react';
import { Skeleton } from '@/components/sheleton';

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
  return (
    <Container pathname="/search" showHeader="desktop-only">
      <div className="flex flex-col gap-4">
        <div className="w-full md:w-md pt-4 flex md:hidden">
          <Suspense
            fallback={<div className="w-full h-12 bg-muted rounded-md" />}
          >
            <SearchInput />
          </Suspense>
        </div>

        <Suspense fallback={<SearchLoading />}>
          <SearchContent searchParams={searchParams} />
        </Suspense>
      </div>
    </Container>
  );
}

function SearchLoading() {
  return (
    <div className="w-full h-full grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: 3 * 8 }).map((_, index) => (
        <div key={index} className="w-full h-26">
          <Skeleton />
        </div>
      ))}
    </div>
  );
}
