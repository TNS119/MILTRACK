import { query } from '../config/db.js';
import { writeAuditLog } from '../services/auditService.js';

export const createExpenditure = async (req, res) => {
  try {
    const { baseId, equipmentTypeId, quantity, expenditureDate, reason } = req.body;
    if (!baseId || !equipmentTypeId || !quantity || !expenditureDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await query(`
      INSERT INTO expenditures (base_id, equipment_type_id, quantity, expenditure_date, reason, expended_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [baseId, equipmentTypeId, quantity, expenditureDate, reason, req.user.id]);

    const created = result.rows[0];

    await writeAuditLog(req.user.id, 'CREATE_EXPENDITURE', 'expenditures', created.id, {
      baseId, equipmentTypeId, quantity, expenditureDate, reason
    });

    res.status(201).json(created);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getExpenditures = async (req, res) => {
  try {
    const { baseId, equipmentTypeId, startDate, endDate, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const params = [];
    let paramIndex = 1;
    let conditions = [];

    if (baseId) {
      conditions.push(`ex.base_id = $${paramIndex++}`);
      params.push(baseId);
    }
    if (equipmentTypeId) {
      conditions.push(`ex.equipment_type_id = $${paramIndex++}`);
      params.push(equipmentTypeId);
    }
    if (startDate) {
      conditions.push(`ex.expenditure_date >= $${paramIndex++}`);
      params.push(startDate);
    }
    if (endDate) {
      conditions.push(`ex.expenditure_date <= $${paramIndex++}`);
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(`SELECT COUNT(*) FROM expenditures ex ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const sql = `
      SELECT ex.*, b.name as "baseName", e.name as "equipmentTypeName"
      FROM expenditures ex
      JOIN bases b ON ex.base_id = b.id
      JOIN equipment_types e ON ex.equipment_type_id = e.id
      ${whereClause}
      ORDER BY ex.expenditure_date DESC, ex.id DESC
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
