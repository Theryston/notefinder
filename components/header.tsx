import Link from 'next/link';
import { FlameIcon, GithubIcon, SearchIcon, UserIcon } from 'lucide-react';
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
import { Logo } from './icons';
import { getDailyPracticeStreakStatus } from '@/lib/services/streak/daily-practice';
import { cn } from '@/lib/utils';

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
              <Logo className="text-primary text-4xl" />

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

  const dailyPracticeStreakStatus = await getDailyPracticeStreakStatus(user.id);
  const streakDays = dailyPracticeStreakStatus.currentStreakDays;
  const streakLabel = `${streakDays} Dia${streakDays === 1 ? '' : 's'} seguido${
    streakDays === 1 ? '' : 's'
  }`;

  return (
    <div className="flex items-center gap-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="cursor-pointer">
            <AvatarImage src={user.image || ''} />
            <AvatarFallback>
              {user.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
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

      <Link
        className={cn(
          'relative overflow-hidden rounded-lg border px-2 py-1 h-8 flex items-center gap-1',
          !dailyPracticeStreakStatus.completedToday
            ? 'bg-card'
            : 'bg-linear-to-br from-orange-500/15 via-background to-rose-500/10',
        )}
        href="/me/edit"
      >
        {dailyPracticeStreakStatus.completedToday && (
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.22),transparent_55%)]" />
        )}

        <div
          className={cn(
            'relative z-10 flex items-center gap-1 text-xs font-medium',
            !dailyPracticeStreakStatus.completedToday
              ? 'text-muted-foreground'
              : 'text-primary',
          )}
        >
          <FlameIcon className="size-3.5" />
          <span className="sm:hidden">{streakDays}</span>
          <span className="hidden sm:inline">{streakLabel}</span>
        </div>
      </Link>
    </div>
  );
}
