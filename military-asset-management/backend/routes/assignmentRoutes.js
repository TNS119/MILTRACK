import express from 'express';
import { createAssignment, getAssignments } from '../controllers/assignmentController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { authorizeRoles, enforceBaseScope } from '../middlewares/rbacMiddleware.js';

const router = express.Router();

router.post('/', authenticateToken, authorizeRoles('ADMIN', 'BASE_COMMANDER'), createAssignment);
router.get('/', authenticateToken, enforceBaseScope, getAssignments);

export default router;
