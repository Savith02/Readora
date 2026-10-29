import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { usePlatformSettings } from '../../store/platformSettingsStore';

interface LogoProps {
  /** Use on dark (night) panels. */
  inverted?: boolean;
  compact?: boolean;
}

export default function Logo({ inverted, compact }: LogoProps) {
  const { displayName, logoStyle } = usePlatformSettings(state => state.settings);
  return (
    <Link to="/" className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-lg" aria-label={`${displayName} home`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-fg shadow-soft">
        {logoStyle === 'app-icon' ? <img src="/icons/icon-192.png" alt="" className="h-9 w-9 rounded-xl object-contain" /> : <BookOpen size={20} strokeWidth={2.4} aria-hidden="true" />}
      </span>
      {!compact && <span className={cn('max-w-[7rem] truncate font-serif text-xl font-bold tracking-tight sm:max-w-[10rem]', inverted ? 'text-night-fg' : 'text-ink')}>{displayName}</span>}
    </Link>
  );
}
