import { getTopBooks } from '../../data/mockHome';
import { useAsync } from '../../hooks/useAsync';
import BookCard from '../books/BookCard';
import BookRow, { RowItem } from '../books/BookRow';
import Reveal from '../ui/Reveal';

export default function TopTenRow() {
  const { data: books } = useAsync(getTopBooks);

  if (!books) return null;

  return (
    <Reveal>
      <BookRow id="top-ten-title" title="Top 10 books in Readora this week">
        {books.map((book, i) => (
          <RowItem key={book.id} bare className="flex items-end">
            <span
              aria-hidden="true"
              className="text-outline -mr-5 select-none font-sans text-[8.5rem] font-bold leading-[0.8] tracking-tighter sm:text-[11rem]"
            >
              {i + 1}
            </span>
            <div className="w-28 sm:w-36 lg:w-40">
              <BookCard book={book} rank={i + 1} />
            </div>
          </RowItem>
        ))}
      </BookRow>
    </Reveal>
  );
}
