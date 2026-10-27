import { getBooksByGenre } from '../../data/mockHome';
import type { Genre } from '../../data/mockHome';
import { useAsync } from '../../hooks/useAsync';
import BookCard from '../books/BookCard';
import BookRow, { RowItem } from '../books/BookRow';
import Reveal from '../ui/Reveal';

const ROWS: readonly { genre: Genre; title: string }[] = [
  { genre: 'Mystery', title: 'Mystery & Detective Classics' },
  { genre: 'Adventure', title: 'Adventure Awaits' },
  { genre: 'Classics', title: 'Timeless Classics' },
  { genre: 'Science', title: 'Science & Wonder' },
  { genre: 'Fiction', title: 'Fiction Favorites' },
];

function GenreRow({ genre, title }: { genre: Genre; title: string }) {
  const { data: books } = useAsync(() => getBooksByGenre(genre), [genre]);

  if (!books) return null;

  return (
    <Reveal>
      <BookRow id={`genre-${genre.toLowerCase()}-title`} title={title} action={{ label: 'Explore all', to: `/search?genre=${genre}` }}>
        {books.map((book) => (
          <RowItem key={book.id}>
            <BookCard book={book} />
          </RowItem>
        ))}
      </BookRow>
    </Reveal>
  );
}

export default function GenreRows() {
  return (
    <>
      {ROWS.map((row) => (
        <GenreRow key={row.genre} {...row} />
      ))}
    </>
  );
}
