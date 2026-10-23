import { motion, useReducedMotion } from 'framer-motion';
import type { Book } from '../../data/mockHome';
import BookCard from './BookCard';

interface BookGridProps {
  books: Book[];
}

export default function BookGrid({ books }: BookGridProps) {
  const reduce = useReducedMotion();

  if (books.length === 0) {
    return <p className="rounded-2xl bg-surface-sunken p-8 text-center text-muted">No books in this genre yet.</p>;
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {books.map((book, i) => (
        <motion.li
          key={book.id}
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3) }}
        >
          <BookCard book={book} />
        </motion.li>
      ))}
    </ul>
  );
}
