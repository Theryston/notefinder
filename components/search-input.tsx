'use client';

import { SearchIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField } from './ui/form';
import { useCallback, useEffect } from 'react';
import { useSearch } from '@/contexts/search';

const searchSchema = z.object({
  search: z.string().min(1),
});

type SearchFormData = z.infer<typeof searchSchema>;

export function SearchInput() {
  const { onSearch, searchTerm } = useSearch();

  const form = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      search: searchTerm,
    },
  });

  const onSubmit = useCallback(
    (data: SearchFormData) => {
      onSearch(data.search);
    },
    [onSearch],
  );

  useEffect(() => {
    form.setValue('search', searchTerm);
  }, [searchTerm, form]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex items-center gap-1 w-full md:w-md relative"
      >
        <FormField
          control={form.control}
          name="search"
          render={({ field }) => (
            <Input
              type="text"
              placeholder="O que você quer cantar hoje?"
              className="w-full h-12"
              {...field}
            />
          )}
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
    </Form>
  );
}
