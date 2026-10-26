import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

type Tone = 'neutral' | 'accent' | 'primary';

interface BadgeProps {
  tone?: Tone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

const tones: Record<Tone, string> = {
  neutral: 'bg-surface-sunken text-muted',
  accent: 'bg-accent-soft text-accent-ink',
  primary: 'bg-primary-soft text-primary',
};

export default function Badge({ tone = 'neutral', icon, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
