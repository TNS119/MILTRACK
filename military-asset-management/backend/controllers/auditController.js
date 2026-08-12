import { query } from '../config/db.js';

export const getAuditLogs = async (req, res) => {
  try {
    const { action, entityType, startDate, endDate, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const params = [];
    let paramIndex = 1;
    let conditions = [];

    if (action) {
      conditions.push(`al.action = $${paramIndex++}`);
      params.push(action);
    }
    if (entityType) {
      conditions.push(`al.entity_type = $${paramIndex++}`);
      params.push(entityType);
    }
    if (startDate) {
      conditions.push(`al.created_at >= $${paramIndex++}`);
      params.push(startDate);
    }
    if (endDate) {
      conditions.push(`al.created_at <= $${paramIndex++}`);
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count query
    const countResult = await query(`SELECT COUNT(*) FROM audit_logs al ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    // List query
    const sql = `
      SELECT al.*, u.username
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const result = await query(sql, params);

    res.json({
      data: result.rows,
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    });
  } catch (error) {
    console.error('getAuditLogs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
