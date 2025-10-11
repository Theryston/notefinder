import Link from 'next/link';
import { Container } from '@/components/container';
import { Button } from '@/components/ui/button';
import { ArrowLeft, SearchIcon } from 'lucide-react';

export default function NotFound() {
  return (
    <Container pathname="/404">
      <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold tracking-tight">
            Página não encontrada 🥲
          </h1>
          <p className="text-muted-foreground max-w-md text-xs">
            Não conseguimos encontrar o conteúdo que você procura. Você pode
            voltar para a página inicial ou pesquisar a música que você quer.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft />
              Voltar para início
            </Link>
          </Button>

          <Button asChild>
            <Link href="/search">
              <SearchIcon />
              Pesquisar música
            </Link>
          </Button>
        </div>
      </div>
    </Container>
  );
}
