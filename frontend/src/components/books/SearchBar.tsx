import { Search } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';

interface SearchBarProps {
  size?: 'md' | 'lg';
  initialQuery?: string;
  autoFocus?: boolean;
  /** Called after a search is submitted, on Escape, and when focus leaves the bar. */
  onDismiss?: () => void;
  className?: string;
}

export default function SearchBar({ size = 'lg', initialQuery = '', autoFocus, onDismiss, className }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const navigate = useNavigate();

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
    onDismiss?.();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Escape') onDismiss?.();
  };

  return (
    <form
      role="search"
      onSubmit={onSubmit}
      onKeyDown={onKeyDown}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) onDismiss?.();
      }}
      className={cn(
        'flex w-full items-center gap-2 rounded-full border border-muted-line bg-surface-raised shadow-soft transition focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/40',
        size === 'lg' ? 'p-2 pl-5' : 'p-1 pl-3',
        className,
      )}
    >
      <Search size={size === 'lg' ? 20 : 18} className="shrink-0 text-muted" aria-hidden="true" />
      <label htmlFor="book-search" className="sr-only">
        Search books
      </label>
      <input
        id="book-search"
        type="search"
        value={query}
        autoFocus={autoFocus}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by title, author, or genre..."
        className="min-w-0 flex-1 bg-transparent py-2 text-base text-ink placeholder:text-muted focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 sm:text-sm"
      />
      <button
        type="submit"
        className={cn(
          'shrink-0 rounded-full bg-primary font-semibold text-primary-fg transition hover:opacity-90 active:scale-[0.98]',
          size === 'lg' ? 'h-11 px-6 text-sm' : 'h-8 px-3 text-xs',
        )}
      >
        Search
      </button>
    </form>
  );
}
