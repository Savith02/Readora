import { cn } from '../../utils/cn';

/** A square avatar with the user's initial. Decorative: the surrounding link or button carries the name. */
export default function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span aria-hidden="true" className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent font-semibold text-accent-fg', className)}>
      {name.trim()[0]?.toUpperCase()}
    </span>
  );
}
