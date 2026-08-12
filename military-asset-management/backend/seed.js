import bcrypt from 'bcryptjs';
import { query, getClient } from './config/db.js';
import { writeAuditLog } from './services/auditService.js';

const seed = async () => {
  console.log('Starting seed process...');
  const client = await getClient();
  try {
    await client.query('BEGIN');

    console.log('Truncating tables...');
    await client.query('TRUNCATE bases, users, equipment_types, purchases, transfers, assignments, expenditures, audit_logs RESTART IDENTITY CASCADE');

    console.log('Inserting Indian Military Bases...');
    const b1 = (await client.query("INSERT INTO bases (name, location) VALUES ('Northern Command Base', 'Udhampur, J&K') RETURNING id")).rows[0].id;
    const b2 = (await client.query("INSERT INTO bases (name, location) VALUES ('Western Command Base', 'Chandimandir, Punjab') RETURNING id")).rows[0].id;
    const b3 = (await client.query("INSERT INTO bases (name, location) VALUES ('Eastern Command Base', 'Tezpur, Assam') RETURNING id")).rows[0].id;

    console.log('Inserting users...');
    const adminPass = await bcrypt.hash('AdminPass123!', 10);
    const cmdPass = await bcrypt.hash('CommandPass123!', 10);
    const logPass = await bcrypt.hash('LogisticsPass123!', 10);

    const uAdmin = (await client.query("INSERT INTO users (username, password_hash, role, base_id) VALUES ('admin_user', $1, 'ADMIN', NULL) RETURNING id", [adminPass])).rows[0].id;
    const uCmd = (await client.query("INSERT INTO users (username, password_hash, role, base_id) VALUES ('commander_north', $1, 'BASE_COMMANDER', $2) RETURNING id", [cmdPass, b1])).rows[0].id;
    const uLog = (await client.query("INSERT INTO users (username, password_hash, role, base_id) VALUES ('logistics_officer', $1, 'LOGISTICS_OFFICER', NULL) RETURNING id", [logPass])).rows[0].id;

    console.log('Inserting Indian Military Equipment Types...');
    const eq1 = (await client.query("INSERT INTO equipment_types (name, category) VALUES ('INSAS Rifle', 'WEAPON') RETURNING id")).rows[0].id;
    const eq2 = (await client.query("INSERT INTO equipment_types (name, category) VALUES ('Carl Gustaf M4', 'WEAPON') RETURNING id")).rows[0].id;
    const eq3 = (await client.query("INSERT INTO equipment_types (name, category) VALUES ('Tata Safari Storme', 'VEHICLE') RETURNING id")).rows[0].id;
    const eq4 = (await client.query("INSERT INTO equipment_types (name, category) VALUES ('T-90 Bhishma Tank', 'VEHICLE') RETURNING id")).rows[0].id;
    const eq5 = (await client.query("INSERT INTO equipment_types (name, category) VALUES ('5.56x45mm INSAS Ammo', 'AMMUNITION') RETURNING id")).rows[0].id;
    const eq6 = (await client.query("INSERT INTO equipment_types (name, category) VALUES ('Multi-Mode Hand Grenade', 'AMMUNITION') RETURNING id")).rows[0].id;

    // Helper function to generate dynamic date strings relative to today
    const getDaysAgo = (days) => {
      const d = new Date();
      d.setDate(d.getDate() - days);
      return d.toISOString().split('T')[0];
    };

    console.log('Inserting purchases...');
    const p1 = (await client.query("INSERT INTO purchases (base_id, equipment_type_id, quantity, purchase_date, purchased_by) VALUES ($1, $2, 100, $3, $4) RETURNING id", [b1, eq1, getDaysAgo(45), uLog])).rows[0].id;
    await writeAuditLog(uLog, 'CREATE_PURCHASE', 'purchases', p1, { baseId: b1, equipmentTypeId: eq1, quantity: 100 }, client);

    const p2 = (await client.query("INSERT INTO purchases (base_id, equipment_type_id, quantity, purchase_date, purchased_by) VALUES ($1, $2, 5000, $3, $4) RETURNING id", [b1, eq5, getDaysAgo(45), uLog])).rows[0].id;
    await writeAuditLog(uLog, 'CREATE_PURCHASE', 'purchases', p2, { baseId: b1, equipmentTypeId: eq5, quantity: 5000 }, client);

    const p3 = (await client.query("INSERT INTO purchases (base_id, equipment_type_id, quantity, purchase_date, purchased_by) VALUES ($1, $2, 20, $3, $4) RETURNING id", [b2, eq3, getDaysAgo(40), uAdmin])).rows[0].id;
    await writeAuditLog(uAdmin, 'CREATE_PURCHASE', 'purchases', p3, { baseId: b2, equipmentTypeId: eq3, quantity: 20 }, client);

    const p4 = (await client.query("INSERT INTO purchases (base_id, equipment_type_id, quantity, purchase_date, purchased_by) VALUES ($1, $2, 30, $3, $4) RETURNING id", [b2, eq2, getDaysAgo(20), uLog])).rows[0].id;
    await writeAuditLog(uLog, 'CREATE_PURCHASE', 'purchases', p4, { baseId: b2, equipmentTypeId: eq2, quantity: 30 }, client);

    const p5 = (await client.query("INSERT INTO purchases (base_id, equipment_type_id, quantity, purchase_date, purchased_by) VALUES ($1, $2, 5, $3, $4) RETURNING id", [b3, eq4, getDaysAgo(15), uAdmin])).rows[0].id;
    await writeAuditLog(uAdmin, 'CREATE_PURCHASE', 'purchases', p5, { baseId: b3, equipmentTypeId: eq4, quantity: 5 }, client);

    const p6 = (await client.query("INSERT INTO purchases (base_id, equipment_type_id, quantity, purchase_date, purchased_by) VALUES ($1, $2, 2000, $3, $4) RETURNING id", [b3, eq6, getDaysAgo(10), uLog])).rows[0].id;
    await writeAuditLog(uLog, 'CREATE_PURCHASE', 'purchases', p6, { baseId: b3, equipmentTypeId: eq6, quantity: 2000 }, client);

    console.log('Inserting transfers...');
    const t1 = (await client.query("INSERT INTO transfers (source_base_id, destination_base_id, equipment_type_id, quantity, transfer_date, status, initiated_by) VALUES ($1, $2, $3, 20, $4, 'COMPLETED', $5) RETURNING id", [b1, b2, eq1, getDaysAgo(35), uAdmin])).rows[0].id;
    await writeAuditLog(uAdmin, 'CREATE_TRANSFER', 'transfers', t1, { sourceBaseId: b1, destBaseId: b2, equipmentTypeId: eq1, quantity: 20 }, client);

    const t2 = (await client.query("INSERT INTO transfers (source_base_id, destination_base_id, equipment_type_id, quantity, transfer_date, status, initiated_by) VALUES ($1, $2, $3, 5, $4, 'COMPLETED', $5) RETURNING id", [b2, b3, eq3, getDaysAgo(25), uLog])).rows[0].id;
    await writeAuditLog(uLog, 'CREATE_TRANSFER', 'transfers', t2, { sourceBaseId: b2, destBaseId: b3, equipmentTypeId: eq3, quantity: 5 }, client);

    const t3 = (await client.query("INSERT INTO transfers (source_base_id, destination_base_id, equipment_type_id, quantity, transfer_date, status, initiated_by) VALUES ($1, $2, $3, 500, $4, 'COMPLETED', $5) RETURNING id", [b3, b1, eq6, getDaysAgo(8), uLog])).rows[0].id;
    await writeAuditLog(uLog, 'CREATE_TRANSFER', 'transfers', t3, { sourceBaseId: b3, destBaseId: b1, equipmentTypeId: eq6, quantity: 500 }, client);

    console.log('Inserting assignments...');
    const a1 = (await client.query("INSERT INTO assignments (base_id, equipment_type_id, quantity, assigned_to, assigned_date, assigned_by) VALUES ($1, $2, 30, 'Ghatak Commando Platoon', $3, $4) RETURNING id", [b1, eq1, getDaysAgo(32), uCmd])).rows[0].id;
    await writeAuditLog(uCmd, 'CREATE_ASSIGNMENT', 'assignments', a1, { baseId: b1, eqId: eq1, qty: 30 }, client);

    const a2 = (await client.query("INSERT INTO assignments (base_id, equipment_type_id, quantity, assigned_to, assigned_date, assigned_by) VALUES ($1, $2, 3, '50th Independent Para Brigade', $3, $4) RETURNING id", [b2, eq3, getDaysAgo(18), uAdmin])).rows[0].id;
    await writeAuditLog(uAdmin, 'CREATE_ASSIGNMENT', 'assignments', a2, { baseId: b2, eqId: eq3, qty: 3 }, client);

    const a3 = (await client.query("INSERT INTO assignments (base_id, equipment_type_id, quantity, assigned_to, assigned_date, assigned_by) VALUES ($1, $2, 2, '2nd Armoured Regiment', $3, $4) RETURNING id", [b3, eq4, getDaysAgo(5), uAdmin])).rows[0].id;
    await writeAuditLog(uAdmin, 'CREATE_ASSIGNMENT', 'assignments', a3, { baseId: b3, eqId: eq4, qty: 2 }, client);

    console.log('Inserting expenditures...');
    const ex1 = (await client.query("INSERT INTO expenditures (base_id, equipment_type_id, quantity, expenditure_date, reason, expended_by) VALUES ($1, $2, 500, $3, 'Border patrol firing drills', $4) RETURNING id", [b1, eq5, getDaysAgo(31), uCmd])).rows[0].id;
    await writeAuditLog(uCmd, 'CREATE_EXPENDITURE', 'expenditures', ex1, { reason: 'Border patrol firing drills' }, client);

    const ex2 = (await client.query("INSERT INTO expenditures (base_id, equipment_type_id, quantity, expenditure_date, reason, expended_by) VALUES ($1, $2, 5, $3, 'High-altitude tactical operations', $4) RETURNING id", [b2, eq2, getDaysAgo(12), uAdmin])).rows[0].id;
    await writeAuditLog(uAdmin, 'CREATE_EXPENDITURE', 'expenditures', ex2, { reason: 'High-altitude tactical operations' }, client);

    const ex3 = (await client.query("INSERT INTO expenditures (base_id, equipment_type_id, quantity, expenditure_date, reason, expended_by) VALUES ($1, $2, 100, $3, 'Counter-insurgency target practice', $4) RETURNING id", [b3, eq6, getDaysAgo(4), uAdmin])).rows[0].id;
    await writeAuditLog(uAdmin, 'CREATE_EXPENDITURE', 'expenditures', ex3, { reason: 'Counter-insurgency target practice' }, client);

    await client.query('COMMIT');

    console.log(`
╔══════════════════════════════════════════════════════╗
║     INDIAN MILITARY SEED COMPLETE — CREDENTIALS      ║
╠══════════════════════════════════════════════════════╣
║  Role               Username           Password      ║
║  ADMIN              admin_user         AdminPass123! ║
║  BASE_COMMANDER     commander_north    CommandPass123!║
║  LOGISTICS_OFFICER  logistics_officer  LogisticsPass123!║
╚══════════════════════════════════════════════════════╝
`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err);
  } finally {
    client.release();
    process.exit(0);
  }
};

seed();
