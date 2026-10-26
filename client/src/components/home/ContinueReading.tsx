import { getContinueReading } from '../../data/mockHome';
import { useAsync } from '../../hooks/useAsync';
import BookCard from '../books/BookCard';
import BookRow, { RowItem } from '../books/BookRow';

export default function ContinueReading() {
  const { data: books } = useAsync(getContinueReading);

  if (!books || books.length === 0) return null;

  // In the dark theme this row rides up over the bottom of the billboard.
  return (
    <div className="relative z-10 dark:-mt-20 lg:dark:-mt-28">
      <BookRow id="continue-title" title="Continue reading" subtitle="Pick up right where you left off.">
        {books.map((book) => (
          <RowItem key={book.id}>
            <BookCard variant="continue" book={book} />
          </RowItem>
        ))}
      </BookRow>
    </div>
  );
}
