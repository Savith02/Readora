import { Crown } from 'lucide-react';
import type { LeaderboardEntry } from '../../data/mockHome';
import { cn } from '../../utils/cn';
import { initials } from '../../utils/format';
import PointsBadge from '../gamification/PointsBadge';
import Card from '../ui/Card';

interface LeaderboardPreviewProps {
  entries: LeaderboardEntry[];
}

// Podium styling for ranks 1-3.
const PODIUM: Record<number, string> = {
  1: 'bg-accent text-accent-fg',
  2: 'bg-primary text-primary-fg',
  3: 'bg-cover-5 text-night-fg',
};

export default function LeaderboardPreview({ entries }: LeaderboardPreviewProps) {
  return (
    <Card padding="none" className="overflow-hidden">
      <ol aria-label="Top readers this week">
        {entries.map((entry) => {
          const top = entry.rank <= 3;
          return (
            <li
              key={entry.rank}
              className={cn(
                'flex items-center gap-3 border-b border-muted-line/60 px-4 py-3.5 last:border-b-0 sm:gap-4 sm:px-6 sm:py-4',
                top && 'bg-accent-soft/50',
                entry.isYou && 'ring-2 ring-inset ring-accent',
              )}
            >
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                  top ? PODIUM[entry.rank] : 'bg-surface-sunken text-muted',
                )}
              >
                {entry.rank === 1 ? <Crown size={18} aria-hidden="true" /> : entry.rank}
                {entry.rank === 1 && <span className="sr-only">1</span>}
              </span>
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary"
              >
                {initials(entry.name)}
              </span>
              <span className={cn('min-w-0 flex-1 truncate font-medium', top && 'font-semibold')}>
                {entry.name}
                {entry.isYou && <span className="ml-2 text-xs text-muted">(you)</span>}
              </span>
              <PointsBadge points={entry.points} size={top ? 'md' : 'sm'} />
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
