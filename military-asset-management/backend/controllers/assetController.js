import { query } from '../config/db.js';
import { getAvailableStock } from '../services/stockService.js';

export const getDashboardMetrics = async (req, res) => {
  try {
    const { baseId, equipmentTypeId, startDate, endDate } = req.query;

    // Build params array — each filter value pushed once, referenced by $N everywhere
    const params = [];
    let idx = 1;

    const baseSlot  = baseId          ? (params.push(parseInt(baseId, 10)),          idx++) : null;
    const equipSlot = equipmentTypeId ? (params.push(parseInt(equipmentTypeId, 10)), idx++) : null;
    const startSlot = startDate       ? (params.push(startDate),                     idx++) : null;
    const endSlot   = endDate         ? (params.push(endDate),                       idx++) : null;

    // --- SQL fragment helpers ---
    const baseFilter      = (col) => baseSlot  ? `AND ${col} = $${baseSlot}`   : '';
    const equipFilter     = (col) => equipSlot ? `AND ${col} = $${equipSlot}`  : '';
    const dateGte         = (col) => startSlot ? `AND ${col} >= $${startSlot}` : '';
    const dateLte         = (col) => endSlot   ? `AND ${col} <= $${endSlot}`   : '';
    const dateBefore      = (col) => startSlot ? `AND ${col} < $${startSlot}`  : '';

    // When no startDate is provided, the opening balance should be 0.
    // We achieve this by adding AND 1=0 to each opening CTE.
    const hasStart = !!startSlot;

    const sql = `
      WITH
        -- ===== CURRENT PERIOD (all-time if no dates provided) =====
        purchases_now AS (
          SELECT COALESCE(SUM(quantity),0) AS val FROM purchases WHERE 1=1
          ${baseFilter('base_id')} ${equipFilter('equipment_type_id')}
          ${dateGte('purchase_date')} ${dateLte('purchase_date')}
        ),
        transfers_in_now AS (
          SELECT COALESCE(SUM(quantity),0) AS val FROM transfers WHERE status='COMPLETED'
          ${baseSlot ? `AND destination_base_id = $${baseSlot}` : ''}
          ${equipFilter('equipment_type_id')}
          ${dateGte('transfer_date')} ${dateLte('transfer_date')}
        ),
        transfers_out_now AS (
          SELECT COALESCE(SUM(quantity),0) AS val FROM transfers WHERE status='COMPLETED'
          ${baseSlot ? `AND source_base_id = $${baseSlot}` : ''}
          ${equipFilter('equipment_type_id')}
          ${dateGte('transfer_date')} ${dateLte('transfer_date')}
        ),
        assigned_now AS (
          SELECT COALESCE(SUM(quantity),0) AS val FROM assignments WHERE 1=1
          ${baseFilter('base_id')} ${equipFilter('equipment_type_id')}
          ${dateGte('assigned_date')} ${dateLte('assigned_date')}
        ),
        expended_now AS (
          SELECT COALESCE(SUM(quantity),0) AS val FROM expenditures WHERE 1=1
          ${baseFilter('base_id')} ${equipFilter('equipment_type_id')}
          ${dateGte('expenditure_date')} ${dateLte('expenditure_date')}
        ),

        -- ===== OPENING BALANCE (everything before startDate) =====
        -- When no startDate → all opening CTEs return 0 via AND 1=0
        opening_p AS (
          SELECT COALESCE(SUM(quantity),0) AS val FROM purchases WHERE 1=1
          ${hasStart ? '' : 'AND 1=0'}
          ${baseFilter('base_id')} ${equipFilter('equipment_type_id')}
          ${dateBefore('purchase_date')}
        ),
        opening_ti AS (
          SELECT COALESCE(SUM(quantity),0) AS val FROM transfers WHERE status='COMPLETED'
          ${hasStart ? '' : 'AND 1=0'}
          ${baseSlot ? `AND destination_base_id = $${baseSlot}` : ''}
          ${equipFilter('equipment_type_id')}
          ${dateBefore('transfer_date')}
        ),
        opening_to AS (
          SELECT COALESCE(SUM(quantity),0) AS val FROM transfers WHERE status='COMPLETED'
          ${hasStart ? '' : 'AND 1=0'}
          ${baseSlot ? `AND source_base_id = $${baseSlot}` : ''}
          ${equipFilter('equipment_type_id')}
          ${dateBefore('transfer_date')}
        ),
        opening_a AS (
          SELECT COALESCE(SUM(quantity),0) AS val FROM assignments WHERE 1=1
          ${hasStart ? '' : 'AND 1=0'}
          ${baseFilter('base_id')} ${equipFilter('equipment_type_id')}
          ${dateBefore('assigned_date')}
        ),
        opening_e AS (
          SELECT COALESCE(SUM(quantity),0) AS val FROM expenditures WHERE 1=1
          ${hasStart ? '' : 'AND 1=0'}
          ${baseFilter('base_id')} ${equipFilter('equipment_type_id')}
          ${dateBefore('expenditure_date')}
        )

      SELECT
        (SELECT val FROM purchases_now)     AS "purchases",
        (SELECT val FROM transfers_in_now)  AS "transfersIn",
        (SELECT val FROM transfers_out_now) AS "transfersOut",
        (SELECT val FROM assigned_now)      AS "assigned",
        (SELECT val FROM expended_now)      AS "expended",
        (
          (SELECT val FROM opening_p)
          + (SELECT val FROM opening_ti)
          - (SELECT val FROM opening_to)
          - (SELECT val FROM opening_a)
          - (SELECT val FROM opening_e)
        ) AS "openingBalance"
    `;

    const result = await query(sql, params);
    const row = result.rows[0];

    const purchases      = parseInt(row.purchases, 10);
    const transfersIn    = parseInt(row.transfersIn, 10);
    const transfersOut   = parseInt(row.transfersOut, 10);
    const assigned       = parseInt(row.assigned, 10);
    const expended       = parseInt(row.expended, 10);
    const openingBalance = parseInt(row.openingBalance, 10);
    const netMovement    = purchases + transfersIn - transfersOut;
    const closingBalance = openingBalance + netMovement - assigned - expended;

    res.json({
      openingBalance,
      purchases,
      transfersIn,
      transfersOut,
      netMovement,
      assigned,
      expended,
      closingBalance,
    });
  } catch (error) {
    console.error('getDashboardMetrics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const checkStock = async (req, res) => {
  try {
    const { baseId, equipmentTypeId } = req.query;
    if (!baseId || !equipmentTypeId) {
      return res.status(400).json({ error: 'Missing required parameters: baseId, equipmentTypeId' });
    }

    const available = await getAvailableStock(baseId, equipmentTypeId);
    res.json({ available });
  } catch (error) {
    console.error('checkStock error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getInventory = async (req, res) => {
  try {
    const { baseId, category } = req.query;

    const params = [];
    let paramIndex = 1;
    let conditions = [];

    if (baseId) {
      conditions.push(`b.id = $${paramIndex++}`);
      params.push(parseInt(baseId, 10));
    }
    if (category) {
      conditions.push(`e.category = $${paramIndex++}`);
      params.push(category);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        b.id AS "baseId",
        b.name AS "baseName",
        e.id AS "equipmentTypeId",
        e.name AS "equipmentName",
        e.category AS "category",
        (
          COALESCE((SELECT SUM(quantity) FROM purchases WHERE base_id = b.id AND equipment_type_id = e.id), 0)
          + COALESCE((SELECT SUM(quantity) FROM transfers WHERE destination_base_id = b.id AND equipment_type_id = e.id AND status = 'COMPLETED'), 0)
          - COALESCE((SELECT SUM(quantity) FROM transfers WHERE source_base_id = b.id AND equipment_type_id = e.id AND status = 'COMPLETED'), 0)
          - COALESCE((SELECT SUM(quantity) FROM assignments WHERE base_id = b.id AND equipment_type_id = e.id), 0)
          - COALESCE((SELECT SUM(quantity) FROM expenditures WHERE base_id = b.id AND equipment_type_id = e.id), 0)
        ) AS "currentStock"
      FROM bases b
      CROSS JOIN equipment_types e
      ${whereClause}
      ORDER BY b.name, e.name
    `;

    const result = await query(sql, params);

    const formatted = result.rows.map(row => ({
      ...row,
      currentStock: parseInt(row.currentStock, 10)
    }));

    res.json(formatted);
  } catch (error) {
    console.error('getInventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
