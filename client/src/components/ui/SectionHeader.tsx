import { ArrowRight, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';

interface SectionHeaderProps {
  title: string;
  id?: string;
  eyebrow?: string;
  subtitle?: string;
  action?: { label: string; to: string };
  align?: 'left' | 'center';
  /** `row` is the compact title used above poster rows and dashboard strips. */
  variant?: 'section' | 'row';
  /** Use on dark (night) panels. */
  inverted?: boolean;
}

export default function SectionHeader({ title, id, eyebrow, subtitle, action, align = 'left', variant = 'section', inverted }: SectionHeaderProps) {
  if (variant === 'row') {
    return (
      <div className="mb-3 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 id={id} className="font-sans text-lg font-semibold sm:text-2xl">
            {title}
          </h2>
          {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
        </div>
        {action && (
          <Link to={action.to} className="group inline-flex shrink-0 items-center gap-0.5 rounded text-sm font-semibold text-muted transition hover:text-ink">
            {action.label}
            <ChevronRight size={18} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        )}
      </div>
    );
  }

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
