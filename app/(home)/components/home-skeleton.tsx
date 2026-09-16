import { Skeleton } from '@/components/sheleton';

const HOME_SECTIONS = [
  { key: 'explore', titleWidth: 'w-56', trackCount: 9 },
  { key: 'top-viewed', titleWidth: 'w-48', trackCount: 9, numbered: true },
  { key: 'new', titleWidth: 'w-56', trackCount: 9 },
  { key: 'keep-exploring', titleWidth: 'w-52', trackCount: 24 },
] as const;

export function HomeSkeleton() {
  return (
    <div
      className="flex flex-col gap-4"
      role="status"
      aria-live="polite"
      aria-label="Carregando músicas"
    >
      {HOME_SECTIONS.map((section) => (
        <section key={section.key} className="flex flex-col gap-4">
          <div className={`h-7 ${section.titleWidth}`} aria-hidden="true">
            <Skeleton />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {Array.from({ length: section.trackCount }).map((_, index) => (
              <HomeTrackSkeleton
                key={`${section.key}-${index}`}
                numbered={'numbered' in section && section.numbered}
              />
            ))}
          </div>

          {section.key === 'keep-exploring' && (
            <div className="flex justify-center" aria-hidden="true">
              <div className="h-9 w-32">
                <Skeleton />
              </div>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

function HomeTrackSkeleton({ numbered = false }: { numbered?: boolean }) {
  return (
    <div className="flex min-w-0 w-full h-full gap-2 rounded-md p-2">
      {numbered ? (
        <div
          className="size-20 shrink-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <div className="h-6 w-8">
            <Skeleton />
          </div>
        </div>
      ) : (
        <div
          className="size-20 shrink-0 overflow-hidden rounded-md"
          aria-hidden="true"
        >
          <Skeleton />
        </div>
      )}

      <div className="flex min-w-0 w-full flex-col gap-1" aria-hidden="true">
        <div className="h-4 w-3/4">
          <Skeleton />
        </div>
        <div className="h-3 w-1/2">
          <Skeleton />
        </div>
        <div className="h-3 w-2/3">
          <Skeleton />
        </div>
      </div>
    </div>
  );
}
