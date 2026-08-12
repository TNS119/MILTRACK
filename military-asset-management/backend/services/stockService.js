import { query } from '../config/db.js';

/**
 * Calculates the available stock for a specific base and equipment type.
 * Computes: Purchases + Transfers In - Transfers Out - Assignments - Expenditures
 */
export const getAvailableStock = async (baseId, equipmentTypeId, client = null) => {
  const sql = `
    SELECT (
      (SELECT COALESCE(SUM(quantity), 0) FROM purchases WHERE base_id = $1 AND equipment_type_id = $2)
      + (SELECT COALESCE(SUM(quantity), 0) FROM transfers WHERE destination_base_id = $1 AND equipment_type_id = $2 AND status = 'COMPLETED')
      - (SELECT COALESCE(SUM(quantity), 0) FROM transfers WHERE source_base_id = $1 AND equipment_type_id = $2 AND status = 'COMPLETED')
      - (SELECT COALESCE(SUM(quantity), 0) FROM assignments WHERE base_id = $1 AND equipment_type_id = $2)
      - (SELECT COALESCE(SUM(quantity), 0) FROM expenditures WHERE base_id = $1 AND equipment_type_id = $2)
    ) AS current_stock
  `;
  const params = [parseInt(baseId, 10), parseInt(equipmentTypeId, 10)];

  const res = client 
    ? await client.query(sql, params)
    : await query(sql, params);

  return parseInt(res.rows[0].current_stock, 10);
};
