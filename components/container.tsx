import Image from 'next/image';
import Link from 'next/link';
import { Input } from './ui/input';
import { GithubIcon, PlusIcon, SearchIcon } from 'lucide-react';
import { Button } from './ui/button';

type Props = {
  children: React.ReactNode;
  showHeader?: boolean;
};

export function Container({ children, showHeader = true }: Props) {
  return (
    <div className="flex flex-col min-h-screen gap-4">
      {showHeader && <Header />}

      <main>{children}</main>
    </div>
  );
}

function Header() {
  return (
    <>
      <div className="h-20" />
      <header className="w-full h-20 border-b fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between max-w-screen-2xl px-4 mx-auto h-full">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <Image
                className="!w-10 !h-10"
                src="/logo.svg"
                alt="NoteFinder"
                width={40}
                height={40}
              />
            </Link>

            <SearchInput />
          </div>

          <div className="flex items-center gap-2">
            <Button size="icon" aria-label="Add">
              <PlusIcon />
            </Button>
            <Button variant="outline" size="icon" aria-label="Github" asChild>
              <Link href="https://github.com/theryston/notefinder">
                <GithubIcon />
              </Link>
            </Button>
          </div>
        </div>
      </header>
    </>
  );
}

function SearchInput() {
  return (
    <div className="flex items-center gap-1 w-md relative">
      <Input
        type="text"
        placeholder="O que você quer cantar hoje?"
        className="w-full h-12"
      />
      <Button
        size="icon"
        aria-label="Submit"
        variant="ghost"
        className="absolute right-2"
      >
        <SearchIcon />
      </Button>
    </div>
  );
}
