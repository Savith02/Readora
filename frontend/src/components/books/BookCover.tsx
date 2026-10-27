import { useState } from 'react';
import { cn } from '../../utils/cn';
import { COVER_GRADIENTS, coverIndex } from '../../utils/cover';
import { initials } from '../../utils/format';

interface BookCoverProps {
  title: string;
  author: string;
  coverUrl?: string;
  className?: string;
}

/**
 * Real cover when `coverUrl` loads, otherwise a generated one (gradient, title, author).
 * Type scales with the cover width via container query units (see .cover in globals.css).
 */
export default function BookCover({ title, author, coverUrl, className }: BookCoverProps) {
  const [failed, setFailed] = useState(false);
  const base = 'relative aspect-[2/3] w-full overflow-hidden rounded-md shadow-soft';

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
      className={cn(base, 'cover bg-gradient-to-br text-night-fg', COVER_GRADIENTS[coverIndex(title)], className)}
    >
      {/* spine shading and a faint monogram */}
      <span className="absolute inset-y-0 left-0 w-[5cqw] bg-night/35" aria-hidden="true" />
      <span className="absolute -bottom-[10cqw] -right-[4cqw] select-none font-serif text-[70cqw] font-bold leading-none opacity-10" aria-hidden="true">
        {initials(title)}
      </span>
      <div className="relative flex h-full flex-col justify-between py-[9cqw] pl-[11cqw] pr-[8cqw]" aria-hidden="true">
        <span className="h-0.5 w-[22cqw] rounded bg-accent" />
        <span className="cover-title line-clamp-4 font-serif font-semibold leading-[1.12]">{title}</span>
        <span className="cover-author line-clamp-2 font-medium uppercase tracking-wider opacity-80">{author}</span>
      </div>
    </div>
  );
}
