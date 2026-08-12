import express from 'express';
import { login, getMe, logout } from '../controllers/authController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticateToken, getMe);

export default router;
