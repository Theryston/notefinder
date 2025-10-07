import Image from 'next/image';
import Link from 'next/link';
import { GithubIcon, PlusIcon, SearchIcon, UserIcon } from 'lucide-react';
import { Button } from './ui/button';
import { SearchInput } from './search-input';
import { auth, signOut } from '@/auth';
import { userAgent } from 'next/server';
import { headers } from 'next/headers';
import { Session } from 'next-auth';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { User } from '@prisma/client';

export async function Header() {
  const session = await auth();
  const headersList = await headers();
  const { device } = userAgent({
    headers: headersList,
  });

  const deviceType = device.type || 'desktop';

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

              <span className="text-md font-bold block md:hidden m-0">
                NoteFinder
              </span>
            </Link>

            <div className="hidden md:block">
              <SearchInput />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button size="icon" aria-label="Add" asChild>
              <Link href={session?.user ? '/new' : '/sign-in?redirectTo=/new'}>
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
            <Button
              variant="outline"
              size="icon"
              aria-label="Github"
              asChild
              className="hidden md:flex"
            >
              <Link href="https://github.com/theryston/notefinder">
                <GithubIcon />
              </Link>
            </Button>
            {session?.user ? (
              <UserAvatar session={session} />
            ) : (
              <Button
                variant="outline"
                aria-label="User"
                size={deviceType === 'mobile' ? 'icon' : 'default'}
                asChild
              >
                <Link href="/sign-in">
                  <span className="hidden md:block">Entrar</span>
                  <UserIcon />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>
    </>
  );
}

function UserAvatar({ session }: { session: Session }) {
  if (!session.user) return null;

  const handleSignOut = async () => {
    'use server';
    await signOut();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar>
          <AvatarImage src={session.user.image ?? ''} />
          <AvatarFallback>
            {session.user.name?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>{session.user.name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/users/${(session.user as User).username}`}>Perfil</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut}>Sair</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
