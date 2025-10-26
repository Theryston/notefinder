import type { Lyrics } from '@/lib/constants';
import { ArrowUpIcon } from 'lucide-react';
import Link from 'next/link';

export function LyricsComponent({ lyrics }: { lyrics: Lyrics }) {
  return (
    <section className="w-full">
      <div className="relative overflow-hidden rounded-2xl border bg-background/60 shadow-sm backdrop-blur">
        <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-primary/10 via-transparent to-primary/10" />
        <div className="p-6 flex flex-col gap-4">
          <h2 className="text-lg font-bold">Letra da música</h2>
          {lyrics.segments ? (
            <div className="flex flex-col gap-2">
              {lyrics.segments.map((segment) => (
                <Link
                  key={segment.id}
                  href={`?timeline-focus=true&time=${segment.seek}`}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  scroll={false}
                >
                  {segment.text.trim()}
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground flex flex-wrap gap-0.5">
              {lyrics.words.map((word, index) => (
                <Link
                  key={`${word.start}-${index}`}
                  href={`?timeline-focus=true&time=${word.start}`}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  scroll={false}
                >
                  {word.word.trim()}
                </Link>
              ))}
            </div>
          )}
          <Link
            href="?timeline-focus=true"
            className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 w-fit"
            scroll={false}
          >
            <ArrowUpIcon className="w-4 h-4" />
            Acompanhe as notas da música com a letra na timeline acima
          </Link>
        </div>
      </div>
    </section>
  );
}
