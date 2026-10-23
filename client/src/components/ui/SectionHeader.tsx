import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';

interface SectionHeaderProps {
  title: string;
  id?: string;
  eyebrow?: string;
  subtitle?: string;
  action?: { label: string; to: string };
  align?: 'left' | 'center';
  /** Use on dark (night) panels. */
  inverted?: boolean;
}

export default function SectionHeader({ title, id, eyebrow, subtitle, action, align = 'left', inverted }: SectionHeaderProps) {
  const centered = align === 'center';
  return (
    <div className={cn('mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', centered && 'items-center text-center sm:flex-col sm:items-center')}>
      <div className={cn('max-w-2xl', centered && 'mx-auto')}>
        {eyebrow && (
          <p className={cn('mb-2 text-xs font-semibold uppercase tracking-[0.18em]', inverted ? 'text-accent' : 'text-accent-ink')}>
            {eyebrow}
          </p>
        )}
        <h2 id={id} className="text-2xl font-semibold sm:text-3xl">
          {title}
        </h2>
        {subtitle && <p className={cn('mt-2 text-base', inverted ? 'text-night-fg/75' : 'text-muted')}>{subtitle}</p>}
      </div>
      {action && (
        <Link
          to={action.to}
          className="group inline-flex shrink-0 items-center gap-1.5 rounded-full text-sm font-semibold text-primary hover:underline"
        >
          {action.label}
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
