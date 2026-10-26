import { useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';
import SectionHeader from '../ui/SectionHeader';

interface BookRowProps {
  id: string;
  title: string;
  subtitle?: string;
  action?: { label: string; to: string };
  /** Content between the title and the posters, e.g. filter chips. */
  controls?: ReactNode;
  /** Changing this scrolls the row back to the start. */
  resetKey?: string;
  /** `RowItem`s. */
  children: ReactNode;
}

const ARROW =
  'absolute inset-y-6 z-30 hidden w-8 items-center justify-center bg-surface/60 text-ink opacity-0 backdrop-blur-sm transition hover:bg-surface/85 group-hover/row:opacity-100 md:flex lg:w-12';

/** Default poster width. Pass `bare` to size an item yourself (Top 10). */
export function RowItem({ children, bare, className }: { children: ReactNode; bare?: boolean; className?: string }) {
  return (
    <li className={cn('shrink-0 snap-start', !bare && 'w-28 sm:w-36 md:w-40 lg:w-44 xl:w-48 2xl:w-52', className)}>{children}</li>
  );
}

/**
 * Horizontal poster row. The arrows are a mouse affordance and stay out of the tab order:
 * keyboard users move through the posters themselves, which scroll into view.
 */
export default function BookRow({ id, title, subtitle, action, controls, resetKey, children }: BookRowProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const reduce = useReducedMotion();

  const update = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const start = el.scrollLeft <= 4;
    const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    setEdges((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
  }, []);

  // Cheap and safe after every render: it only sets state when an edge flips.
  useEffect(update);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [update]);

  useEffect(() => {
    listRef.current?.scrollTo({ left: 0 });
  }, [resetKey]);

  const scroll = (direction: -1 | 1) => {
    const el = listRef.current;
    el?.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <section aria-labelledby={id} className="group/row gutter py-3 sm:py-4">
      <div className="relative z-10">
        <SectionHeader variant="row" id={id} title={title} subtitle={subtitle} action={action} />
        {controls}
      </div>
      <div className="relative -mx-4 -my-6 sm:-mx-8 lg:-mx-12">
        {!edges.start && (
          <button type="button" tabIndex={-1} aria-label={`Scroll ${title} left`} onClick={() => scroll(-1)} className={cn(ARROW, 'left-0')}>
            <ChevronLeft size={28} aria-hidden="true" />
          </button>
        )}
        <ul
          ref={listRef}
          onScroll={update}
          className="flex snap-x snap-proximity scroll-px-4 gap-2 overflow-x-auto px-4 py-6 scrollbar-none sm:scroll-px-8 sm:gap-3 sm:px-8 lg:scroll-px-12 lg:px-12"
        >
          {children}
        </ul>
        {!edges.end && (
          <button type="button" tabIndex={-1} aria-label={`Scroll ${title} right`} onClick={() => scroll(1)} className={cn(ARROW, 'right-0')}>
            <ChevronRight size={28} aria-hidden="true" />
          </button>
        )}
      </div>
    </section>
  );
}
