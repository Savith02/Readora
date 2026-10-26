import { cn } from '../../utils/cn';

type Tone = 'primary' | 'accent';
type Size = 'xs' | 'sm';

interface ProgressBarProps {
  /** 0-100 */
  value: number;
  label: string;
  tone?: Tone;
  /** `xs` is a flat 4px strip for the bottom edge of a poster. */
  size?: Size;
  className?: string;
}

const fills: Record<Tone, string> = {
  primary: 'bg-primary',
  accent: 'bg-accent',
};

const tracks: Record<Size, string> = {
  xs: 'h-1 rounded-none',
  sm: 'h-2 rounded-full',
};

export default function ProgressBar({ value, label, tone = 'accent', size = 'sm', className }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={cn('w-full overflow-hidden bg-surface-sunken', tracks[size], className)}
    >
      <div className={cn('h-full transition-[width] duration-700', size === 'sm' && 'rounded-full', fills[tone])} style={{ width: `${pct}%` }} />
    </div>
  );
}
