import express from 'express';
import { getDashboardMetrics, checkStock, getInventory } from '../controllers/assetController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { enforceBaseScope, authorizeRoles } from '../middlewares/rbacMiddleware.js';

const router = express.Router();

router.get('/dashboard', authenticateToken, enforceBaseScope, getDashboardMetrics);
router.get('/stock', authenticateToken, enforceBaseScope, checkStock);
router.get('/inventory', authenticateToken, authorizeRoles('ADMIN', 'BASE_COMMANDER'), enforceBaseScope, getInventory);

export default router;
