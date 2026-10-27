import { useId } from 'react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends Omit<ComponentPropsWithRef<'input'>, 'id'> {
  label: string;
  /** Error message; also marks the field invalid for screen readers. */
  error?: string;
  hint?: string;
  /** Content inside the right edge of the field, e.g. a show/hide button. */
  trailing?: ReactNode;
}

export default function Input({ label, error, hint, trailing, className, ...rest }: InputProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint && !error ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'h-12 w-full rounded-md border bg-surface-sunken px-4 text-base text-ink transition placeholder:text-muted focus:border-accent',
            error ? 'border-danger' : 'border-muted-line',
            trailing ? 'pr-12' : null,
            className,
          )}
          {...rest}
        />
        {trailing && <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>}
      </div>
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
