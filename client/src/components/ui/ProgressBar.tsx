import { cn } from '../../utils/cn';

type Tone = 'primary' | 'accent';

interface ProgressBarProps {
  /** 0-100 */
  value: number;
  label: string;
  tone?: Tone;
  className?: string;
}

const fills: Record<Tone, string> = {
  primary: 'bg-primary',
  accent: 'bg-accent',
};

export default function ProgressBar({ value, label, tone = 'accent', className }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-surface-sunken', className)}
    >
      <div className={cn('h-full rounded-full transition-[width] duration-700', fills[tone])} style={{ width: `${pct}%` }} />
    </div>
  );
}
