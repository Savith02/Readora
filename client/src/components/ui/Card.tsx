import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/cn';

type Tone = 'raised' | 'sunken' | 'night';
type Padding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: Tone;
  padding?: Padding;
  /** Lifts slightly on hover. */
  interactive?: boolean;
  children: ReactNode;
}

const tones: Record<Tone, string> = {
  raised: 'border border-muted-line/70 bg-surface-raised shadow-soft',
  sunken: 'bg-surface-sunken',
  night: 'bg-night text-night-fg',
};

const paddings: Record<Padding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
};

export default function Card({ tone = 'raised', padding = 'md', interactive, className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl',
        tones[tone],
        paddings[padding],
        interactive && 'transition duration-200 hover:-translate-y-1 hover:shadow-lift',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
