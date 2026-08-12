import { query } from '../config/db.js';

export const getDashboardMetrics = async (req, res) => {
  try {
    const { baseId, equipmentTypeId, startDate, endDate } = req.query;

    // Build params array sequentially — each filter appended once, referenced by position
    const params = [];
    let idx = 1;

    // Slot assignments (null means "not filtered")
    const baseSlot       = baseId          ? (params.push(parseInt(baseId, 10)),          idx++) : null;
    const equipSlot      = equipmentTypeId ? (params.push(parseInt(equipmentTypeId, 10)), idx++) : null;
    const startSlot      = startDate       ? (params.push(startDate),                     idx++) : null;
    const endSlot        = endDate         ? (params.push(endDate),                       idx++) : null;

    // Helper: returns a SQL fragment for a given column name vs a slot
    const bf = (col)  => baseSlot  ? `AND ${col} = $${baseSlot}`  : '';
    const ef = (col)  => equipSlot ? `AND ${col} = $${equipSlot}` : '';
    const s0 = (col)  => startSlot ? `AND ${col} >= $${startSlot}` : 'AND 1=0'; // "before" window: no start → 0
    const s1 = (col)  => startSlot ? `AND ${col} >= $${startSlot}` : '';
    const e1 = (col)  => endSlot   ? `AND ${col} <= $${endSlot}`  : '';

    const sql = `
      WITH
        -- Current period aggregations
        purchases_now AS (
          SELECT COALESCE(SUM(quantity),0) AS val FROM purchases WHERE 1=1
          ${bf('base_id')} ${ef('equipment_type_id')} ${s1('purchase_date')} ${e1('purchase_date')}
        ),
        transfers_in_now AS (
          SELECT COALESCE(SUM(quantity),0) AS val FROM transfers WHERE status='COMPLETED'
          ${baseSlot ? `AND destination_base_id = $${baseSlot}` : ''}
          ${ef('equipment_type_id')} ${s1('transfer_date')} ${e1('transfer_date')}
        ),
        transfers_out_now AS (
          SELECT COALESCE(SUM(quantity),0) AS val FROM transfers WHERE status='COMPLETED'
          ${baseSlot ? `AND source_base_id = $${baseSlot}` : ''}
          ${ef('equipment_type_id')} ${s1('transfer_date')} ${e1('transfer_date')}
        ),
        assigned_now AS (
          SELECT COALESCE(SUM(quantity),0) AS val FROM assignments WHERE 1=1
          ${bf('base_id')} ${ef('equipment_type_id')} ${s1('assigned_date')} ${e1('assigned_date')}
        ),
        expended_now AS (
          SELECT COALESCE(SUM(quantity),0) AS val FROM expenditures WHERE 1=1
          ${bf('base_id')} ${ef('equipment_type_id')} ${s1('expenditure_date')} ${e1('expenditure_date')}
        ),
        -- Opening balance = everything BEFORE startDate (zero when no startDate)
        opening_p AS (
          SELECT COALESCE(SUM(quantity),0) AS val FROM purchases WHERE 1=1
          ${bf('base_id')} ${ef('equipment_type_id')} ${s0('purchase_date').replace('>=', '<')}
        ),
        opening_ti AS (
          SELECT COALESCE(SUM(quantity),0) AS val FROM transfers WHERE status='COMPLETED'
          ${baseSlot ? `AND destination_base_id = $${baseSlot}` : ''}
          ${ef('equipment_type_id')} ${startSlot ? `AND transfer_date < $${startSlot}` : 'AND 1=0'}
        ),
        opening_to AS (
          SELECT COALESCE(SUM(quantity),0) AS val FROM transfers WHERE status='COMPLETED'
          ${baseSlot ? `AND source_base_id = $${baseSlot}` : ''}
          ${ef('equipment_type_id')} ${startSlot ? `AND transfer_date < $${startSlot}` : 'AND 1=0'}
        ),
        opening_a AS (
          SELECT COALESCE(SUM(quantity),0) AS val FROM assignments WHERE 1=1
          ${bf('base_id')} ${ef('equipment_type_id')} ${startSlot ? `AND assigned_date < $${startSlot}` : 'AND 1=0'}
        ),
        opening_e AS (
          SELECT COALESCE(SUM(quantity),0) AS val FROM expenditures WHERE 1=1
          ${bf('base_id')} ${ef('equipment_type_id')} ${startSlot ? `AND expenditure_date < $${startSlot}` : 'AND 1=0'}
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

    const purchases     = parseInt(row.purchases,     10);
    const transfersIn   = parseInt(row.transfersIn,   10);
    const transfersOut  = parseInt(row.transfersOut,  10);
    const assigned      = parseInt(row.assigned,      10);
    const expended      = parseInt(row.expended,      10);
    const openingBalance = parseInt(row.openingBalance, 10);
    const netMovement   = purchases + transfersIn - transfersOut;
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
