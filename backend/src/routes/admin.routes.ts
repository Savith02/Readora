import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';
import { HttpError } from '../middleware/error.middleware';
import { User, ReadingProgress, GameResult, UserTask, PointLog } from '../models';

export const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);
adminRouter.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
adminRouter.get('/dashboard', async (req, res) => {
  const months = Number(req.query.months ?? 6);
  if (![3, 6, 12].includes(months)) throw new HttpError(400, 'Choose 3, 6 or 12 months');
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - months + 1, 1));
  const activeSince = new Date(now.getTime() - 30 * 86400000);
  const [users, active, games, tasks, points, growth, reading, popular, recentUsers, completedTasks, activeReaders] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    ReadingProgress.aggregate([{ $match: { lastReadAt: { $gte: activeSince } } }, { $group: { _id: '$userId' } }, { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'reader' } }, { $match: { 'reader.role': 'user' } }, { $count: 'total' }]),
    GameResult.countDocuments(),
    UserTask.countDocuments({ completed: true }),
    PointLog.aggregate([{ $match: { points: { $gt: 0 } } }, { $group: { _id: null, total: { $sum: '$points' } } }]),
    User.aggregate([{ $match: { role: 'user', createdAt: { $gte: start, $lte: now } } }, { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: 'UTC' } }, count: { $sum: 1 } } }]),
    PointLog.aggregate([{ $match: { reason: 'page_read', createdAt: { $gte: start, $lte: now } } }, { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: 'UTC' } }, count: { $sum: 1 } } }]),
    ReadingProgress.aggregate([{ $sort: { lastReadAt: -1 } }, { $group: { _id: '$bookId', title: { $first: '$title' }, author: { $first: '$author' }, coverUrl: { $first: '$coverUrl' }, count: { $sum: 1 } } }, { $sort: { count: -1, _id: 1 } }, { $limit: 5 }]),
    User.find({ role: 'user' }).sort({ createdAt: -1 }).limit(5).select('name email createdAt').lean(),
    UserTask.find({ completed: true, completedAt: { $ne: null } }).sort({ completedAt: -1 }).limit(5).select('completedAt').lean(),
    ReadingProgress.aggregate([{ $match: { finishedAt: { $ne: null } } }, { $group: { _id: '$userId', count: { $sum: 1 } } }, { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'reader' } }, { $unwind: '$reader' }, { $match: { 'reader.role': 'user' } }, { $sort: { count: -1, _id: 1 } }, { $limit: 5 }, { $project: { count: 1, name: '$reader.name' } }]),
  ]);
  const series = (rows: { _id: string; count: number }[]) => Array.from({ length: months }, (_, i) => {
    const month = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1)).toISOString().slice(0, 7);
    return { month, count: rows.find(row => row._id === month)?.count ?? 0 };
  });
  const activity = [
    ...recentUsers.map(user => ({ id: `user-${user._id}`, text: `${user.name} registered`, date: user.createdAt })),
    ...completedTasks.map(task => ({ id: `task-${task._id}`, text: 'Reading task completed', date: task.completedAt! })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 8);
  res.json({ generatedAt: now, stats: { books: null, users, activeReaders: active[0]?.total ?? 0, games, tasks, points: points[0]?.total ?? 0 }, growth: series(growth), reading: series(reading), popular, recentUsers, activity, activeReaders });
});
