import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';

interface LogoProps {
  /** Use on dark (night) panels. */
  inverted?: boolean;
}

export default function Logo({ inverted }: LogoProps) {
  return (
    <Link to="/" className="inline-flex items-center gap-2 rounded-lg" aria-label="Readora home">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-fg shadow-soft">
        <BookOpen size={20} strokeWidth={2.4} aria-hidden="true" />
      </span>
      <span className={cn('font-serif text-xl font-bold tracking-tight', inverted ? 'text-night-fg' : 'text-ink')}>Readora</span>
    </Link>
  );
}
