import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full border-t py-6 mt-auto text-center text-sm text-muted-foreground flex flex-col gap-4">
      <span>
        Todo o código está disponível publicamente no{' '}
        <Link
          href="https://github.com/Theryston/notefinder"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-primary"
        >
          GitHub
        </Link>
        .
      </span>
      <Link href="/terms" className="underline hover:text-primary">
        Termos e Condições
      </Link>
    </footer>
  );
}
