export const formatNumber = (n: number): string => n.toLocaleString('en-US');

export const initials = (text: string, max = 2): string =>
  text
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, max)
    .map((w) => w[0].toUpperCase())
    .join('');
