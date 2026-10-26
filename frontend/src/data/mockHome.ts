// Mock data for the Home page. Each get* function returns a Promise on purpose:
// to go live, replace its body with a call from src/api/*.api.ts (example at the
// bottom of this file) and nothing in the components has to change.

export type Genre = 'Fiction' | 'Mystery' | 'Adventure' | 'Classics' | 'Science';

export const GENRES: readonly Genre[] = ['Fiction', 'Mystery', 'Adventure', 'Classics', 'Science'];

export interface Book {
  id: string;
  title: string;
  author: string;
  genre: Genre;
  coverUrl?: string;
  pages: number;
}

export interface ReadingBook extends Book {
  /** 0-100 */
  progress: number;
}

export interface FeaturedBook extends Book {
  description: string;
}

export interface UserSummary {
  name: string;
  points: number;
  streak: number;
}

export interface TodayStats {
  pagesRead: number;
  dailyGoal: number;
  streak: number;
  /** Which of the last 7 days (oldest first) had reading activity. */
  week: boolean[];
  pointsToday: number;
  pointsYesterday: number;
}

export type TaskKind = 'pages' | 'chapter' | 'quiz';

export interface DailyTask {
  id: string;
  kind: TaskKind;
  title: string;
  description: string;
  progress: number;
  target: number;
  rewardPoints: number;
}

export type GameKind = 'quiz' | 'puzzle';

export interface MiniGame {
  id: string;
  kind: GameKind;
  title: string;
  description: string;
  durationMinutes: number;
  rewardPoints: number;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  points: number;
  isYou?: boolean;
}

export const BOOKS: Book[] = [
  // Classics
  { id: '1342', title: 'Pride and Prejudice', author: 'Jane Austen', genre: 'Classics', pages: 432 },
  { id: '1400', title: 'Great Expectations', author: 'Charles Dickens', genre: 'Classics', pages: 505 },
  { id: '514', title: 'Little Women', author: 'Louisa May Alcott', genre: 'Classics', pages: 449 },
  { id: '1260', title: 'Jane Eyre', author: 'Charlotte Brontë', genre: 'Classics', pages: 500 },
  { id: '768', title: 'Wuthering Heights', author: 'Emily Brontë', genre: 'Classics', pages: 416 },
  { id: '98', title: 'A Tale of Two Cities', author: 'Charles Dickens', genre: 'Classics', pages: 489 },
  { id: '158', title: 'Emma', author: 'Jane Austen', genre: 'Classics', pages: 474 },
  // Mystery
  { id: '1661', title: 'The Adventures of Sherlock Holmes', author: 'Arthur Conan Doyle', genre: 'Mystery', pages: 307 },
  { id: '2852', title: 'The Hound of the Baskervilles', author: 'Arthur Conan Doyle', genre: 'Mystery', pages: 256 },
  { id: '863', title: 'The Mysterious Affair at Styles', author: 'Agatha Christie', genre: 'Mystery', pages: 296 },
  { id: '155', title: 'The Moonstone', author: 'Wilkie Collins', genre: 'Mystery', pages: 528 },
  { id: '244', title: 'A Study in Scarlet', author: 'Arthur Conan Doyle', genre: 'Mystery', pages: 172 },
  { id: '2097', title: 'The Sign of the Four', author: 'Arthur Conan Doyle', genre: 'Mystery', pages: 160 },
  // Adventure
  { id: '120', title: 'Treasure Island', author: 'Robert Louis Stevenson', genre: 'Adventure', pages: 292 },
  { id: '2701', title: 'Moby Dick', author: 'Herman Melville', genre: 'Adventure', pages: 585 },
  { id: '103', title: 'Around the World in 80 Days', author: 'Jules Verne', genre: 'Adventure', pages: 312 },
  { id: '1257', title: 'The Three Musketeers', author: 'Alexandre Dumas', genre: 'Adventure', pages: 625 },
  { id: '1184', title: 'The Count of Monte Cristo', author: 'Alexandre Dumas', genre: 'Adventure', pages: 1243 },
  { id: '2166', title: "King Solomon's Mines", author: 'H. Rider Haggard', genre: 'Adventure', pages: 320 },
  { id: '215', title: 'The Call of the Wild', author: 'Jack London', genre: 'Adventure', pages: 232 },
  // Fiction
  { id: '84', title: 'Frankenstein', author: 'Mary Shelley', genre: 'Fiction', pages: 280 },
  { id: '345', title: 'Dracula', author: 'Bram Stoker', genre: 'Fiction', pages: 418 },
  { id: '11', title: "Alice's Adventures in Wonderland", author: 'Lewis Carroll', genre: 'Fiction', pages: 200 },
  { id: '174', title: 'The Picture of Dorian Gray', author: 'Oscar Wilde', genre: 'Fiction', pages: 254 },
  { id: '43', title: 'Strange Case of Dr Jekyll and Mr Hyde', author: 'Robert Louis Stevenson', genre: 'Fiction', pages: 141 },
  { id: '55', title: 'The Wonderful Wizard of Oz', author: 'L. Frank Baum', genre: 'Fiction', pages: 259 },
  { id: '16', title: 'Peter Pan', author: 'J. M. Barrie', genre: 'Fiction', pages: 240 },
  // Science
  { id: '2009', title: 'On the Origin of Species', author: 'Charles Darwin', genre: 'Science', pages: 502 },
  { id: '35', title: 'The Time Machine', author: 'H. G. Wells', genre: 'Science', pages: 118 },
  { id: '164', title: 'Twenty Thousand Leagues Under the Seas', author: 'Jules Verne', genre: 'Science', pages: 424 },
  { id: '36', title: 'The War of the Worlds', author: 'H. G. Wells', genre: 'Science', pages: 192 },
  { id: '83', title: 'From the Earth to the Moon', author: 'Jules Verne', genre: 'Science', pages: 180 },
  { id: '159', title: 'The Island of Doctor Moreau', author: 'H. G. Wells', genre: 'Science', pages: 176 },
];

const bookById = (id: string): Book => {
  const book = BOOKS.find((b) => b.id === id);
  if (!book) throw new Error(`Unknown mock book id: ${id}`);
  return book;
};

const booksByIds = (ids: readonly string[]): Book[] => ids.map(bookById);

/** Order matters: this is the "Trending now" ranking. Every genre appears at least 4 times. */
const TRENDING_IDS = [
  '1342', '1661', '120', '84', '2009', '2701', '2852', '1400', '11', '35',
  '103', '514', '863', '345', '164', '1260', '155', '1257', '174', '36',
] as const;

/** Order matters: this is the "Top 10" ranking. */
const TOP_TEN_IDS = ['2852', '1342', '84', '120', '1661', '345', '11', '2701', '35', '1260'] as const;

/** Billboard order. An array on purpose: object keys like '84' would be re-sorted numerically. */
const FEATURED: ReadonlyArray<readonly [id: string, description: string]> = [
  [
    '2852',
    'A family curse, a ghostly hound on the Devon moors, and a murder that looks supernatural. Sherlock Holmes has to separate legend from crime before the next Baskerville dies.',
  ],
  [
    '1342',
    "Sharp-witted Elizabeth Bennet and the proud Mr. Darcy misjudge each other at every turn in Austen's sparkling comedy of manners, money and first impressions.",
  ],
  [
    '84',
    "A young scientist brings a creature to life, then turns his back on it. Mary Shelley's gothic classic asks who the real monster is.",
  ],
  [
    '120',
    "A treasure map, a mutinous crew and the charming, dangerous Long John Silver. A cabin boy's voyage that shaped every pirate story since.",
  ],
];

/** Most recently read first. */
const CONTINUE_PROGRESS: ReadonlyArray<readonly [id: string, progress: number]> = [
  ['2852', 68],
  ['1342', 42],
  ['84', 27],
  ['35', 83],
  ['11', 15],
];

const USER: UserSummary = { name: 'Savith', points: 1250, streak: 7 };

const TODAY: TodayStats = {
  pagesRead: 14,
  dailyGoal: 20,
  streak: 7,
  week: [true, true, false, true, true, true, true],
  pointsToday: 38,
  pointsYesterday: 52,
};

const TASKS: DailyTask[] = [
  { id: 't1', kind: 'pages', title: 'Read 10 pages', description: 'Pick up where you left off.', progress: 10, target: 10, rewardPoints: 10 },
  { id: 't2', kind: 'chapter', title: 'Finish a chapter', description: 'Reach the end of any chapter.', progress: 0, target: 1, rewardPoints: 25 },
  { id: 't3', kind: 'quiz', title: 'Win a quiz', description: 'Score 3 out of 5 in a Book Quiz.', progress: 1, target: 3, rewardPoints: 15 },
];

const GAMES: MiniGame[] = [
  { id: 'g1', kind: 'quiz', title: 'Book Quiz', description: 'Five quick questions about the chapter you just read.', durationMinutes: 2, rewardPoints: 15 },
  { id: 'g2', kind: 'puzzle', title: 'Word Puzzle', description: 'Unscramble words pulled from your current book.', durationMinutes: 2, rewardPoints: 10 },
];

const LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: 'Nimali Perera', points: 3420 },
  { rank: 2, name: 'Kasun Silva', points: 3105 },
  { rank: 3, name: 'Ayesha Fernando', points: 2870 },
  { rank: 4, name: 'Dinuka Jayasuriya', points: 2540 },
  { rank: 5, name: 'Tharushi Wijesinghe', points: 2310 },
];

const resolve = <T,>(value: T): Promise<T> => Promise.resolve(value);

export const getUserSummary = () => resolve(USER);
export const getTodayStats = () => resolve(TODAY);
export const getDailyTasks = () => resolve(TASKS);
export const getMiniGames = () => resolve(GAMES);
export const getLeaderboard = () => resolve(LEADERBOARD);
export const getTrendingBooks = () => resolve(booksByIds(TRENDING_IDS));
export const getTopBooks = () => resolve(booksByIds(TOP_TEN_IDS));
export const getBooksByGenre = (genre: Genre) => resolve(BOOKS.filter((b) => b.genre === genre));
export const getFeaturedBooks = (): Promise<FeaturedBook[]> =>
  resolve(FEATURED.map(([id, description]) => ({ ...bookById(id), description })));
export const getContinueReading = (): Promise<ReadingBook[]> =>
  resolve(CONTINUE_PROGRESS.map(([id, progress]) => ({ ...bookById(id), progress })));

/*
 * Swapping in the real API (example):
 *
 *   // src/api/books.api.ts
 *   export const fetchTrendingBooks = () => api.get<Book[]>('/books/trending').then((r) => r.data);
 *
 *   // here
 *   export const getTrendingBooks = fetchTrendingBooks;
 *
 * Keep the interfaces above in sync with (or move them to) @readora/shared.
 */
