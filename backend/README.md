# Readora backend

Express + TypeScript + MongoDB (Mongoose). Run it from the repo root with `npm run dev -w backend`
(or `npm run dev` to start the frontend too). It listens on `http://localhost:5000`.

Environment variables live in `backend/.env` (see the root `.env.example`):

| Variable | Needed | Purpose |
|---|---|---|
| `MONGO_URI`, `JWT_SECRET`, `PORT` | yes | database, login tokens, port |
| `CONTACT_EMAIL` | yes | goes in the `User-Agent` of every request to Gutendex, Open Library and Standard Ebooks: `Readora/1.0 (contact: you@example.com)` |
| `GOOGLE_BOOKS_API_KEY` | no | switches Google Books (metadata only) on. Without it the source is off and nothing calls Google |

## Books API

All calls to book sources happen on the server, never in the browser. Success responses are
`{ "success": true, "data": ... }`. Errors are `{ "success": false, "message": "..." }`.
The books endpoints are public (no login needed).

### Where books come from

| Source | `source` | Full text? | Notes |
|---|---|---|---|
| Gutendex (Project Gutenberg) | `gutendex` | yes, if `copyright=false` | the main source. Ids are numbers: `1661` |
| Standard Ebooks | `standardebooks` | yes | ids are `author~title` (the `/` in its URL is written `~`): `arthur-conan-doyle~the-adventures-of-sherlock-holmes` |
| Open Library | `openlibrary` | never | metadata and covers. Ids look like `OL262421W` |
| Google Books | `google` | never | only when `GOOGLE_BOOKS_API_KEY` is set |

A book is `readable` only when it comes from Gutendex (public domain) or Standard Ebooks **and**
no known author died less than 70 years ago. Everything else is `metadata-only` and links out
(`externalUrl`) to borrow or buy.

### Example requests (Thunder Client / Postman)

**Search** (all sources, readable books first, duplicates merged)

```
GET http://localhost:5000/api/books/search?q=sherlock
GET http://localhost:5000/api/books/search?q=sherlock&page=2
GET http://localhost:5000/api/books/search?q=sherlock&source=standardebooks
```

```jsonc
{
  "success": true,
  "data": {
    "query": "sherlock",
    "page": 1,
    "hasMore": true,
    "books": [
      {
        "id": "gutendex:1661", "source": "gutendex", "sourceId": "1661",
        "title": "The Adventures of Sherlock Holmes",
        "authors": [{ "name": "Arthur Conan Doyle", "birthYear": 1859, "deathYear": 1930 }],
        "coverUrl": "https://www.gutenberg.org/cache/epub/1661/pg1661.cover.medium.jpg",
        "languages": ["en"], "subjects": ["Detective and mystery stories, English"],
        "readable": true, "license": "public-domain",
        "externalUrl": "https://www.gutenberg.org/ebooks/1661",
        "attribution": "Text from Project Gutenberg (public domain)"
      }
    ],
    "sources": { "gutendex": "ok", "standardebooks": "ok", "openlibrary": "ok", "google": "disabled" },
    "warnings": [],
    "attributions": ["Text from Project Gutenberg (public domain)", "Metadata from Open Library"]
  }
}
```

**Details**

```
GET http://localhost:5000/api/books/gutendex/1661
GET http://localhost:5000/api/books/standardebooks/arthur-conan-doyle~the-adventures-of-sherlock-holmes
GET http://localhost:5000/api/books/openlibrary/OL262421W
```

**Full text** (only for readable books)

```
GET http://localhost:5000/api/books/gutendex/1661/content
GET http://localhost:5000/api/books/gutendex/1661/content?chapter=3
GET http://localhost:5000/api/books/standardebooks/arthur-conan-doyle~the-adventures-of-sherlock-holmes/content
```

```jsonc
{
  "success": true,
  "data": {
    "book": { /* same shape as above */ },
    "totalChapters": 12,
    "toc": [{ "index": 1, "title": "I. A SCANDAL IN BOHEMIA" } /* ... */],
    "chapters": [{ "index": 1, "title": "I. A SCANDAL IN BOHEMIA", "html": "<h2>...</h2><p>...</p>" }],
    "attribution": "Text from Project Gutenberg (public domain)"
  }
}
```

`?chapter=N` (1-based) returns just that chapter; `totalChapters` and `toc` still describe the whole book.

**A book that may not be read here** returns 403 with a link to borrow or buy it:

```
GET http://localhost:5000/api/books/openlibrary/OL262421W/content
```

```json
{
  "success": false,
  "message": "This book is not available to read on Readora",
  "externalUrl": "https://openlibrary.org/works/OL262421W"
}
```

### Status codes

| Code | When |
|---|---|
| 400 | bad query or id (`q` missing, unknown `source`, malformed `sourceId`, `chapter=abc`) |
| 403 | `/content` on a book that is not readable |
| 404 | no such book, chapter number out of range, or a source that is switched off |
| 429 | too many requests (30 searches or 120 book requests per minute per visitor) |
| 502 / 503 / 504 | a source is down, unavailable, or too slow. Other sources are not affected |

### How it behaves

- **Slow sources do not block search.** Gutendex can take 15 to 60 seconds for a search it has not
  seen before. A search answers after at most about 10 seconds with whatever has arrived and lists
  the slow source under `warnings` (`"sources": { "gutendex": "pending" }`). The slow request keeps
  running in the background and fills the cache, so the same search a little later includes it
  immediately. If a source fails, the others' results are still returned.
- **Caching** (MongoDB collection `bookcaches`, expires by itself): searches 24 hours, details
  7 days, full text 30 days. Each source is cached separately, and failures are never cached.
  Google Books data is never stored in the database, only kept in memory for 10 minutes.
- **Outgoing requests:** 10 second timeout (30 for book text, 90 for Gutendex searches), one
  retry on a 5xx, redirects followed, descriptive `User-Agent`.
- **Book text is cleaned** before it is sent: Project Gutenberg's license header and footer are
  removed, then the HTML is sanitised (no scripts, styles, links, images or attributes).
  Standard Ebooks title page, colophon and license pages are removed too.
- **Chapters** are found by heading level (h1 to h4), then "CHAPTER I" style lines, and a book
  with no structure is cut into parts of about 25,000 characters. A title-only section or a byline is
  merged into the chapter after it, and "Contents" is dropped.
- **Known limits:** images inside books are not included (text only). Gutendex can take 30 seconds
  or more to say that an id does not exist, in which case you get a 504. Books over about 12 MB are
  served but not cached.

### Trying it quickly

```
npm run dev -w backend
curl "http://localhost:5000/api/books/search?q=sherlock"
curl "http://localhost:5000/api/books/gutendex/1661/content?chapter=1"
curl -i "http://localhost:5000/api/books/openlibrary/OL262421W/content"   # 403
```

## Auth API

`POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` (see `src/routes/auth.routes.ts`).

## Seeding

`npm run seed -w backend` adds the default tasks and badges (safe to run more than once).
