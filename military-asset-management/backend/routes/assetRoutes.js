import express from 'express';
import { getDashboardMetrics, checkStock } from '../controllers/assetController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { enforceBaseScope } from '../middlewares/rbacMiddleware.js';

const router = express.Router();

router.get('/dashboard', authenticateToken, enforceBaseScope, getDashboardMetrics);
router.get('/stock', authenticateToken, enforceBaseScope, checkStock);

export default router;
