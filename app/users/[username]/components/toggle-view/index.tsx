import { Skeleton } from '@/components/sheleton';
import { Suspense } from 'react';
import { ToggleViewContent } from './content';

export function ToggleView({ sectionKey }: { sectionKey: string }) {
  return (
    <Suspense fallback={<ToggleViewLoading />}>
      <ToggleViewContent sectionKey={sectionKey} />
    </Suspense>
  );
}

function ToggleViewLoading() {
  return (
    <div className="size-9">
      <Skeleton />
    </div>
  );
}
