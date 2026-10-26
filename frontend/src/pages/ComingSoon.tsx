import { Hammer } from 'lucide-react';
import Button from '../components/ui/Button';

interface ComingSoonProps {
  /** Name of the page being stood in for, e.g. "Games". */
  page: string;
}

/** Shared placeholder for routes whose pages are not built yet, so every link resolves. */
export default function ComingSoon({ page }: ComingSoonProps) {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent-ink">
        <Hammer size={26} aria-hidden="true" />
      </span>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-ink">{page}</p>
      <h1 className="mt-2 text-3xl font-semibold">Coming soon</h1>
      <Button to="/" className="mt-6">
        Back to Home
      </Button>
    </section>
  );
}
