import express from 'express';
import { query } from '../database.js';
import { parseEmailText, splitInboxEmails } from '../emailParser.js';
import { authenticateToken, requireRole } from './auth.js';

const router = express.Router();

// GET /api/emails/inbox - List all emails with parsed metadata
router.get('/inbox', async (req, res) => {
  try {
    const emails = await query.all('SELECT * FROM email_inbox ORDER BY email_index ASC, id ASC');
    const parsedList = emails.map(e => ({
      ...e,
      parsed_data: e.parsed_data ? JSON.parse(e.parsed_data) : null
    }));

    const stats = {
      total: parsedList.length,
      actionable: parsedList.filter(e => e.parsed_type === 'RATE_UPDATE' || e.parsed_type === 'SHIPMENT_STATUS').length,
      rateUpdates: parsedList.filter(e => e.parsed_type === 'RATE_UPDATE').length,
      shipmentUpdates: parsedList.filter(e => e.parsed_type === 'SHIPMENT_STATUS').length,
      skippedOrIrrelevant: parsedList.filter(e => e.parsed_type === 'IRRELEVANT' || e.parsed_type === 'MALFORMED' || e.parsed_type === 'SKIPPED').length,
      appliedCount: parsedList.filter(e => e.status === 'applied').length
    };

    res.json({ stats, emails: parsedList });
  } catch (err) {
    console.error('Error fetching email inbox:', err);
    res.status(500).json({ error: 'Failed to retrieve email inbox' });
  }
});

// POST /api/emails/parse-raw - Test live parsing of any custom email
router.post('/parse-raw', (req, res) => {
  try {
    const { emailText } = req.body;
    if (!emailText || typeof emailText !== 'string') {
      return res.status(400).json({ error: 'emailText string is required' });
    }

    const parsed = parseEmailText(emailText, 1);
    res.json({ result: parsed });
  } catch (err) {
    console.error('Parse raw error:', err);
    res.status(500).json({ error: 'Failed to parse email text' });
  }
});

// POST /api/emails/apply/:id - Apply single email to live database
router.post('/apply/:id', authenticateToken, requireRole(['Admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const emailRecord = await query.get('SELECT * FROM email_inbox WHERE id = ?', [id]);
    if (!emailRecord) return res.status(404).json({ error: 'Email not found in inbox' });

    if (emailRecord.status === 'applied') {
      return res.status(400).json({ error: 'This email update has already been applied.' });
    }

    if (!['RATE_UPDATE', 'SHIPMENT_STATUS'].includes(emailRecord.parsed_type)) {
      return res.status(400).json({ error: `Cannot apply email of type ${emailRecord.parsed_type}. Reason: ${emailRecord.reason}` });
    }

    const data = JSON.parse(emailRecord.parsed_data);
    let diff = {};

    if (emailRecord.parsed_type === 'RATE_UPDATE') {
      const existingRate = await query.get(
        `SELECT * FROM carrier_rates 
         WHERE carrier = ? AND origin_port = ? AND destination_port = ? AND container_type = ?`,
        [data.carrier, data.originPort, data.destinationPort, data.containerType]
      );

      if (existingRate) {
        diff = {
          type: 'RATE_UPDATE',
          carrier: data.carrier,
          route: `${data.originPort} → ${data.destinationPort}`,
          containerType: data.containerType,
          oldRate: existingRate.rate_usd,
          newRate: data.rateUsd,
          variance: data.rateUsd - existingRate.rate_usd
        };

        await query.run(
          `UPDATE carrier_rates 
           SET rate_usd = ?, last_updated_by = ?, updated_at = CURRENT_TIMESTAMP 
           WHERE id = ?`,
          [data.rateUsd, `Email #${emailRecord.email_index || emailRecord.id}`, existingRate.id]
        );
      } else {
        diff = {
          type: 'RATE_INSERT',
          carrier: data.carrier,
          route: `${data.originPort} → ${data.destinationPort}`,
          containerType: data.containerType,
          oldRate: null,
          newRate: data.rateUsd
        };

        await query.run(
          `INSERT INTO carrier_rates (carrier, origin_port, destination_port, container_type, rate_usd, transit_days, last_updated_by)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [data.carrier, data.originPort, data.destinationPort, data.containerType, data.rateUsd, 30, `Email #${emailRecord.email_index || emailRecord.id}`]
        );
      }

      await query.run(
        `INSERT INTO audit_logs (action_type, entity, entity_id, details, source, user) VALUES (?, ?, ?, ?, ?, ?)`,
        ['EMAIL_RATE_SYNC', 'carrier_rates', data.carrier, `Automated Rate Update via Email: ${data.carrier} ${data.originPort}->${data.destinationPort} to $${data.rateUsd}`, 'Email Parser', req.user.username]
      );
    } else if (emailRecord.parsed_type === 'SHIPMENT_STATUS') {
      const existingShipment = await query.get(
        'SELECT * FROM shipments WHERE shipment_id = ?',
        [data.shipmentId]
      );

      if (!existingShipment) {
        return res.status(404).json({ error: `Shipment ${data.shipmentId} not found in tracking database.` });
      }

      diff = {
        type: 'SHIPMENT_STATUS',
        shipmentId: data.shipmentId,
        carrier: existingShipment.carrier,
        route: `${existingShipment.origin_port} → ${existingShipment.destination_port}`,
        oldStatus: existingShipment.status,
        newStatus: data.status,
        oldDeliveredDate: existingShipment.delivered_date,
        newDeliveredDate: data.deliveredDate || existingShipment.delivered_date,
        reason: data.statusReason
      };

      await query.run(
        `UPDATE shipments 
         SET status = ?, status_reason = ?, delivered_date = COALESCE(?, delivered_date), notes = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          data.status,
          data.statusReason,
          data.deliveredDate || null,
          `Auto-updated via Email #${emailRecord.email_index || emailRecord.id}: ${data.statusReason || data.status}`,
          existingShipment.id
        ]
      );

      await query.run(
        `INSERT INTO audit_logs (action_type, entity, entity_id, details, source, user) VALUES (?, ?, ?, ?, ?, ?)`,
        ['EMAIL_SHIPMENT_SYNC', 'shipments', data.shipmentId, `Automated Status Update via Email: ${data.shipmentId} -> ${data.status} (${data.statusReason})`, 'Email Parser', req.user.username]
      );
    }

    // Mark email as applied
    await query.run(
      'UPDATE email_inbox SET status = ?, applied_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['applied', id]
    );

    res.json({
      message: 'Email update successfully applied to system',
      diff
    });
  } catch (err) {
    console.error('Apply email error:', err);
    res.status(500).json({ error: 'Failed to apply email update' });
  }
});

// POST /api/emails/apply-all - Batch process all actionable emails
router.post('/apply-all', authenticateToken, requireRole(['Admin']), async (req, res) => {
  try {
    const pendingEmails = await query.all(
      `SELECT * FROM email_inbox 
       WHERE status = 'pending' AND parsed_type IN ('RATE_UPDATE', 'SHIPMENT_STATUS')
       ORDER BY email_index ASC`
    );

    let ratesUpdated = 0;
    let shipmentsUpdated = 0;
    const appliedDiffs = [];

    for (const emailRecord of pendingEmails) {
      const data = JSON.parse(emailRecord.parsed_data);

      if (emailRecord.parsed_type === 'RATE_UPDATE') {
        const existingRate = await query.get(
          `SELECT * FROM carrier_rates 
           WHERE carrier = ? AND origin_port = ? AND destination_port = ? AND container_type = ?`,
          [data.carrier, data.originPort, data.destinationPort, data.containerType]
        );

        if (existingRate) {
          await query.run(
            `UPDATE carrier_rates 
             SET rate_usd = ?, last_updated_by = ?, updated_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [data.rateUsd, `Email #${emailRecord.email_index}`, existingRate.id]
          );
          appliedDiffs.push({
            type: 'RATE_UPDATE',
            emailIndex: emailRecord.email_index,
            carrier: data.carrier,
            route: `${data.originPort} → ${data.destinationPort} (${data.containerType})`,
            oldRate: existingRate.rate_usd,
            newRate: data.rateUsd
          });
          ratesUpdated++;
        }
      } else if (emailRecord.parsed_type === 'SHIPMENT_STATUS') {
        const existingShipment = await query.get(
          'SELECT * FROM shipments WHERE shipment_id = ?',
          [data.shipmentId]
        );

        if (existingShipment) {
          await query.run(
            `UPDATE shipments 
             SET status = ?, status_reason = ?, delivered_date = COALESCE(?, delivered_date), notes = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [
              data.status,
              data.statusReason,
              data.deliveredDate || null,
              `Auto-updated via Email #${emailRecord.email_index}: ${data.statusReason || data.status}`,
              existingShipment.id
            ]
          );
          appliedDiffs.push({
            type: 'SHIPMENT_STATUS',
            emailIndex: emailRecord.email_index,
            shipmentId: data.shipmentId,
            oldStatus: existingShipment.status,
            newStatus: data.status,
            reason: data.statusReason
          });
          shipmentsUpdated++;
        }
      }

      await query.run(
        'UPDATE email_inbox SET status = ?, applied_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['applied', emailRecord.id]
      );
    }

    await query.run(
      `INSERT INTO audit_logs (action_type, entity, details, source, user) VALUES (?, ?, ?, ?, ?)`,
      ['EMAIL_BATCH_SYNC', 'SYSTEM', `Batch applied ${ratesUpdated} rate updates and ${shipmentsUpdated} shipment status updates`, 'Email Sync Engine', req.user.username]
    );

    res.json({
      message: `Batch sync complete: ${ratesUpdated} rates updated, ${shipmentsUpdated} shipments updated.`,
      ratesUpdated,
      shipmentsUpdated,
      totalProcessed: pendingEmails.length,
      diffs: appliedDiffs
    });
  } catch (err) {
    console.error('Batch apply error:', err);
    res.status(500).json({ error: 'Failed to batch apply emails' });
  }
});

// POST /api/emails/add-manual - Add custom email text to inbox
router.post('/add-manual', authenticateToken, async (req, res) => {
  try {
    const { rawText } = req.body;
    if (!rawText) return res.status(400).json({ error: 'rawText is required' });

    const emailCount = await query.get('SELECT COUNT(*) as count FROM email_inbox');
    const newIndex = emailCount.count + 1;

    const parsed = parseEmailText(rawText, newIndex);

    const result = await query.run(
      `INSERT INTO email_inbox (email_index, sender, subject, date, body, parsed_type, parsed_data, status, reason)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newIndex,
        parsed.sender || req.user.email,
        parsed.subject || 'Manual Rate / Shipment Notice',
        parsed.date || new Date().toISOString().split('T')[0],
        parsed.body,
        parsed.parsedType,
        JSON.stringify(parsed.data),
        parsed.actionable ? 'pending' : 'skipped',
        parsed.reason
      ]
    );

    res.status(201).json({
      message: 'Email added to inbox',
      id: result.lastID,
      parsed
    });
  } catch (err) {
    console.error('Add manual email error:', err);
    res.status(500).json({ error: 'Failed to add manual email' });
  }
});

export default router;
