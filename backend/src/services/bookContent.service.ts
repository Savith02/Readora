import * as cheerio from 'cheerio';
import sanitizeHtml from 'sanitize-html';
import type { BookChapter } from '@readora/shared';
import type { RawContent } from './adapter.types';

/**
 * Everything that reaches the browser goes through this. Only plain reading markup is kept:
 * no attributes at all (so no classes, ids, styles, event handlers or links), no images,
 * and scripts, styles and iframes are dropped together with their contents.
 */
const SANITIZE: sanitizeHtml.IOptions = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'blockquote', 'q', 'cite', 'pre', 'code',
    'em', 'i', 'strong', 'b', 'u', 's', 'sub', 'sup', 'small', 'div', 'span',
    'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
  ],
  allowedAttributes: {},
  // Tags that are not allowed (a, img, ...) are removed but their text stays.
  disallowedTagsMode: 'discard',
};

const clean = (html: string): string => sanitizeHtml(html, SANITIZE);

// A <br> inside a heading ("I.<br>A SCANDAL") must not glue the words together.
const plainText = (html: string): string =>
  cheerio.load(html.replace(/<br\s*\/?>/gi, ' '), null, false).text().replace(/\s+/g, ' ').trim();

const escapeHtml = (text: string): string => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---- 1. Take the license text out ------------------------------------------------------------

const GUTENBERG_START = /\*{3}\s*START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[^*]*\*{3}/i;
const GUTENBERG_END = /\*{3}\s*END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[^*]*\*{3}/i;

/** Keeps only what is between the "*** START OF" and "*** END OF" markers. Works on HTML and plain text. */
function sliceGutenbergMarkers(source: string): string {
  let text = source;
  const start = GUTENBERG_START.exec(text);
  if (start) text = text.slice(start.index + start[0].length);
  const end = GUTENBERG_END.exec(text);
  if (end) text = text.slice(0, end.index);
  return text;
}

/** Removes the parts of the file that are not the book: head, scripts, and the license blocks. */
function removeBoilerplate(html: string, raw: RawContent): string {
  const $ = cheerio.load(html);
  $('head, script, style, noscript, nav').remove();

  if (raw.gutenberg) {
    $('.pg-boilerplate, #pg-header, #pg-footer, #pg-start-separator, #pg-end-separator').remove();
  }
  if (raw.standardEbooks) {
    const matter = ['titlepage', 'halftitlepage', 'imprint', 'colophon', 'copyright-page', 'uncopyright', 'toc'];
    $(matter.map((type) => `[epub\\:type~="${type}"]`).join(', ')).remove();
  }
  return $('body').html() ?? '';
}

// ---- 2. Plain text -> HTML ---------------------------------------------------------------------

const CHAPTER_WORD = '(?:chapter|book|part|stave|letter|act|scene)';

function plainTextToHtml(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map((block) => block.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean)
    .map((block) => {
      const isHeading = block.length <= 90 && new RegExp(`^${CHAPTER_WORD}\\s+[ivxlcdm\\d]+\\b`, 'i').test(block);
      return isHeading ? `<h2>${escapeHtml(block)}</h2>` : `<p>${escapeHtml(block)}</p>`;
    })
    .join('\n');
}

// ---- 3. Split into chapters ----------------------------------------------------------------------

interface Segment {
  title: string;
  html: string;
}

interface Start {
  index: number;
  title: string;
}

const HEADING = /<h([1-6])>([\s\S]*?)<\/h\1>/g;
const CHAPTER_LINE = new RegExp(`<p>\\s*(${CHAPTER_WORD}\\s+[ivxlcdm\\d]+\\b[^<]{0,80})<\\/p>`, 'gi');
const CONTENTS_TITLE = /^(table of )?contents$|^list of (illustrations|chapters)$/i;
const BYLINE_TITLE = /^by\s/i; // "by Arthur Conan Doyle": belongs to the title page, not to a chapter

const MIN_SEGMENT_CHARS = 120; // shorter than this is just a title or byline, so it joins the next chapter
const MIN_PREAMBLE_CHARS = 400; // text before the first chapter is kept only if it is substantial
const CHUNK_CHARS = 25_000; // size of a part when a book has no headings at all
const MAX_TITLE_CHARS = 120;

/** Where chapters begin: the first heading level (h1-h4) used at least 3 times, else "CHAPTER I" lines. */
function findStarts(html: string): Start[] {
  const headings = [...html.matchAll(HEADING)].map((match) => ({
    level: Number(match[1]),
    index: match.index ?? 0,
    title: plainText(match[2] ?? ''),
  }));

  for (const level of [1, 2, 3, 4]) {
    const atLevel = headings.filter((heading) => heading.level === level && heading.title);
    if (atLevel.filter((heading) => !CONTENTS_TITLE.test(heading.title)).length >= 3) {
      return atLevel.map(({ index, title }) => ({ index, title }));
    }
  }

  const lines = [...html.matchAll(CHAPTER_LINE)].map((match) => ({ index: match.index ?? 0, title: plainText(match[1] ?? '') }));
  return lines.length >= 3 ? lines : [];
}

function chunkBySize(html: string): Segment[] {
  const chunks: string[] = [];
  let current = '';
  for (const paragraph of html.split(/(?<=<\/p>)/)) {
    if (current && current.length + paragraph.length > CHUNK_CHARS) {
      chunks.push(current);
      current = '';
    }
    current += paragraph;
  }
  if (current) chunks.push(current);
  return chunks.map((chunk, i) => ({ title: `Part ${i + 1}`, html: chunk }));
}

function splitIntoChapters(html: string, bookTitle: string): BookChapter[] {
  const starts = findStarts(html);
  let segments: Segment[] = [];

  if (starts.length > 0) {
    const preamble = html.slice(0, starts[0]?.index ?? 0);
    const found = starts
      .map((start, i) => ({ title: start.title, html: html.slice(start.index, starts[i + 1]?.index ?? html.length) }))
      .filter((segment) => !CONTENTS_TITLE.test(segment.title) && !BYLINE_TITLE.test(segment.title));

    // A segment that is only a title or byline is joined to the chapter after it.
    let carry = '';
    found.forEach((segment, i) => {
      const joined = carry + segment.html;
      const isLast = i === found.length - 1;
      if (!isLast && plainText(segment.html).length < MIN_SEGMENT_CHARS) {
        carry = joined;
      } else {
        segments.push({ title: segment.title, html: joined });
        carry = '';
      }
    });

    if (plainText(preamble).length >= MIN_PREAMBLE_CHARS) {
      segments.unshift({ title: plainText(/<h[1-6]>([\s\S]*?)<\/h[1-6]>/.exec(preamble)?.[1] ?? '') || bookTitle, html: preamble });
    }
  }

  // No usable headings (or only one chapter): cut into parts of a readable size instead.
  if (segments.length <= 1) segments = chunkBySize(html);
  if (segments.length === 1 && segments[0]) segments = [{ title: bookTitle, html: segments[0].html }];

  return segments
    .map((segment, i) => ({
      index: i + 1,
      title: (segment.title || `Chapter ${i + 1}`).slice(0, MAX_TITLE_CHARS),
      // Splitting can leave a tag open or closed in the wrong place; sanitising again rebalances it.
      html: clean(segment.html).trim(),
    }))
    .filter((chapter) => chapter.html)
    .map((chapter, i) => ({ ...chapter, index: i + 1 }));
}

// ---- Entry point ------------------------------------------------------------------------------------

/** Raw book file -> clean, sanitised chapters. */
export function buildChapters(raw: RawContent, bookTitle: string): BookChapter[] {
  const body = raw.gutenberg ? sliceGutenbergMarkers(raw.body) : raw.body;
  const html = raw.kind === 'text' ? plainTextToHtml(body) : removeBoilerplate(body, raw);
  return splitIntoChapters(clean(html), bookTitle);
}
