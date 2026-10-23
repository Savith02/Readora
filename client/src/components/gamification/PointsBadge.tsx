import { Star } from 'lucide-react';
import { cn } from '../../utils/cn';
import { formatNumber } from '../../utils/format';

type Size = 'sm' | 'md' | 'lg';

interface PointsBadgeProps {
  points: number;
  size?: Size;
  /** Show a leading "+" (for rewards). */
  prefix?: boolean;
  className?: string;
}

const sizes: Record<Size, { wrap: string; icon: number }> = {
  sm: { wrap: 'gap-1 px-2.5 py-1 text-xs', icon: 12 },
  md: { wrap: 'gap-1.5 px-3 py-1.5 text-sm', icon: 14 },
  lg: { wrap: 'gap-2 px-4 py-2 text-2xl font-serif', icon: 22 },
};

export default function PointsBadge({ points, size = 'md', prefix, className }: PointsBadgeProps) {
  const { wrap, icon } = sizes[size];
  return (
    <span
      className={cn('inline-flex items-center rounded-full bg-accent-soft font-semibold text-accent-ink', wrap, className)}
      title={`${formatNumber(points)} points`}
    >
      <Star size={icon} className="fill-accent text-accent" aria-hidden="true" />
      <span>
        {prefix && '+'}
        {formatNumber(points)}
        <span className="sr-only"> points</span>
      </span>
    </span>
  );
}
