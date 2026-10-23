import { Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Book, ReadingBook } from '../../data/mockHome';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import ProgressBar from '../ui/ProgressBar';
import BookCover from './BookCover';

type BookCardProps =
  | { variant?: 'browse'; book: Book }
  | { variant: 'continue'; book: ReadingBook };

export default function BookCard(props: BookCardProps) {
  const { book } = props;

  return (
    <article className="group flex h-full flex-col gap-3 rounded-2xl border border-muted-line/70 bg-surface-raised p-3 shadow-soft transition duration-200 hover:-translate-y-1 hover:shadow-lift">
      <Link to={`/book/${book.id}`} className="rounded-lg" aria-label={`${book.title}, details`}>
        <BookCover title={book.title} author={book.author} coverUrl={book.coverUrl} className="transition-transform duration-300 group-hover:scale-[1.02]" />
      </Link>
      <div className="flex flex-1 flex-col gap-1 px-1">
        <h3 className="line-clamp-2 font-serif text-base font-semibold leading-snug">
          <Link to={`/book/${book.id}`} className="hover:underline">
            {book.title}
          </Link>
        </h3>
        <p className="line-clamp-1 text-sm text-muted">{book.author}</p>
      </div>
      {props.variant === 'continue' ? (
        <div className="flex flex-col gap-3 px-1 pb-1">
          <div>
            <div className="mb-1.5 flex justify-between text-xs font-medium text-muted">
              <span>Progress</span>
              <span>{props.book.progress}%</span>
            </div>
            <ProgressBar value={props.book.progress} label={`${book.title} reading progress`} />
          </div>
          <Button to={`/read/${book.id}`} size="sm" fullWidth leftIcon={<Play size={14} className="fill-current" aria-hidden="true" />}>
            Resume
            <span className="sr-only"> {book.title}</span>
          </Button>
        </div>
      ) : (
        <div className="px-1 pb-1">
          <Badge tone="primary">{book.genre}</Badge>
        </div>
      )}
    </article>
  );
}
