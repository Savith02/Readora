import { Flame } from 'lucide-react';
import { cn } from '../../utils/cn';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface StreakCounterProps {
  days: number;
  /** `pill` for the navbar, `card` for the progress panel (shows the last 7 days). */
  variant?: 'pill' | 'card';
  /** Last 7 days, oldest first. Only used by the `card` variant. */
  week?: boolean[];
  className?: string;
}

export default function StreakCounter({ days, variant = 'pill', week, className }: StreakCounterProps) {
  if (variant === 'pill') {
    return (
      <span
        className={cn('inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1.5 text-sm font-semibold text-primary', className)}
        title={`${days} day streak`}
      >
        <Flame size={14} className="fill-accent text-accent" aria-hidden="true" />
        <span>
          {days}
          <span className="sr-only"> day streak</span>
        </span>
      </span>
    );
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft">
          <Flame size={26} className="fill-accent text-accent" aria-hidden="true" />
        </span>
        <p className="font-serif text-4xl font-semibold leading-none">
          {days}
          <span className="ml-1.5 font-sans text-base font-medium text-muted">day streak</span>
        </p>
      </div>
      {week && (
        <ol className="flex items-center gap-1.5" aria-label="Reading activity, last 7 days">
          {week.map((active, i) => (
            <li key={i} className="flex flex-1 flex-col items-center gap-1">
              <span
                className={cn(
                  'flex h-7 w-full max-w-9 items-center justify-center rounded-lg text-xs font-semibold',
                  active ? 'bg-accent text-accent-fg' : 'bg-surface-sunken text-muted',
                )}
              >
                {DAY_LABELS[i]}
              </span>
              <span className="sr-only">{active ? 'read' : 'missed'}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
