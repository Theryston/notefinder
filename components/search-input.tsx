import { SearchIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

export function SearchInput() {
  return (
    <form className="flex items-center gap-1 w-full md:w-md relative">
      <Input
        type="text"
        placeholder="O que você quer cantar hoje?"
        className="w-full h-12"
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
