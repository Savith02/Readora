import { Search } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';

interface SearchBarProps {
  size?: 'md' | 'lg';
  initialQuery?: string;
  className?: string;
}

export default function SearchBar({ size = 'lg', initialQuery = '', className }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const navigate = useNavigate();

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = query.trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <form
      role="search"
      onSubmit={onSubmit}
      className={cn(
        'flex w-full items-center gap-2 rounded-full border border-muted-line bg-surface-raised shadow-soft transition focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/40',
        size === 'lg' ? 'p-2 pl-5' : 'p-1.5 pl-4',
        className,
      )}
    >
      <Search size={20} className="shrink-0 text-muted" aria-hidden="true" />
      <label htmlFor="book-search" className="sr-only">
        Search books
      </label>
      <input
        id="book-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by title, author, or genre..."
        className="min-w-0 flex-1 bg-transparent py-2 text-base text-ink placeholder:text-muted focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      <button
        type="submit"
        className={cn(
          'shrink-0 rounded-full bg-primary font-semibold text-primary-fg transition hover:opacity-90 active:scale-[0.98]',
          size === 'lg' ? 'h-11 px-6 text-sm' : 'h-9 px-4 text-sm',
        )}
      >
        Search
      </button>
    </form>
  );
}
