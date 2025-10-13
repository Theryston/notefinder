import Image from 'next/image';
import Link from 'next/link';
import { GithubIcon, SearchIcon, UserIcon } from 'lucide-react';
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
import { getUserByIdWithCache } from '@/lib/services/users/get-user';
import { Suspense } from 'react';

export async function Header({ desktopOnly }: { desktopOnly?: boolean }) {
  const session = await auth();
  const headersList = await headers();
  const { device } = userAgent({
    headers: headersList,
  });

  const deviceType = device.type || 'desktop';

  if (desktopOnly && deviceType !== 'desktop') return null;

  return (
    <AnonymousHeader
      customRightSide={
        session?.user ? <UserAvatar session={session} /> : undefined
      }
    />
  );
}

export function AnonymousHeader({
  customRightSide,
}: {
  customRightSide?: React.ReactNode;
}) {
  return (
    <>
      <div className="h-20" />
      <header className="w-full h-20 border-b fixed top-0 left-0 right-0 z-50 bg-background/50 backdrop-blur-sm">
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
              <Suspense
                fallback={<div className="w-full h-12 bg-muted rounded-md" />}
              >
                <SearchInput />
              </Suspense>
            </div>
          </div>

          <div className="flex items-center gap-4">
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
            {customRightSide ? customRightSide : <AnonymousUserAvatar />}
          </div>
        </div>
      </header>
    </>
  );
}

function AnonymousUserAvatar() {
  return (
    <Button variant="outline" aria-label="User" size="icon" asChild>
      <Link href="/sign-in">
        <UserIcon />
      </Link>
    </Button>
  );
}

async function UserAvatar({ session }: { session: Session }) {
  if (!session.user || !session.user?.id) return null;

  const handleSignOut = async () => {
    'use server';
    await signOut();
  };

  const user = await getUserByIdWithCache(session.user.id);

  if (!user) return <AnonymousUserAvatar />;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar>
          <AvatarImage src={user.image || ''} />
          <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>{user?.name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/users/${user?.username}`}>Meu perfil</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/me/edit">Editar perfil</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut}>Sair</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
