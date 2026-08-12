import express from 'express';
import { createExpenditure, getExpenditures } from '../controllers/expenditureController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { authorizeRoles, enforceBaseScope } from '../middlewares/rbacMiddleware.js';

const router = express.Router();

router.post('/', authenticateToken, authorizeRoles('ADMIN', 'BASE_COMMANDER'), createExpenditure);
router.get('/', authenticateToken, enforceBaseScope, getExpenditures);

export default router;
