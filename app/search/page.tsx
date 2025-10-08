import { Container } from '@/components/container';
import { SearchForm } from './components/search-form';
import { userAgent } from 'next/server';
import { headers } from 'next/headers';

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
      <SearchForm defaultQuery={q} isMobile={deviceType === 'mobile'} />
    </Container>
  );
}
