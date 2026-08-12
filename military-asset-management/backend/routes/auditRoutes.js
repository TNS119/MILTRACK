import express from 'express';
import { getAuditLogs } from '../controllers/auditController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/rbacMiddleware.js';

const router = express.Router();

// Only ADMINs are authorized to fetch audit logs
router.get('/', authenticateToken, authorizeRoles('ADMIN'), getAuditLogs);

export default router;
