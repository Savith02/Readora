// Full class names so Tailwind can see them. Colors come from the cover-* theme tokens.
export const COVER_GRADIENTS = [
  'from-cover-1 to-night',
  'from-cover-2 to-night',
  'from-cover-3 to-night',
  'from-cover-4 to-night',
  'from-cover-5 to-night',
  'from-cover-6 to-night',
] as const;

/** Soft colored glow used behind the hero billboard, matching each cover. */
export const COVER_GLOWS = [
  'bg-[radial-gradient(ellipse_at_75%_30%,rgb(var(--cover-1)/0.6),transparent_62%)]',
  'bg-[radial-gradient(ellipse_at_75%_30%,rgb(var(--cover-2)/0.6),transparent_62%)]',
  'bg-[radial-gradient(ellipse_at_75%_30%,rgb(var(--cover-3)/0.6),transparent_62%)]',
  'bg-[radial-gradient(ellipse_at_75%_30%,rgb(var(--cover-4)/0.6),transparent_62%)]',
  'bg-[radial-gradient(ellipse_at_75%_30%,rgb(var(--cover-5)/0.6),transparent_62%)]',
  'bg-[radial-gradient(ellipse_at_75%_30%,rgb(var(--cover-6)/0.6),transparent_62%)]',
] as const;

const hash = (text: string): number => [...text].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 7);

/** Stable palette index for a title, shared by the cover and the hero glow. */
export const coverIndex = (title: string): number => hash(title) % COVER_GRADIENTS.length;
