import { query } from '../config/db.js';

export const writeAuditLog = async (userId, action, entityType, entityId, details, client = null) => {
  try {
    const text = `
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
      VALUES ($1, $2, $3, $4, $5)
    `;
    const params = [userId, action, entityType, entityId, JSON.stringify(details)];

    if (client) {
      await client.query(text, params);
    } else {
      await query(text, params);
    }
  } catch (error) {
    console.error('Failed to write audit log:', error.message);
  }
};
