import { query } from '../config/db.js';
import { writeAuditLog } from '../services/auditService.js';
import { getAvailableStock } from '../services/stockService.js';

export const createAssignment = async (req, res) => {
  try {
    const { equipmentTypeId, baseId, assignedTo, quantity, assignedDate, notes } = req.body;
    if (!equipmentTypeId || !baseId || !assignedTo || !quantity || !assignedDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate available stock at the base
    const available = await getAvailableStock(baseId, equipmentTypeId);
    if (available < quantity) {
      return res.status(400).json({ error: `Insufficient stock at base. Available: ${available}, Requested: ${quantity}` });
    }

    const result = await query(`
      INSERT INTO assignments (equipment_type_id, base_id, assigned_to, quantity, assigned_date, notes, assigned_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [equipmentTypeId, baseId, assignedTo, quantity, assignedDate, notes, req.user.id]);

    const created = result.rows[0];

    await writeAuditLog(req.user.id, 'CREATE_ASSIGNMENT', 'assignments', created.id, {
      equipmentTypeId, baseId, assignedTo, quantity, assignedDate, notes
    });

    res.status(201).json(created);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAssignments = async (req, res) => {
  try {
    const { baseId, equipmentTypeId, startDate, endDate, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const params = [];
    let paramIndex = 1;
    let conditions = [];

    if (baseId) {
      conditions.push(`a.base_id = $${paramIndex++}`);
      params.push(baseId);
    }
    if (equipmentTypeId) {
      conditions.push(`a.equipment_type_id = $${paramIndex++}`);
      params.push(equipmentTypeId);
    }
    if (startDate) {
      conditions.push(`a.assigned_date >= $${paramIndex++}`);
      params.push(startDate);
    }
    if (endDate) {
      conditions.push(`a.assigned_date <= $${paramIndex++}`);
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(`SELECT COUNT(*) FROM assignments a ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const sql = `
      SELECT a.*, b.name as "baseName", e.name as "equipmentTypeName"
      FROM assignments a
      JOIN bases b ON a.base_id = b.id
      JOIN equipment_types e ON a.equipment_type_id = e.id
      ${whereClause}
      ORDER BY a.assigned_date DESC, a.id DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    params.push(limit, offset);

    const result = await query(sql, params);

    res.json({
      data: result.rows,
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
