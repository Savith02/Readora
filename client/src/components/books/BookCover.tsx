import { useState } from 'react';
import { cn } from '../../utils/cn';
import { initials } from '../../utils/format';

// Full class names so Tailwind can see them. Colors come from the cover-* theme tokens.
const GRADIENTS = [
  'from-cover-1 to-primary',
  'from-cover-2 to-primary',
  'from-cover-3 to-primary',
  'from-cover-4 to-primary',
  'from-cover-5 to-primary',
  'from-cover-6 to-primary',
] as const;

const hash = (text: string): number => [...text].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 7);

interface BookCoverProps {
  title: string;
  author: string;
  coverUrl?: string;
  className?: string;
}

export default function BookCover({ title, author, coverUrl, className }: BookCoverProps) {
  const [failed, setFailed] = useState(false);
  const base = 'relative aspect-[2/3] w-full overflow-hidden rounded-lg shadow-soft';

  if (coverUrl && !failed) {
    return (
      <div className={cn(base, className)}>
        <img src={coverUrl} alt={`Cover of ${title} by ${author}`} loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={`Cover of ${title} by ${author}`}
      className={cn(base, 'flex flex-col justify-between bg-gradient-to-br p-3 text-night-fg', GRADIENTS[hash(title) % GRADIENTS.length], className)}
    >
      {/* spine shading */}
      <span className="absolute inset-y-0 left-0 w-2 bg-night/30" aria-hidden="true" />
      <span className="ml-1 h-0.5 w-8 rounded bg-accent" aria-hidden="true" />
      <span className="ml-1 font-serif text-3xl font-semibold leading-none opacity-90" aria-hidden="true">
        {initials(title)}
      </span>
      <span className="ml-1 line-clamp-2 text-[0.65rem] font-medium uppercase tracking-wider opacity-80" aria-hidden="true">
        {author}
      </span>
    </div>
  );
}
