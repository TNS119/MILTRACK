import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const result = await query(`
      SELECT u.*, b.name as "baseName" 
      FROM users u
      LEFT JOIN bases b ON u.base_id = b.id
      WHERE u.username = $1
    `, [username]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      baseId: user.base_id,
      baseName: user.baseName
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    // Set JWT token in an httpOnly secure cookie
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax', // 'none' is required for cross-site cookie sharing (Vercel -> Render)
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days matching JWT expiration
    });

    res.json({ user: payload });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const logout = async (req, res) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax'
  });
  res.json({ message: 'Logged out successfully' });
};

export const getMe = async (req, res) => {
  try {
    const result = await query(`
      SELECT u.id, u.username, u.role, u.base_id as "baseId", b.name as "baseName"
      FROM users u
      LEFT JOIN bases b ON u.base_id = b.id
      WHERE u.id = $1
    `, [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
