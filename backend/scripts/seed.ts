import type { BadgeDoc } from '../src/models/Badge';
import type { TaskDoc } from '../src/models/Task';
import { connectDB, disconnectDB } from '../src/config/db';
import { Badge, Task } from '../src/models';
import { logger } from '../src/utils/logger';

type TaskSeed = Pick<TaskDoc, 'key' | 'title' | 'description' | 'type' | 'frequency' | 'target' | 'rewardPoints' | 'sortOrder'>;
type BadgeSeed = Pick<BadgeDoc, 'key' | 'name' | 'description' | 'icon' | 'criteria' | 'rewardPoints' | 'sortOrder'>;

const TASKS: TaskSeed[] = [
  { key: 'read-10-pages', title: 'Read 10 pages', description: 'Pick up where you left off.', type: 'pages', frequency: 'daily', target: 10, rewardPoints: 10, sortOrder: 1 },
  { key: 'finish-a-chapter', title: 'Finish a chapter', description: 'Reach the end of any chapter.', type: 'chapter', frequency: 'daily', target: 1, rewardPoints: 25, sortOrder: 2 },
  { key: 'win-a-quiz', title: 'Win a quiz', description: 'Score at least 3 out of 5 in a Book Quiz.', type: 'quiz', frequency: 'daily', target: 1, rewardPoints: 15, sortOrder: 3 },
  { key: 'solve-a-word-puzzle', title: 'Solve a word puzzle', description: 'Finish one Word Puzzle.', type: 'puzzle', frequency: 'daily', target: 1, rewardPoints: 10, sortOrder: 4 },
  { key: 'read-100-pages', title: 'Read 100 pages this week', description: 'Keep a steady pace all week.', type: 'pages', frequency: 'weekly', target: 100, rewardPoints: 60, sortOrder: 5 },
];

const BADGES: BadgeSeed[] = [
  { key: 'first-steps', name: 'First Steps', description: 'Read your first page.', icon: 'footprints', criteria: { metric: 'pages_read', threshold: 1 }, rewardPoints: 5, sortOrder: 1 },
  { key: 'page-turner', name: 'Page Turner', description: 'Read 100 pages.', icon: 'book-open', criteria: { metric: 'pages_read', threshold: 100 }, rewardPoints: 20, sortOrder: 2 },
  { key: 'bookworm', name: 'Bookworm', description: 'Read 1,000 pages.', icon: 'library', criteria: { metric: 'pages_read', threshold: 1000 }, rewardPoints: 100, sortOrder: 3 },
  { key: 'chapter-chaser', name: 'Chapter Chaser', description: 'Finish 10 chapters.', icon: 'bookmark-check', criteria: { metric: 'chapters_done', threshold: 10 }, rewardPoints: 30, sortOrder: 4 },
  { key: 'on-a-roll', name: 'On a Roll', description: 'Read 3 days in a row.', icon: 'zap', criteria: { metric: 'streak_days', threshold: 3 }, rewardPoints: 10, sortOrder: 5 },
  { key: 'week-warrior', name: 'Week Warrior', description: 'Keep a 7-day streak.', icon: 'flame', criteria: { metric: 'streak_days', threshold: 7 }, rewardPoints: 40, sortOrder: 6 },
  { key: 'game-on', name: 'Game On', description: 'Win your first mini-game.', icon: 'gamepad-2', criteria: { metric: 'games_won', threshold: 1 }, rewardPoints: 5, sortOrder: 7 },
  { key: 'quiz-whiz', name: 'Quiz Whiz', description: 'Win 10 mini-games.', icon: 'brain', criteria: { metric: 'games_won', threshold: 10 }, rewardPoints: 50, sortOrder: 8 },
  { key: 'rising-star', name: 'Rising Star', description: 'Earn 500 points.', icon: 'star', criteria: { metric: 'total_points', threshold: 500 }, rewardPoints: 25, sortOrder: 9 },
  { key: 'legend', name: 'Legend', description: 'Earn 5,000 points.', icon: 'trophy', criteria: { metric: 'total_points', threshold: 5000 }, rewardPoints: 200, sortOrder: 10 },
];

/**
 * Safe to run any number of times: each definition is upserted by `key`, so nothing is
 * duplicated. The values above are the source of truth, so a re-run resets any edits made
 * to these documents by hand.
 */
async function seed() {
  await connectDB();

  const tasks = await Task.bulkWrite(
    TASKS.map((task) => ({ updateOne: { filter: { key: task.key }, update: { $set: task }, upsert: true } })),
  );
  logger.info(`Tasks: ${tasks.upsertedCount} created, ${tasks.matchedCount} already existed (refreshed), ${TASKS.length} total`);

  const badges = await Badge.bulkWrite(
    BADGES.map((badge) => ({ updateOne: { filter: { key: badge.key }, update: { $set: badge }, upsert: true } })),
  );
  logger.info(`Badges: ${badges.upsertedCount} created, ${badges.matchedCount} already existed (refreshed), ${BADGES.length} total`);
}

seed()
  .catch((error: unknown) => {
    logger.error(`Seed failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  })
  .finally(() => disconnectDB());
