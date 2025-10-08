'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { SearchIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useRef } from 'react';

export function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const query = searchParams.get('q') || '';

  const onSearch = (query: string) => {
    if (!query) return;
    router.push(`/search?q=${query}`);
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const query = formData.get('query') as string;
    onSearch(query);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      onSearch(value);
    }, 1000);
  };

  return (
    <form
      className="flex items-center gap-1 w-full md:w-md relative"
      onSubmit={onSubmit}
    >
      <Input
        name="query"
        type="text"
        placeholder="O que você quer cantar hoje?"
        className="w-full h-12"
        defaultValue={query}
        onChange={onChange}
      />

      <Button
        size="icon"
        aria-label="Submit"
        variant="ghost"
        className="absolute right-2"
        type="submit"
      >
        <SearchIcon />
      </Button>
    </form>
  );
}
