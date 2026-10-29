import { Router } from 'express';
import { Types, isObjectIdOrHexString } from 'mongoose';
import { rateLimit } from 'express-rate-limit';
import { User, ReadingProgress, GameResult, UserTask, PointLog } from '../models';
import { getAuditHistory } from '../services/adminAudit.service';
import { HttpError } from '../middleware/error.middleware';
import { validate } from '../middleware/validate.middleware';
import { accountStatus, changeUserAccess, userFilter, USER_FIELDS } from '../services/adminUsers.service';
import { auditQuerySchema, parseQuery, roleChangeSchema, statusChangeSchema, usersQuerySchema } from '../validators/adminUsers.validators';

// Mounted only below adminRouter's authentication and administrator guards.
export const adminUsersRouter = Router();
const mutations = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, keyGenerator: req => req.auth!.userId, standardHeaders: 'draft-8', legacyHeaders: false, message: { message: 'Too many account changes. Try again later.' } });
adminUsersRouter.get('/stats', async (_req, res) => {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const [total, suspended, newThisMonth, active] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ role: 'user', status: 'suspended' }),
    User.countDocuments({ role: 'user', createdAt: { $gte: start, $lte: now } }),
    ReadingProgress.aggregate([{ $match: { lastReadAt: { $gte: new Date(now.getTime() - 30 * 86400000) } } }, { $group: { _id: '$userId' } }, { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'reader' } }, { $match: { 'reader.role': 'user' } }, { $count: 'count' }]),
  ]);
  res.json({ total, suspended, newThisMonth, active: active[0]?.count ?? 0 });
});
adminUsersRouter.get('/', async (req, res) => {
  const query = parseQuery(usersQuerySchema, req.query);
  const filter = userFilter(query);
  const sorts: Record<string, Record<string, 1 | -1>> = { newest: { createdAt: -1, _id: -1 }, oldest: { createdAt: 1, _id: 1 }, name_asc: { name: 1, _id: 1 }, name_desc: { name: -1, _id: -1 } };
  const [total, users] = await Promise.all([
    User.countDocuments(filter),
    User.aggregate([{ $match: filter }, { $sort: sorts[query.sort] }, { $skip: (query.page - 1) * query.pageSize }, { $limit: query.pageSize },
      { $lookup: { from: 'readingprogresses', let: { readerId: '$_id' }, pipeline: [{ $match: { $expr: { $eq: ['$userId', '$$readerId'] } } }, { $sort: { lastReadAt: -1 } }, { $limit: 1 }, { $project: { _id: 0, lastReadAt: 1 } }], as: 'reading' } },
      { $project: { name: 1, email: 1, role: 1, createdAt: 1, status: { $ifNull: ['$status', 'active'] }, lastReadAt: { $ifNull: [{ $arrayElemAt: ['$reading.lastReadAt', 0] }, null] } } },
    ]),
  ]);
  res.json({ users, total, page: query.page, pageSize: query.pageSize, totalPages: Math.ceil(total / query.pageSize) });
});
adminUsersRouter.param('userId', (_req, _res, next, id) => {
  if (!isObjectIdOrHexString(id)) throw new HttpError(400, 'Invalid user ID');
  next();
});
adminUsersRouter.get('/:userId/audit-logs', async (req, res) => {
  const { page } = parseQuery(auditQuerySchema, req.query);
  const targetUserId = String(req.params.userId);
  if (!await User.exists({ _id: targetUserId })) throw new HttpError(404, 'User not found');
  res.json(await getAuditHistory({ page, pageSize: 10 }, targetUserId));
});

export function currentPeriods(now = new Date()) {
  const day = now.toISOString().slice(0, 10);
  const thursday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  thursday.setUTCDate(thursday.getUTCDate() + 4 - (thursday.getUTCDay() || 7));
  const year = thursday.getUTCFullYear();
  const week = Math.ceil(((thursday.getTime() - Date.UTC(year, 0, 1)) / 86400000 + 1) / 7);
  return [day, `${year}-W${String(week).padStart(2, '0')}`];
}
adminUsersRouter.get('/:userId', async (req, res) => {
  const userId = new Types.ObjectId(String(req.params.userId));
  const user = await User.findById(userId).select(`${USER_FIELDS} badges`).populate('badges.badgeId', 'name description icon').lean();
  if (!user) throw new HttpError(404, 'User not found');
  const [reading, games, tasks, points, higherRanked] = await Promise.all([
    ReadingProgress.aggregate([{ $match: { userId } }, { $facet: {
      summary: [{ $group: { _id: null, started: { $sum: 1 }, completed: { $sum: { $cond: [{ $ne: [{ $ifNull: ['$finishedAt', null] }, null] }, 1, 0] } }, lastReadAt: { $max: '$lastReadAt' } } }],
      recent: [{ $sort: { lastReadAt: -1 } }, { $limit: 6 }, { $project: { bookId: 1, title: 1, author: 1, coverUrl: 1, progress: 1, currentPage: 1, totalPages: 1, lastReadAt: 1, finishedAt: 1 } }],
    } }]),
    GameResult.aggregate([{ $match: { userId } }, { $facet: {
      summary: [{ $group: { _id: null, played: { $sum: 1 }, wins: { $sum: { $cond: ['$won', 1, 0] } } } }],
      recent: [{ $sort: { createdAt: -1 } }, { $limit: 6 }, { $project: { gameType: 1, score: 1, maxScore: 1, won: 1, durationSeconds: 1, pointsAwarded: 1, createdAt: 1 } }],
    } }]),
    UserTask.aggregate([{ $match: { userId } }, { $facet: {
      summary: [{ $match: { completed: true } }, { $count: 'completed' }],
      recent: [{ $match: { completed: true } }, { $sort: { completedAt: -1 } }, { $limit: 6 }, { $lookup: { from: 'tasks', localField: 'taskId', foreignField: '_id', as: 'task' } }, { $project: { completedAt: 1, rewardClaimed: 1, periodKey: 1, title: { $arrayElemAt: ['$task.title', 0] } } }],
      current: [{ $match: { periodKey: { $in: currentPeriods() } } }, { $sort: { updatedAt: -1 } }, { $lookup: { from: 'tasks', localField: 'taskId', foreignField: '_id', as: 'task' } }, { $match: { 'task.isActive': true } }, { $limit: 10 }, { $project: { progress: 1, completed: 1, periodKey: 1, target: { $arrayElemAt: ['$task.target', 0] }, title: { $arrayElemAt: ['$task.title', 0] } } }],
    } }]),
    PointLog.aggregate([{ $match: { userId, points: { $gt: 0 } } }, { $group: { _id: null, earned: { $sum: '$points' }, taskRewards: { $sum: { $cond: [{ $eq: ['$reason', 'task_complete'] }, '$points', 0] } } } }]),
    user.role === 'user' ? User.countDocuments({ role: 'user', totalPoints: { $gt: user.totalPoints } }) : Promise.resolve(null),
  ]);
  res.json({
    user: {
      _id: user._id, name: user.name, email: user.email, role: user.role, status: accountStatus(user.status),
      createdAt: user.createdAt, totalPoints: user.totalPoints, currentStreak: user.currentStreak,
      longestStreak: user.longestStreak, suspensionReason: user.suspensionReason ?? '', statusChangedAt: user.statusChangedAt ?? null,
      badges: user.badges ?? [],
    },
    reading: { started: reading[0]?.summary[0]?.started ?? 0, completed: reading[0]?.summary[0]?.completed ?? 0, lastReadAt: reading[0]?.summary[0]?.lastReadAt ?? null, recent: reading[0]?.recent ?? [] },
    games: { played: games[0]?.summary[0]?.played ?? 0, wins: games[0]?.summary[0]?.wins ?? 0, recent: games[0]?.recent ?? [] },
    tasks: { completed: tasks[0]?.summary[0]?.completed ?? 0, recent: tasks[0]?.recent ?? [], current: tasks[0]?.current ?? [], rewards: points[0]?.taskRewards ?? 0 },
    points: { balance: user.totalPoints, earned: points[0]?.earned ?? 0, readerRank: higherRanked === null ? null : higherRanked + 1 },
  });
});
adminUsersRouter.patch('/:userId/status', mutations, validate(statusChangeSchema), async (req, res) => {
  res.json(await changeUserAccess(req.auth!.userId, String(req.params.userId), { ...req.body, kind: 'status' }));
});
adminUsersRouter.patch('/:userId/role', mutations, validate(roleChangeSchema), async (req, res) => {
  res.json(await changeUserAccess(req.auth!.userId, String(req.params.userId), { ...req.body, kind: 'role' }));
});
