import type { ReactNode } from 'react';

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Link to the other auth page, shown under the form. */
  footer?: ReactNode;
}

/** The centred card shared by the login and register pages. */
export default function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <section className="relative isolate flex min-h-[calc(100svh-4rem)] items-center justify-center px-4 py-12">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_0%,rgb(var(--cover-3)/0.35),transparent_60%),radial-gradient(ellipse_at_90%_80%,rgb(var(--cover-6)/0.25),transparent_55%)]"
      />
      <div className="w-full max-w-md rounded-2xl border border-muted-line/70 bg-surface-raised/90 p-6 shadow-lift backdrop-blur sm:p-10">
        <h1 className="text-3xl font-bold">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
        <div className="mt-8">{children}</div>
        {footer && <div className="mt-8 border-t border-muted-line/70 pt-6 text-sm text-muted">{footer}</div>}
      </div>
    </section>
  );
}
