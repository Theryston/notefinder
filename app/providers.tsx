import { SearchProvider } from '@/contexts/search';

export function Providers({ children }: { children: React.ReactNode }) {
  return <SearchProvider>{children}</SearchProvider>;
}
