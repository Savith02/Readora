import { Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Book, ReadingBook } from '../../data/mockHome';
import ProgressBar from '../ui/ProgressBar';
import BookCover from './BookCover';

type BookCardProps =
  | { variant?: 'browse'; book: Book; /** Position in a ranked row (Top 10). */ rank?: number }
  | { variant: 'continue'; book: ReadingBook; rank?: undefined };

/**
 * Poster-style card. The whole cover links to the details page. Browse posters show a
 * play button on hover/focus; continue posters show a progress strip and a Resume button.
 */
export default function BookCard(props: BookCardProps) {
  const { book } = props;
  const label = `${props.rank ? `Number ${props.rank}: ` : ''}${book.title} by ${book.author}`;

  return (
    <article className="group/card relative">
      <div className="relative origin-center transition duration-300 ease-out group-focus-within/card:z-20 group-focus-within/card:scale-[1.07] group-hover/card:z-20 group-hover/card:scale-[1.07] motion-reduce:transform-none motion-reduce:transition-none">
        <Link to={`/book/${book.id}`} aria-label={label} className="block rounded-md">
          <BookCover title={book.title} author={book.author} coverUrl={book.coverUrl} className="shadow-lift" />
        </Link>

        {props.variant === 'continue' ? (
          <ProgressBar
            value={props.book.progress}
            label={`${book.title} reading progress`}
            size="xs"
            className="absolute inset-x-0 bottom-0 rounded-b-md bg-night-fg/30"
          />
        ) : (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end gap-2 rounded-b-md bg-gradient-to-t from-night from-60% to-transparent p-2.5 pt-14 text-night-fg opacity-0 transition-opacity duration-200 group-focus-within/card:opacity-100 group-hover/card:opacity-100">
            <Link
              to={`/read/${book.id}`}
              aria-label={`Read ${book.title}`}
              className="pointer-events-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-night-fg text-night transition hover:bg-accent hover:text-accent-fg"
            >
              <Play size={16} className="ml-0.5 fill-current" aria-hidden="true" />
            </Link>
            <p className="min-w-0 flex-1 pb-0.5 text-[0.7rem] font-medium leading-tight">
              {book.genre} · {book.pages} pages
            </p>
          </div>
        )}
      </div>

      {props.variant === 'continue' && (
        <div className="mt-3 flex flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:gap-2">
          <Link
            to={`/read/${book.id}`}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-ink px-3 text-xs font-semibold text-surface transition hover:bg-ink/85"
          >
            <Play size={12} className="fill-current" aria-hidden="true" />
            Resume
            <span className="sr-only"> {book.title}</span>
          </Link>
          <span className="text-xs text-muted">{props.book.progress}% read</span>
        </div>
      )}
    </article>
  );
}
