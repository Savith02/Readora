import { getContinueReading } from '../../data/mockHome';
import { useAsync } from '../../hooks/useAsync';
import BookCard from '../books/BookCard';
import Reveal from '../ui/Reveal';
import SectionHeader from '../ui/SectionHeader';

export default function ContinueReading() {
  const { data: books } = useAsync(getContinueReading);

  if (!books || books.length === 0) return null;

  return (
    <section aria-labelledby="continue-title" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Reveal>
        <SectionHeader id="continue-title" title="Continue reading" subtitle="Pick up right where you left off." />
        <ul
          className="relative -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 scrollbar-none sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0"
          aria-label="Books in progress"
          tabIndex={0}
        >
          {books.map((book) => (
            <li key={book.id} className="w-44 shrink-0 snap-start sm:w-52">
              <BookCard variant="continue" book={book} />
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
