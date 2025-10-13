import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full border-t py-6 mt-auto text-center text-sm text-muted-foreground flex flex-col gap-4">
      <div className="flex items-center justify-center gap-4">
        <Link
          href="https://github.com/Theryston/notefinder"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-primary"
        >
          GitHub
        </Link>
        <Link href="/terms" className="underline hover:text-primary">
          Termos e Condições
        </Link>
      </div>
      <span className="text-xs text-muted-foreground">
        Este side não reproduz músicas diretamente, apenas utiliza a API do
        YouTube.
      </span>
    </footer>
  );
}
