import { Loader2 } from 'lucide-react';
import { Skeleton } from './sheleton';

export function PageLoading({
  label = 'Carregando página...',
}: {
  label?: string;
}) {
  return (
    <div
      className="flex min-h-96 flex-col gap-6 py-12"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
        <Loader2
          className="size-5 animate-spin text-primary"
          aria-hidden="true"
        />
        <span>{label}</span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 * 4 }).map((_, index) => (
          <div key={index} className="h-26 w-full">
            <Skeleton />
          </div>
        ))}
      </div>
    </div>
  );
}
