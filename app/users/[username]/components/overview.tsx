import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import moment from 'moment';
import { DailyPracticeStreakStatus, FullUser } from '@/lib/constants';
import { notFound } from 'next/navigation';
import { getUserByUsername } from '@/lib/services/users/get-user';
import { cacheTag } from 'next/cache';
import { getDailyPracticeStreakStatus } from '@/lib/services/streak/daily-practice';
import { FlameIcon, Heart, HeartPlus, Music } from 'lucide-react';
import { cn } from '@/lib/utils';

export async function UserOverview({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  'use cache: remote';
  const { username } = await params;
  cacheTag(`user_${username}`);

  const user = await getUserByUsername(username);

  if (!user) notFound();

  const dailyPracticeStreakStatus = await getDailyPracticeStreakStatus(user.id);

  const name = user.name ?? user.username ?? 'Usuário';
  const avatarAlt = name || 'Avatar';
  const firstChar = (user.name || user.username || 'U').charAt(0).toUpperCase();

  return (
    <section className="w-full">
      <div className="relative overflow-hidden rounded-2xl border bg-background/60 shadow-sm backdrop-blur">
        <div className="absolute inset-0 -z-10 bg-linear-to-tr from-primary/10 via-transparent to-primary/10" />

        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-[120px_1fr] gap-6 sm:gap-8 items-start">
            <div className="relative rounded-full overflow-hidden border w-full aspect-square">
              <Avatar className="w-full h-full">
                <AvatarImage src={user.image || ''} alt={avatarAlt} />
                <AvatarFallback className="text-xl sm:text-2xl font-semibold">
                  {firstChar}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex flex-col gap-4 w-full overflow-hidden">
              <div className="flex flex-col md:flex-row gap-1 md:justify-between">
                <div className="flex flex-col gap-1">
                  <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight w-full">
                    {name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    {username ? (
                      <span className="max-w-full truncate">@{username}</span>
                    ) : null}
                    <span className="rounded-full border px-2 py-0.5 text-xs">
                      Membro desde {moment(user.createdAt).format('MM/YYYY')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-full h-full hidden md:block">
                <CardsInfo
                  user={user}
                  dailyPracticeStreakStatus={dailyPracticeStreakStatus}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 w-full h-full block md:hidden">
            <CardsInfo
              user={user}
              dailyPracticeStreakStatus={dailyPracticeStreakStatus}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function CardsInfo({
  user,
  dailyPracticeStreakStatus,
}: {
  user: FullUser;
  dailyPracticeStreakStatus: DailyPracticeStreakStatus | null;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div
        className={cn(
          'rounded-lg border p-3 relative overflow-hidden',
          !dailyPracticeStreakStatus?.completedToday
            ? 'bg-card'
            : 'bg-linear-to-br from-orange-500/15 via-background to-rose-500/10',
        )}
      >
        {dailyPracticeStreakStatus?.completedToday && (
          <div className="pointer-events-none absolute inset-0 -z- bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.22),transparent_55%)]" />
        )}

        <div
          className={cn(
            'text-[11px] uppercase tracking-wide',
            !dailyPracticeStreakStatus?.completedToday
              ? 'text-muted-foreground'
              : 'text-primary/80',
          )}
        >
          Ofensiva atual
        </div>
        <div
          className={cn(
            'mt-0.5 text-sm font-medium flex items-center gap-1',
            !dailyPracticeStreakStatus?.completedToday
              ? 'text-muted-foreground'
              : 'text-primary',
          )}
        >
          <FlameIcon className="size-4" />
          {dailyPracticeStreakStatus?.currentStreakDays} Dia
          {dailyPracticeStreakStatus?.currentStreakDays === 1 ? '' : 's'}{' '}
          seguido{dailyPracticeStreakStatus?.currentStreakDays === 1 ? '' : 's'}
        </div>
      </div>
      <div className="rounded-lg border bg-card p-3">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
          Engajamento
        </div>
        <div className="mt-0.5 text-sm font-medium text-muted-foreground flex items-center gap-1">
          <Music className="size-4" />
          {user._count.trackViews} cantada
          {user._count.trackViews === 1 ? '' : 's'}
        </div>
      </div>
      <div className="rounded-lg border bg-card p-3">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
          Lista
        </div>
        <div className="mt-0.5 text-sm font-medium text-muted-foreground flex items-center gap-1">
          <Heart className="size-4" /> {user._count.userFavoriteTracks} Salva
          {user._count.userFavoriteTracks === 1 ? '' : 's'}
        </div>
      </div>
      <div className="rounded-lg border bg-card p-3">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
          Contribuição
        </div>
        <div className="mt-0.5 text-sm font-medium text-muted-foreground flex items-center gap-1">
          <HeartPlus className="size-4" /> {user._count.tracks} Adicionada
          {user._count.tracks === 1 ? '' : 's'}
        </div>
      </div>
    </div>
  );
}
