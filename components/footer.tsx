import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full border-t py-6 mt-auto text-center text-sm text-muted-foreground">
      <span>
        Criado com ❤️ por{' '}
        <Link
          href="https://github.com/theryston"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-primary"
        >
          Theryston Santos
        </Link>
        . Todo o código está disponível publicamente no{' '}
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
    </footer>
  );
}
