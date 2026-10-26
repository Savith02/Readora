import { useMemo, useState } from 'react';
import { GENRES, getTrendingBooks } from '../../data/mockHome';
import type { Genre } from '../../data/mockHome';
import { useAsync } from '../../hooks/useAsync';
import BookCard from '../books/BookCard';
import BookRow, { RowItem } from '../books/BookRow';
import Chip from '../ui/Chip';
import Reveal from '../ui/Reveal';

type Filter = 'All' | Genre;

const FILTERS: readonly Filter[] = ['All', ...GENRES];

export default function TrendingBooks() {
  const { data: books } = useAsync(getTrendingBooks);
  const [filter, setFilter] = useState<Filter>('All');

  const visible = useMemo(
    () => (books ?? []).filter((b) => filter === 'All' || b.genre === filter),
    [books, filter],
  );

  if (!books) return null;

  const chips = (
    <div className="-mx-4 mb-2 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filter trending books by genre">
      {FILTERS.map((f) => (
        <Chip key={f} label={f} selected={filter === f} onSelect={() => setFilter(f)} />
      ))}
      <p className="sr-only" role="status">
        Showing {visible.length} {filter === 'All' ? '' : `${filter} `}books
      </p>
    </div>
  );

  return (
    <Reveal>
      <BookRow id="trending-title" title="Trending now" controls={chips} resetKey={filter}>
        {visible.map((book) => (
          <RowItem key={book.id}>
            <BookCard book={book} />
          </RowItem>
        ))}
      </BookRow>
    </Reveal>
  );
}
