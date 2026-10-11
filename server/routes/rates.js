import express from 'express';
import { query } from '../database.js';
import { authenticateToken, requireRole } from './auth.js';

const router = express.Router();

// Approximate Nautical Distances for Sustainability Calculations
const ROUTE_DISTANCES = {
  'Nhava Sheva-Los Angeles': 9450,
  'Nhava Sheva-Long Beach': 9450,
  'Nhava Sheva-New York': 8200,
  'Nhava Sheva-Savannah': 8400,
  'Nhava Sheva-Houston': 8800,
  'Nhava Sheva-Norfolk': 8300,

  'Mundra-Los Angeles': 9500,
  'Mundra-Long Beach': 9500,
  'Mundra-New York': 8150,
  'Mundra-Savannah': 8350,
  'Mundra-Houston': 8750,
  'Mundra-Norfolk': 8250,

  'Chennai-Los Angeles': 9800,
  'Chennai-Long Beach': 9800,
  'Chennai-New York': 8900,
  'Chennai-Savannah': 9100,
  'Chennai-Houston': 9500,
  'Chennai-Norfolk': 9000,

  'Kolkata-Los Angeles': 10200,
  'Kolkata-Long Beach': 10200,
  'Kolkata-New York': 9300,
  'Kolkata-Savannah': 9500,
  'Kolkata-Houston': 9900,
  'Kolkata-Norfolk': 9400,
};

function calculateSustainabilityMetrics(origin, destination, containerType, transitDays) {
  const routeKey = `${origin}-${destination}`;
  const distanceNM = ROUTE_DISTANCES[routeKey] || 8800;
  const teuMultiplier = containerType === '40ft' ? 2 : 1;

  // Modern container ship avg emissions: ~0.028 kg CO2e per TEU-Nautical Mile
  const carbonKg = Math.round(distanceNM * 0.028 * teuMultiplier);
  const carbonTons = (carbonKg / 1000).toFixed(2);

  // Carbon vs Air freight savings (~50x reduction)
  const airEquivalentKg = Math.round(carbonKg * 42);
  const co2SavedVsAirKg = airEquivalentKg - carbonKg;

  // Eco-Rating based on speed efficiency
  let ecoRating = 'A';
  if (transitDays <= 27) ecoRating = 'A+ (High Efficiency)';
  else if (transitDays <= 32) ecoRating = 'A (Optimal Speed)';
  else if (transitDays <= 36) ecoRating = 'B (Standard Green)';
  else ecoRating = 'C (Slow Steaming)';

  return {
    distanceNauticalMiles: distanceNM,
    estimatedCO2Kg: carbonKg,
    estimatedCO2Tons: parseFloat(carbonTons),
    co2SavedVsAirKg,
    ecoRating
  };
}

// GET /api/rates/ports - List unique origin and destination ports
router.get('/ports', async (req, res) => {
  try {
    const origins = await query.all('SELECT DISTINCT origin_port FROM carrier_rates ORDER BY origin_port ASC');
    const destinations = await query.all('SELECT DISTINCT destination_port FROM carrier_rates ORDER BY destination_port ASC');
    const carriers = await query.all('SELECT DISTINCT carrier FROM carrier_rates ORDER BY carrier ASC');

    res.json({
      origins: origins.map(r => r.origin_port),
      destinations: destinations.map(r => r.destination_port),
      carriers: carriers.map(r => r.carrier)
    });
  } catch (err) {
    console.error('Error fetching ports:', err);
    res.status(500).json({ error: 'Failed to retrieve port metadata' });
  }
});

// GET /api/rates/search - Module 1: Rate Search & Compare
router.get('/search', async (req, res) => {
  try {
    const { origin, destination, containerType, sortBy = 'price' } = req.query;

    if (!origin || !destination || !containerType) {
      return res.status(400).json({ error: 'origin, destination, and containerType are required query parameters' });
    }

    const rates = await query.all(
      `SELECT * FROM carrier_rates 
       WHERE origin_port = ? AND destination_port = ? AND container_type = ?
       ORDER BY rate_usd ASC`,
      [origin.trim(), destination.trim(), containerType.trim()]
    );

    if (rates.length === 0) {
      return res.json({
        found: 0,
        origin,
        destination,
        containerType,
        cheapest: null,
        results: []
      });
    }

    // Identify cheapest rate
    const minRate = rates[0].rate_usd;
    const maxRate = rates[rates.length - 1].rate_usd;
    const avgRate = Math.round(rates.reduce((acc, r) => acc + r.rate_usd, 0) / rates.length);

    const enrichedResults = rates.map((rate, index) => {
      const isCheapest = rate.rate_usd === minRate;
      const savingsVsMax = Math.round(maxRate - rate.rate_usd);
      const savingsVsAvg = Math.round(avgRate - rate.rate_usd);
      const sustainability = calculateSustainabilityMetrics(origin, destination, containerType, rate.transit_days);

      return {
        ...rate,
        isCheapest,
        savingsVsMax,
        savingsVsAvg: savingsVsAvg > 0 ? savingsVsAvg : 0,
        sustainability
      };
    });

    // Optional sort adjustment
    if (sortBy === 'transit_days') {
      enrichedResults.sort((a, b) => a.transit_days - b.transit_days);
    } else if (sortBy === 'price_desc') {
      enrichedResults.sort((a, b) => b.rate_usd - a.rate_usd);
    }

    res.json({
      found: enrichedResults.length,
      origin,
      destination,
      containerType,
      cheapestRateUsd: minRate,
      averageRateUsd: avgRate,
      maxRateUsd: maxRate,
      cheapestCarrier: rates[0].carrier,
      results: enrichedResults
    });
  } catch (err) {
    console.error('Rate search error:', err);
    res.status(500).json({ error: 'Failed to perform rate search' });
  }
});

// GET /api/rates - Full Rate Directory with filtering
router.get('/', async (req, res) => {
  try {
    const { origin, destination, containerType, carrier, search } = req.query;
    let sql = 'SELECT * FROM carrier_rates WHERE 1=1';
    const params = [];

    if (origin) {
      sql += ' AND origin_port = ?';
      params.push(origin);
    }
    if (destination) {
      sql += ' AND destination_port = ?';
      params.push(destination);
    }
    if (containerType) {
      sql += ' AND container_type = ?';
      params.push(containerType);
    }
    if (carrier) {
      sql += ' AND carrier = ?';
      params.push(carrier);
    }
    if (search) {
      sql += ' AND (carrier LIKE ? OR origin_port LIKE ? OR destination_port LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY origin_port ASC, destination_port ASC, rate_usd ASC';

    const rates = await query.all(sql, params);
    res.json({ total: rates.length, rates });
  } catch (err) {
    console.error('Fetch all rates error:', err);
    res.status(500).json({ error: 'Failed to fetch rates directory' });
  }
});

// POST /api/rates - Add new rate (Admin only)
router.post('/', authenticateToken, requireRole(['Admin']), async (req, res) => {
  try {
    const { carrier, origin_port, destination_port, container_type, rate_usd, transit_days } = req.body;
    if (!carrier || !origin_port || !destination_port || !container_type || !rate_usd || !transit_days) {
      return res.status(400).json({ error: 'All rate fields are required' });
    }

    const result = await query.run(
      `INSERT INTO carrier_rates (carrier, origin_port, destination_port, container_type, rate_usd, transit_days, last_updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [carrier.trim(), origin_port.trim(), destination_port.trim(), container_type.trim(), parseFloat(rate_usd), parseInt(transit_days, 10), req.user.username]
    );

    await query.run(
      `INSERT INTO audit_logs (action_type, entity, entity_id, details, user) VALUES (?, ?, ?, ?, ?)`,
      ['RATE_CREATE', 'carrier_rates', result.lastID.toString(), `Added rate for ${carrier} (${origin_port} -> ${destination_port}) at $${rate_usd}`, req.user.username]
    );

    res.status(201).json({ message: 'Carrier rate added successfully', id: result.lastID });
  } catch (err) {
    console.error('Rate creation error:', err);
    res.status(500).json({ error: 'Failed to create rate' });
  }
});

// PUT /api/rates/:id - Update rate (Admin only)
router.put('/:id', authenticateToken, requireRole(['Admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { carrier, origin_port, destination_port, container_type, rate_usd, transit_days } = req.body;

    const existing = await query.get('SELECT * FROM carrier_rates WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Rate not found' });

    await query.run(
      `UPDATE carrier_rates 
       SET carrier = ?, origin_port = ?, destination_port = ?, container_type = ?, rate_usd = ?, transit_days = ?, last_updated_by = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [carrier, origin_port, destination_port, container_type, parseFloat(rate_usd), parseInt(transit_days, 10), req.user.username, id]
    );

    await query.run(
      `INSERT INTO audit_logs (action_type, entity, entity_id, details, user) VALUES (?, ?, ?, ?, ?)`,
      ['RATE_UPDATE', 'carrier_rates', id.toString(), `Updated rate: $${existing.rate_usd} -> $${rate_usd}`, req.user.username]
    );

    res.json({ message: 'Rate updated successfully' });
  } catch (err) {
    console.error('Rate update error:', err);
    res.status(500).json({ error: 'Failed to update rate' });
  }
});

// DELETE /api/rates/:id - Delete rate (Admin only)
router.delete('/:id', authenticateToken, requireRole(['Admin']), async (req, res) => {
  try {
    const { id } = req.params;
    await query.run('DELETE FROM carrier_rates WHERE id = ?', [id]);
    await query.run(
      `INSERT INTO audit_logs (action_type, entity, entity_id, details, user) VALUES (?, ?, ?, ?, ?)`,
      ['RATE_DELETE', 'carrier_rates', id.toString(), `Deleted rate ID ${id}`, req.user.username]
    );
    res.json({ message: 'Rate deleted successfully' });
  } catch (err) {
    console.error('Rate delete error:', err);
    res.status(500).json({ error: 'Failed to delete rate' });
  }
});

export default router;
