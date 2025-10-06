import Image from 'next/image';
import Link from 'next/link';
import { GithubIcon, PlusIcon, SearchIcon } from 'lucide-react';
import { Button } from './ui/button';
import { SearchInput } from './search-input';

export function Header() {
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

            <span className="text-md font-bold block md:hidden m-0">
              NoteFinder
            </span>

            <div className="hidden md:block">
              <SearchInput />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button size="icon" aria-label="Add" asChild>
              <Link href="/new">
                <PlusIcon />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Search"
              className="flex md:hidden"
              asChild
            >
              <Link href="/search">
                <SearchIcon />
              </Link>
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
