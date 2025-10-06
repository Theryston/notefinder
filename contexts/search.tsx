'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

type SearchContextType = {
  onSearch: (search: string) => void;
  searchTerm: string;
};

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  // TODO: add a hook to handle the search term

  const onSearch = useCallback(
    (search: string) => {
      setSearchTerm(search);

      if (pathname !== '/search') router.push(`/search?q=${search}`);
    },
    [pathname, router],
  );

  useEffect(() => {
    const search = searchParams.get('q');
    if (search) setSearchTerm(search);
  }, [searchParams]);

  return (
    <SearchContext.Provider value={{ onSearch, searchTerm }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);

  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }

  return context;
};
