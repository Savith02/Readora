const stripAccents = (text: string): string => text.normalize('NFD').replace(/[̀-ͯ]/g, '');

/** "Doyle, Arthur Conan" -> "Arthur Conan Doyle"; drops parenthetical bits like "(Herbert George)". */
export function toDisplayName(name: string): string {
  const cleaned = name.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
  const parts = cleaned.split(',');
  return parts.length === 2 && parts[0] && parts[1] ? `${parts[1].trim()} ${parts[0].trim()}` : cleaned;
}

/** Gutendex titles can carry library-catalog subfield markers: "His last bow : $b Some later reminiscences". */
export const cleanCatalogTitle = (title: string): string =>
  title.replace(/\s*:\s*\$[a-z]\s+/gi, ': ').replace(/\s*\$[a-z]\s+/gi, ' ').replace(/\s+/g, ' ').trim();

/** A comparison key for titles: lowercase, no accents or punctuation, no subtitle, no leading article. */
export function normalizeTitle(title: string): string {
  const main = stripAccents(title).toLowerCase().split(/[;:]/)[0] ?? '';
  return main
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(the|a|an) /, '');
}

/** A comparison key for authors: just the surname, so "A. Conan Doyle" matches "Arthur Conan Doyle". */
export function authorKey(name: string | undefined): string {
  if (!name) return '';
  const words = stripAccents(toDisplayName(name))
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  return words[words.length - 1] ?? '';
}

export const normalizeQuery = (query: string): string => query.toLowerCase().replace(/\s+/g, ' ').trim();

const THREE_TO_TWO: Record<string, string> = {
  eng: 'en', fre: 'fr', fra: 'fr', ger: 'de', deu: 'de', spa: 'es', ita: 'it', por: 'pt', rus: 'ru',
  lat: 'la', dut: 'nl', nld: 'nl', gre: 'el', ell: 'el', jpn: 'ja', chi: 'zh', zho: 'zh', swe: 'sv',
  dan: 'da', nor: 'no', fin: 'fi', pol: 'pl', hun: 'hu', cze: 'cs', ces: 'cs', ara: 'ar', heb: 'he',
  wel: 'cy', cym: 'cy', ice: 'is', isl: 'is', tur: 'tr', hin: 'hi',
};

/** "eng" -> "en", "en-GB" -> "en". Unknown codes are returned as they are. */
export function normalizeLanguage(code: string): string {
  const lower = code.toLowerCase().split('-')[0] ?? '';
  return THREE_TO_TWO[lower] ?? lower;
}

/** Years such as "1859" or "22 May 1859". "384 BC" becomes -384. */
export function parseYear(text: string | undefined): number | undefined {
  if (!text) return undefined;
  const match = /\b(\d{3,4})\b/.exec(text);
  if (!match?.[1]) return undefined;
  const year = Number(match[1]);
  return /\b(BC|BCE)\b/i.test(text) ? -year : year;
}
