import { useReducedMotion } from 'framer-motion';
import { ArrowRight, Info, Pause, Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getFeaturedBooks } from '../../data/mockHome';
import type { FeaturedBook } from '../../data/mockHome';
import { useAsync } from '../../hooks/useAsync';
import { cn } from '../../utils/cn';
import { COVER_GLOWS, coverIndex } from '../../utils/cover';
import BookCover from '../books/BookCover';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

const SLIDE_MS = 8000;
const HERO_MIN_HEIGHT = 'min-h-[38rem] lg:min-h-[46rem]';

interface HeroSlideProps {
  book: FeaturedBook;
  position: number;
  total: number;
  active: boolean;
}

function HeroSlide({ book, position, total, active }: HeroSlideProps) {
  return (
    <div
      role="group"
      aria-roledescription="slide"
      aria-label={`${position} of ${total}`}
      inert={!active}
      className={cn(
        'relative col-start-1 row-start-1 transition-opacity duration-700 motion-reduce:transition-none',
        active ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      <div aria-hidden="true" className={cn('absolute inset-0', COVER_GLOWS[coverIndex(book.title)])} />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-surface via-surface/70 to-transparent" />

      <div className={cn('gutter relative grid items-center gap-6 pb-36 pt-24 sm:pt-28 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12 lg:pb-44 lg:pt-32', HERO_MIN_HEIGHT)}>
        <div className="order-2 lg:order-1">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-accent">Featured book</p>
          <h1 className="line-clamp-3 text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-7xl">{book.title}</h1>
          <p className="mt-3 text-lg text-ink/80">{book.author}</p>
          <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-medium text-ink/70">
            <Badge tone="accent">{book.genre}</Badge>
            <span>{book.pages} pages</span>
            <span>Free to read</span>
          </p>
          <p className="mt-5 line-clamp-3 max-w-xl text-base text-ink/85 sm:text-lg">{book.description}</p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Button to={`/read/${book.id}`} variant="light" size="lg" leftIcon={<Play size={20} className="fill-current" aria-hidden="true" />}>
              Read now
            </Button>
            <Button to={`/book/${book.id}`} variant="glass" size="lg" leftIcon={<Info size={20} aria-hidden="true" />}>
              More info
            </Button>
          </div>

          <a href="#how-it-works" className="mt-6 inline-flex items-center gap-2 rounded text-sm font-medium text-ink/70 transition hover:text-ink">
            <span className="font-serif font-semibold text-ink">Read. Play. Achieve.</span>
            How it works
            <ArrowRight size={16} aria-hidden="true" />
          </a>
        </div>

        <div className="order-1 flex justify-center lg:order-2 lg:justify-end">
          <div className="relative w-28 -rotate-3 transition-transform duration-500 hover:rotate-0 sm:w-40 lg:w-72 lg:rotate-3 lg:hover:rotate-0 xl:w-80">
            <div aria-hidden="true" className="absolute -inset-8 rounded-full bg-accent/15 blur-3xl" />
            <Link to={`/book/${book.id}`} aria-label={`${book.title}, details`} className="relative block rounded-md">
              <BookCover title={book.title} author={book.author} coverUrl={book.coverUrl} className="shadow-lift" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HeroSection() {
  const { data: books } = useAsync(getFeaturedBooks);
  const [index, setIndex] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const reduce = useReducedMotion();

  const total = books?.length ?? 0;
  // Never auto-advance under reduced motion, while the user is pointing/focusing, or when paused.
  const autoplay = !reduce && !userPaused && !hovered && !focused && total > 1;

  useEffect(() => {
    if (!autoplay) return;
    const timer = window.setTimeout(() => setIndex((i) => (i + 1) % total), SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [autoplay, index, total]);

  if (!books) return <div aria-hidden="true" className={cn('dark bg-surface', HERO_MIN_HEIGHT)} />;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured books"
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      {/* Always-dark billboard, whichever theme the page uses. */}
      <div className="dark relative isolate grid grid-cols-1 overflow-hidden bg-surface text-ink" aria-live={autoplay ? 'off' : 'polite'}>
        {books.map((book, i) => (
          <HeroSlide key={book.id} book={book} position={i + 1} total={total} active={i === index} />
        ))}

        {total > 1 && (
          <div className="absolute inset-x-0 bottom-28 z-10 lg:bottom-32">
            <div className="gutter flex items-center justify-end gap-3">
              {!reduce && (
                <button
                  type="button"
                  onClick={() => setUserPaused((p) => !p)}
                  aria-label={userPaused ? 'Play slideshow' : 'Pause slideshow'}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/40 text-ink transition hover:bg-ink/15"
                >
                  {userPaused ? <Play size={14} className="fill-current" aria-hidden="true" /> : <Pause size={14} className="fill-current" aria-hidden="true" />}
                </button>
              )}
              <div role="group" aria-label="Choose a featured book" className="flex items-center">
                {books.map((book, i) => (
                  <button
                    key={book.id}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={`Show ${book.title}`}
                    aria-current={i === index ? 'true' : undefined}
                    className="group flex h-8 w-7 items-center justify-center"
                  >
                    <span className={cn('h-1 rounded-full transition-all', i === index ? 'w-6 bg-ink' : 'w-3 bg-ink/40 group-hover:bg-ink/70')} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fades the billboard into the page background (outside the dark scope on purpose). */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-surface to-transparent" />
    </section>
  );
}
