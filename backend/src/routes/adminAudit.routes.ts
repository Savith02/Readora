import { Router } from 'express';
import { parseQuery } from '../validators/adminUsers.validators';
import { globalAuditQuerySchema } from '../validators/adminAudit.validators';
import { getAuditHistory } from '../services/adminAudit.service';

// Mounted under the existing JWT, live admin checks and no-store middleware.
export const adminAuditRouter = Router();
adminAuditRouter.get('/', async (req, res) => {
  res.json(await getAuditHistory(parseQuery(globalAuditQuerySchema, req.query)));
});
// No write, delete or generic mutation routes are exposed for audit history.
