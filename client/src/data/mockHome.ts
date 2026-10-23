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
  { id: '1342', title: 'Pride and Prejudice', author: 'Jane Austen', genre: 'Classics', pages: 432 },
  { id: '1661', title: 'The Adventures of Sherlock Holmes', author: 'Arthur Conan Doyle', genre: 'Mystery', pages: 307 },
  { id: '120', title: 'Treasure Island', author: 'Robert Louis Stevenson', genre: 'Adventure', pages: 292 },
  { id: '84', title: 'Frankenstein', author: 'Mary Shelley', genre: 'Fiction', pages: 280 },
  { id: '345', title: 'Dracula', author: 'Bram Stoker', genre: 'Fiction', pages: 418 },
  { id: '2009', title: 'On the Origin of Species', author: 'Charles Darwin', genre: 'Science', pages: 502 },
  { id: '2701', title: 'Moby Dick', author: 'Herman Melville', genre: 'Adventure', pages: 585 },
  { id: '2852', title: 'The Hound of the Baskervilles', author: 'Arthur Conan Doyle', genre: 'Mystery', pages: 256 },
  { id: '1400', title: 'Great Expectations', author: 'Charles Dickens', genre: 'Classics', pages: 505 },
  { id: '11', title: "Alice's Adventures in Wonderland", author: 'Lewis Carroll', genre: 'Fiction', pages: 200 },
  { id: '35', title: 'The Time Machine', author: 'H. G. Wells', genre: 'Science', pages: 118 },
  { id: '103', title: 'Around the World in 80 Days', author: 'Jules Verne', genre: 'Adventure', pages: 312 },
  { id: '514', title: 'Little Women', author: 'Louisa May Alcott', genre: 'Classics', pages: 449 },
  { id: '863', title: 'The Mysterious Affair at Styles', author: 'Agatha Christie', genre: 'Mystery', pages: 296 },
  { id: '164', title: 'Twenty Thousand Leagues Under the Seas', author: 'Jules Verne', genre: 'Science', pages: 424 },
];

const CONTINUE_PROGRESS: Record<string, number> = { '1342': 42, '2852': 68, '11': 15, '35': 83 };

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
export const getTrendingBooks = () => resolve(BOOKS);
export const getContinueReading = (): Promise<ReadingBook[]> =>
  resolve(
    BOOKS.filter((b) => b.id in CONTINUE_PROGRESS).map((b) => ({
      ...b,
      progress: CONTINUE_PROGRESS[b.id],
    })),
  );

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
