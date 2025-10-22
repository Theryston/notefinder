'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { isMobile } from 'react-device-detect';
import type { Lyrics, LyricsWord } from '@/lib/constants';

type LyricsPhrase = {
  words: LyricsWord[];
  start: number;
  end: number;
};

const MAX_WORDS_PER_PHRASE = isMobile ? 8 : 10;
const MAX_TIME_GAP_SECONDS = 1.5;

export function LyricsDisplay({
  lyrics,
  currentTime,
}: {
  lyrics: Lyrics;
  currentTime: number;
}) {
  const phrases = useMemo(() => {
    if (!lyrics?.words || lyrics.words.length === 0) return [];

    const result: LyricsPhrase[] = [];
    let currentPhrase: LyricsWord[] = [];

    for (let i = 0; i < lyrics.words.length; i++) {
      const word = lyrics.words[i];
      const prevWord = currentPhrase[currentPhrase.length - 1];

      const shouldStartNewPhrase =
        currentPhrase.length >= MAX_WORDS_PER_PHRASE ||
        (prevWord && word.start - prevWord.end > MAX_TIME_GAP_SECONDS);

      if (shouldStartNewPhrase && currentPhrase.length > 0) {
        result.push({
          words: currentPhrase,
          start: currentPhrase[0].start,
          end: currentPhrase[currentPhrase.length - 1].end,
        });
        currentPhrase = [];
      }

      currentPhrase.push(word);
    }

    if (currentPhrase.length > 0) {
      result.push({
        words: currentPhrase,
        start: currentPhrase[0].start,
        end: currentPhrase[currentPhrase.length - 1].end,
      });
    }

    return result;
  }, [lyrics]);

  const currentPhrase = useMemo(() => {
    if (phrases.length === 0) return null;

    let activePhrase: LyricsPhrase | null = null;
    let nextPhrase: LyricsPhrase | null = null;

    for (let i = 0; i < phrases.length; i++) {
      const phrase = phrases[i];

      if (currentTime >= phrase.start && currentTime <= phrase.end) {
        return phrase;
      }

      if (currentTime < phrase.start) {
        nextPhrase = phrase;
        break;
      }

      activePhrase = phrase;
    }

    if (nextPhrase && nextPhrase.start - currentTime <= 2) {
      return nextPhrase;
    }

    if (activePhrase && currentTime - activePhrase.end <= 1) {
      return activePhrase;
    }

    return nextPhrase || activePhrase;
  }, [phrases, currentTime]);

  if (!currentPhrase) return null;

  return (
    <div
      className={cn(
        'absolute bottom-6 pointer-events-none flex flex-wrap justify-center items-center gap-x-1',
        isMobile
          ? 'right-0 w-2/3'
          : 'left-1/2 -translate-x-1/2 z-20 w-full max-w-[90%]',
      )}
    >
      {currentPhrase.words.map((word, index) => {
        const isPast = currentTime > word.end;
        const isFuture = currentTime < word.start;
        const isCurrent = !isPast && !isFuture;

        const progress = isCurrent
          ? Math.max(
              0,
              Math.min(1, (currentTime - word.start) / (word.end - word.start)),
            )
          : 0;

        return (
          <span
            key={`${word.start}-${index}`}
            className={cn(
              'relative inline-block font-semibold leading-tight',
              isMobile ? 'text-md' : 'text-lg',
            )}
          >
            <span
              className={cn(
                'relative',
                isFuture && 'text-muted-foreground/50',
                isPast && 'text-primary font-bold',
                isCurrent && 'text-transparent',
              )}
            >
              {word.word}
            </span>

            {isCurrent && (
              <>
                <span className="absolute inset-0 text-muted-foreground/50">
                  {word.word}
                </span>
                <span
                  className="absolute inset-0 text-primary font-bold overflow-hidden"
                  style={{
                    clipPath: `inset(0 ${100 - progress * 100}% 0 0)`,
                  }}
                >
                  {word.word}
                </span>
              </>
            )}
          </span>
        );
      })}
    </div>
  );
}
