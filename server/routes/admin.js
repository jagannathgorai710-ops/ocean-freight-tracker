import express from 'express';
import { query } from '../database.js';
import { seedInitialData } from '../seed.js';
import { authenticateToken, requireRole } from './auth.js';

const router = express.Router();

// POST /api/admin/reset-data - Re-seed database from sample files
router.post('/reset-data', authenticateToken, requireRole(['Admin']), async (req, res) => {
  try {
    await seedInitialData(true);
    res.json({
      message: 'System database successfully restored to default sample dataset (Rates, Shipments, and Inbox).'
    });
  } catch (err) {
    console.error('Reset data error:', err);
    res.status(500).json({ error: 'Failed to reset database' });
  }
});

// GET /api/admin/audit-logs - Fetch audit trail
router.get('/audit-logs', authenticateToken, requireRole(['Admin']), async (req, res) => {
  try {
    const logs = await query.all('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100');
    res.json({ logs });
  } catch (err) {
    console.error('Audit logs error:', err);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// GET /api/admin/users - Fetch users list
router.get('/users', authenticateToken, requireRole(['Admin']), async (req, res) => {
  try {
    const users = await query.all('SELECT id, username, email, role, created_at FROM users ORDER BY id ASC');
    res.json({ users });
  } catch (err) {
    console.error('Fetch users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/admin/system-status - Fetch database stats
router.get('/system-status', authenticateToken, requireRole(['Admin']), async (req, res) => {
  try {
    const ratesCount = await query.get('SELECT COUNT(*) as count FROM carrier_rates');
    const shipmentsCount = await query.get('SELECT COUNT(*) as count FROM shipments');
    const emailsCount = await query.get('SELECT COUNT(*) as count FROM parsed_emails');
    const usersCount = await query.get('SELECT COUNT(*) as count FROM users');
    const auditLogsCount = await query.get('SELECT COUNT(*) as count FROM audit_logs');

    res.json({
      ratesCount: ratesCount?.count || 0,
      shipmentsCount: shipmentsCount?.count || 0,
      emailsCount: emailsCount?.count || 0,
      usersCount: usersCount?.count || 0,
      auditLogsCount: auditLogsCount?.count || 0,
      uptimeSeconds: process.uptime(),
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage()
    });
  } catch (err) {
    console.error('System status error:', err);
    res.status(500).json({ error: 'Failed to fetch system status' });
  }
});

export default router;
