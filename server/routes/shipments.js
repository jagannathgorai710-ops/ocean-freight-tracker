import express from 'express';
import { query } from '../database.js';
import { computeShipmentStatus } from '../seed.js';
import { authenticateToken, requireRole } from './auth.js';

const router = express.Router();

const PORT_COORDINATES = {
  'Nhava Sheva': { lat: 18.9496, lng: 72.9515, code: 'INNSA', country: 'India' },
  'Mundra': { lat: 22.7562, lng: 69.7027, code: 'INMUN', country: 'India' },
  'Chennai': { lat: 13.0827, lng: 80.2707, code: 'INMAA', country: 'India' },
  'Kolkata': { lat: 22.5726, lng: 88.3639, code: 'INCCU', country: 'India' },
  'Los Angeles': { lat: 33.7432, lng: -118.2673, code: 'USLAX', country: 'USA' },
  'Long Beach': { lat: 33.7701, lng: -118.1937, code: 'USLGB', country: 'USA' },
  'New York': { lat: 40.6698, lng: -74.1352, code: 'USNYC', country: 'USA' },
  'Savannah': { lat: 32.0809, lng: -81.0912, code: 'USSAV', country: 'USA' },
  'Houston': { lat: 29.7604, lng: -95.3698, code: 'USHOU', country: 'USA' },
  'Norfolk': { lat: 36.8508, lng: -76.2859, code: 'USORF', country: 'USA' }
};

function calculateProgress(departureDate, expectedArrival, deliveredDate, simulationDate = '2026-10-06') {
  if (deliveredDate && deliveredDate.trim() !== '') return 100;
  const dep = new Date(departureDate).getTime();
  const exp = new Date(expectedArrival).getTime();
  const now = new Date(simulationDate).getTime();

  if (now <= dep) return 5;
  if (now >= exp) return 95;

  const total = exp - dep;
  const elapsed = now - dep;
  const pct = Math.min(Math.max(Math.round((elapsed / total) * 100), 10), 92);
  return pct;
}

// GET /api/shipments - List all shipments with computed status & filters
router.get('/', async (req, res) => {
  try {
    const { status, carrier, search, simulationDate = '2026-10-06' } = req.query;

    let sql = 'SELECT * FROM shipments WHERE 1=1';
    const params = [];

    if (carrier) {
      sql += ' AND carrier = ?';
      params.push(carrier);
    }
    if (search) {
      sql += ' AND (shipment_id LIKE ? OR origin_port LIKE ? OR destination_port LIKE ? OR carrier LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY departure_date DESC';

    const rawShipments = await query.all(sql, params);

    // Compute dynamic status and milestones
    const enriched = rawShipments.map(s => {
      // Recompute status based on expected arrival and delivered date
      let currentStatus = s.status;
      // If status wasn't manually overridden or email updated to specific text, compute default
      if (!s.status_reason) {
        currentStatus = computeShipmentStatus(s.departure_date, s.expected_arrival, s.delivered_date, simulationDate);
      }

      const progress = calculateProgress(s.departure_date, s.expected_arrival, s.delivered_date, simulationDate);
      const originCoords = PORT_COORDINATES[s.origin_port] || { lat: 20, lng: 75 };
      const destCoords = PORT_COORDINATES[s.destination_port] || { lat: 35, lng: -95 };

      return {
        ...s,
        status: currentStatus,
        progress,
        originCoordinates: originCoords,
        destCoordinates: destCoords
      };
    });

    // Filter by status if specified in query
    const filtered = status && status !== 'All' 
      ? enriched.filter(s => s.status.toLowerCase() === status.toLowerCase())
      : enriched;

    // Counts by status
    const statusCounts = {
      all: enriched.length,
      inTransit: enriched.filter(s => s.status === 'In Transit').length,
      delivered: enriched.filter(s => s.status === 'Delivered').length,
      delayed: enriched.filter(s => s.status === 'Delayed').length
    };

    res.json({
      total: filtered.length,
      statusCounts,
      simulationDate,
      shipments: filtered
    });
  } catch (err) {
    console.error('Shipments fetch error:', err);
    res.status(500).json({ error: 'Failed to retrieve shipments' });
  }
});

// GET /api/shipments/:id - Single shipment details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const shipment = await query.get('SELECT * FROM shipments WHERE shipment_id = ? OR id = ?', [id, id]);
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

    const status = shipment.status_reason 
      ? shipment.status 
      : computeShipmentStatus(shipment.departure_date, shipment.expected_arrival, shipment.delivered_date);

    const progress = calculateProgress(shipment.departure_date, shipment.expected_arrival, shipment.delivered_date);

    // Find contracted rate
    const contractedRate = await query.get(
      `SELECT * FROM carrier_rates 
       WHERE carrier = ? AND origin_port = ? AND destination_port = ? AND container_type = ?`,
      [shipment.carrier, shipment.origin_port, shipment.destination_port, shipment.container_type]
    );

    res.json({
      ...shipment,
      status,
      progress,
      contractedRate: contractedRate ? contractedRate.rate_usd : null,
      originCoords: PORT_COORDINATES[shipment.origin_port],
      destCoords: PORT_COORDINATES[shipment.destination_port]
    });
  } catch (err) {
    console.error('Shipment detail error:', err);
    res.status(500).json({ error: 'Failed to fetch shipment detail' });
  }
});

// POST /api/shipments - Add new shipment
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      shipment_id,
      carrier,
      origin_port,
      destination_port,
      container_type,
      departure_date,
      expected_arrival,
      delivered_date,
      invoice_amount_usd,
      notes
    } = req.body;

    if (!shipment_id || !carrier || !origin_port || !destination_port || !container_type || !departure_date || !expected_arrival) {
      return res.status(400).json({ error: 'Missing required shipment fields' });
    }

    const existing = await query.get('SELECT id FROM shipments WHERE shipment_id = ?', [shipment_id.trim().toUpperCase()]);
    if (existing) {
      return res.status(409).json({ error: `Shipment ${shipment_id} already exists` });
    }

    const status = computeShipmentStatus(departure_date, expected_arrival, delivered_date);

    const result = await query.run(
      `INSERT INTO shipments (shipment_id, carrier, origin_port, destination_port, container_type, departure_date, expected_arrival, delivered_date, invoice_amount_usd, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        shipment_id.trim().toUpperCase(),
        carrier.trim(),
        origin_port.trim(),
        destination_port.trim(),
        container_type.trim(),
        departure_date,
        expected_arrival,
        delivered_date || null,
        invoice_amount_usd ? parseFloat(invoice_amount_usd) : null,
        status,
        notes || null
      ]
    );

    await query.run(
      `INSERT INTO audit_logs (action_type, entity, entity_id, details, user) VALUES (?, ?, ?, ?, ?)`,
      ['SHIPMENT_CREATE', 'shipments', shipment_id, `Created shipment ${shipment_id} (${origin_port} -> ${destination_port})`, req.user.username]
    );

    res.status(201).json({
      message: 'Shipment created successfully',
      shipment_id: shipment_id.trim().toUpperCase(),
      id: result.lastID
    });
  } catch (err) {
    console.error('Shipment creation error:', err);
    res.status(500).json({ error: 'Failed to create shipment' });
  }
});

// PUT /api/shipments/:id - Update shipment (status, dates, delivered date, notes)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      status_reason,
      delivered_date,
      expected_arrival,
      invoice_amount_usd,
      notes
    } = req.body;

    const shipment = await query.get('SELECT * FROM shipments WHERE shipment_id = ? OR id = ?', [id, id]);
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

    let finalStatus = status || shipment.status;
    let finalDelivered = delivered_date !== undefined ? delivered_date : shipment.delivered_date;

    if (finalDelivered && finalDelivered.trim() !== '') {
      finalStatus = 'Delivered';
    }

    await query.run(
      `UPDATE shipments 
       SET status = ?, status_reason = ?, delivered_date = ?, expected_arrival = COALESCE(?, expected_arrival), invoice_amount_usd = COALESCE(?, invoice_amount_usd), notes = COALESCE(?, notes), updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        finalStatus,
        status_reason !== undefined ? status_reason : shipment.status_reason,
        finalDelivered || null,
        expected_arrival || null,
        invoice_amount_usd !== undefined ? parseFloat(invoice_amount_usd) : null,
        notes !== undefined ? notes : null,
        shipment.id
      ]
    );

    await query.run(
      `INSERT INTO audit_logs (action_type, entity, entity_id, details, user) VALUES (?, ?, ?, ?, ?)`,
      ['SHIPMENT_UPDATE', 'shipments', shipment.shipment_id, `Updated shipment status to ${finalStatus}`, req.user.username]
    );

    res.json({ message: 'Shipment updated successfully', shipment_id: shipment.shipment_id, status: finalStatus });
  } catch (err) {
    console.error('Shipment update error:', err);
    res.status(500).json({ error: 'Failed to update shipment' });
  }
});

// DELETE /api/shipments/:id - Delete shipment (Admin only)
router.delete('/:id', authenticateToken, requireRole(['Admin']), async (req, res) => {
  try {
    const { id } = req.params;
    await query.run('DELETE FROM shipments WHERE shipment_id = ? OR id = ?', [id, id]);
    await query.run(
      `INSERT INTO audit_logs (action_type, entity, entity_id, details, user) VALUES (?, ?, ?, ?, ?)`,
      ['SHIPMENT_DELETE', 'shipments', id, `Deleted shipment ${id}`, req.user.username]
    );
    res.json({ message: 'Shipment deleted successfully' });
  } catch (err) {
    console.error('Shipment delete error:', err);
    res.status(500).json({ error: 'Failed to delete shipment' });
  }
});

export default router;
