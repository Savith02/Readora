import { useMemo, useState } from 'react';
import { GENRES, getTrendingBooks } from '../../data/mockHome';
import type { Genre } from '../../data/mockHome';
import { useAsync } from '../../hooks/useAsync';
import BookGrid from '../books/BookGrid';
import Chip from '../ui/Chip';
import Reveal from '../ui/Reveal';
import SectionHeader from '../ui/SectionHeader';

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

  return (
    <section aria-labelledby="trending-title" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Reveal>
        <SectionHeader id="trending-title" title="Popular & trending" subtitle="Classics readers are finishing right now." />
        <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filter by genre">
          {FILTERS.map((f) => (
            <Chip key={f} label={f} selected={filter === f} onSelect={() => setFilter(f)} />
          ))}
        </div>
        <p className="sr-only" role="status">
          Showing {visible.length} {filter === 'All' ? '' : `${filter} `}books
        </p>
        <BookGrid key={filter} books={visible} />
      </Reveal>
    </section>
  );
}
