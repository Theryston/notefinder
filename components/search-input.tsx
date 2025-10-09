'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SearchIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useCallback, useEffect, useRef, useState } from 'react';

export function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const pathname = usePathname();

  const query = searchParams.get('q') || '';

  const [inputValue, setInputValue] = useState(query);

  const onSearch = useCallback(
    (newQuery: string) => {
      const currentQuery = searchParams.get('q') || '';
      if (!newQuery || newQuery === currentQuery) return;
      router.replace(`/search?q=${newQuery}`);

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setIsSearching(true);
    },
    [router, searchParams],
  );

  const onSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.target as HTMLFormElement);
      const newQuery = formData.get('newQuery') as string;
      onSearch(newQuery);
    },
    [onSearch],
  );

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setInputValue(value);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        onSearch(value);
      }, 1000);
    },
    [onSearch],
  );

  useEffect(() => {
    setIsSearching(false);
  }, [pathname, query]);

  useEffect(() => {
    setInputValue(query);
  }, [query]);

  return (
    <form
      className="flex items-center gap-1 w-full md:w-md relative"
      onSubmit={onSubmit}
    >
      <Input
        name="newQuery"
        type="text"
        placeholder="O que você quer cantar hoje?"
        className="w-full h-12"
        onChange={onChange}
        value={inputValue}
      />

      <Button
        size="icon"
        aria-label="Submit"
        variant="ghost"
        className="absolute right-2"
        type="submit"
        isLoading={isSearching}
      >
        <SearchIcon />
      </Button>
    </form>
  );
}
