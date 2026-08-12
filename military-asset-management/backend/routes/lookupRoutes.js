import express from 'express';
import { query } from '../config/db.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/bases', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM bases ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/equipment-types', authenticateToken, async (req, res) => {
  try {
    const { category } = req.query;
    const params = [];
    let sql = 'SELECT * FROM equipment_types';
    
    if (category) {
      sql += ' WHERE category = $1';
      params.push(category);
    }
    sql += ' ORDER BY name';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
