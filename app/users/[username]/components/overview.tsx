import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import moment from 'moment';
import { FullUser } from '@/lib/constants';

export function UserOverview({ user }: { user: FullUser }) {
  const name = user.name ?? user.username ?? 'Usuário';
  const username = user.username ?? null;
  const avatarAlt = name || 'Avatar';
  const firstChar = (user.name || user.username || 'U').charAt(0).toUpperCase();

  return (
    <section className="w-full">
      <div className="relative overflow-hidden rounded-2xl border bg-background/60 shadow-sm backdrop-blur">
        <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-primary/10 via-transparent to-primary/10" />

        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-[120px_1fr] gap-6 sm:gap-8 items-start">
            <div className="relative rounded-full overflow-hidden border size-[120px] sm:size-[150px]">
              <Avatar className="size-full">
                <AvatarImage src={user.image || ''} alt={avatarAlt} />
                <AvatarFallback className="text-xl sm:text-2xl font-semibold">
                  {firstChar}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-1 md:justify-between">
                <div className="flex flex-col gap-1">
                  <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                    {name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    {username ? <span>@{username}</span> : null}
                    <span className="rounded-full border px-2 py-0.5 text-xs">
                      Membro desde {moment(user.createdAt).format('MM/YYYY')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-full h-full hidden md:block">
                <CardsInfo user={user} />
              </div>
            </div>
          </div>

          <div className="mt-4 w-full h-full block md:hidden">
            <CardsInfo user={user} />
          </div>
        </div>
      </div>
    </section>
  );
}

function CardsInfo({ user }: { user: FullUser }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="rounded-lg border bg-card p-3">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
          Músicas adicionadas
        </div>
        <div className="mt-0.5 text-sm font-medium">{user._count.tracks}</div>
      </div>
      <div className="rounded-lg border bg-card p-3">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
          Músicas vistas
        </div>
        <div className="mt-0.5 text-sm font-medium">
          {user._count.trackViews}
        </div>
      </div>
      <div className="rounded-lg border bg-card p-3">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
          Favoritas
        </div>
        <div className="mt-0.5 text-sm font-medium">
          {user._count.userFavoriteTracks}
        </div>
      </div>
      <div className="rounded-lg border bg-card p-3">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
          Processando agora
        </div>
        <div className="mt-0.5 text-sm font-medium">
          {user.tracks.filter((t) => t.status !== 'COMPLETED').length}
        </div>
      </div>
    </div>
  );
}
