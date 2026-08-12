import { query, getClient } from '../config/db.js';
import { writeAuditLog } from '../services/auditService.js';
import { getAvailableStock } from '../services/stockService.js';

export const createTransfer = async (req, res) => {
  const { sourceBaseId, destinationBaseId, equipmentTypeId, quantity, notes } = req.body;
  if (!sourceBaseId || !destinationBaseId || !equipmentTypeId || !quantity) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Validate available stock at the source base before allowing transfer
    const available = await getAvailableStock(sourceBaseId, equipmentTypeId, client);
    if (available < quantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Insufficient stock at source base. Available: ${available}, Requested: ${quantity}` });
    }

    const result = await client.query(`
      INSERT INTO transfers (source_base_id, destination_base_id, equipment_type_id, quantity, notes, initiated_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [sourceBaseId, destinationBaseId, equipmentTypeId, quantity, notes, req.user.id]);

    const created = result.rows[0];

    await writeAuditLog(req.user.id, 'CREATE_TRANSFER', 'transfers', created.id, {
      sourceBaseId, destinationBaseId, equipmentTypeId, quantity, notes
    }, client);

    await client.query('COMMIT');
    res.status(201).json(created);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const getTransfers = async (req, res) => {
  try {
    const { baseId, equipmentTypeId, startDate, endDate, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const params = [];
    let paramIndex = 1;
    let conditions = [];

    if (baseId) {
      conditions.push(`(t.source_base_id = $${paramIndex} OR t.destination_base_id = $${paramIndex})`);
      params.push(baseId);
      paramIndex++;
    }
    if (equipmentTypeId) {
      conditions.push(`t.equipment_type_id = $${paramIndex++}`);
      params.push(equipmentTypeId);
    }
    if (startDate) {
      conditions.push(`t.transfer_date >= $${paramIndex++}`);
      params.push(startDate);
    }
    if (endDate) {
      conditions.push(`t.transfer_date <= $${paramIndex++}`);
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(`SELECT COUNT(*) FROM transfers t ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const sql = `
      SELECT t.*, 
             bs.name as "sourceBaseName", 
             bd.name as "destinationBaseName", 
             e.name as "equipmentTypeName"
      FROM transfers t
      JOIN bases bs ON t.source_base_id = bs.id
      JOIN bases bd ON t.destination_base_id = bd.id
      JOIN equipment_types e ON t.equipment_type_id = e.id
      ${whereClause}
      ORDER BY t.transfer_date DESC, t.id DESC
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
