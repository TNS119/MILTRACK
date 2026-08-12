import { query } from '../config/db.js';
import { writeAuditLog } from '../services/auditService.js';

export const createPurchase = async (req, res) => {
  try {
    const { baseId, equipmentTypeId, quantity, purchaseDate, notes } = req.body;
    if (!baseId || !equipmentTypeId || !quantity || !purchaseDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await query(`
      INSERT INTO purchases (base_id, equipment_type_id, quantity, purchase_date, notes, purchased_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [baseId, equipmentTypeId, quantity, purchaseDate, notes, req.user.id]);

    const created = result.rows[0];

    await writeAuditLog(req.user.id, 'CREATE_PURCHASE', 'purchases', created.id, {
      baseId, equipmentTypeId, quantity, purchaseDate, notes
    });

    res.status(201).json(created);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPurchases = async (req, res) => {
  try {
    const { baseId, equipmentTypeId, startDate, endDate, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const params = [];
    let paramIndex = 1;
    let conditions = [];

    if (baseId) {
      conditions.push(`p.base_id = $${paramIndex++}`);
      params.push(baseId);
    }
    if (equipmentTypeId) {
      conditions.push(`p.equipment_type_id = $${paramIndex++}`);
      params.push(equipmentTypeId);
    }
    if (startDate) {
      conditions.push(`p.purchase_date >= $${paramIndex++}`);
      params.push(startDate);
    }
    if (endDate) {
      conditions.push(`p.purchase_date <= $${paramIndex++}`);
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(`SELECT COUNT(*) FROM purchases p ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const sql = `
      SELECT p.*, b.name as "baseName", e.name as "equipmentTypeName"
      FROM purchases p
      JOIN bases b ON p.base_id = b.id
      JOIN equipment_types e ON p.equipment_type_id = e.id
      ${whereClause}
      ORDER BY p.purchase_date DESC, p.id DESC
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
