import express from 'express';
import * as XLSX from 'xlsx';
import { query } from '../database.js';
import { computeShipmentStatus } from '../seed.js';

const router = express.Router();

// GET /api/analytics/summary - High level KPI cards
router.get('/summary', async (req, res) => {
  try {
    const totalRates = await query.get('SELECT COUNT(*) as count FROM carrier_rates');
    const totalShipments = await query.get('SELECT COUNT(*) as count FROM shipments');
    const carriers = await query.get('SELECT COUNT(DISTINCT carrier) as count FROM carrier_rates');
    
    // Status breakdown
    const shipments = await query.all('SELECT * FROM shipments');
    let inTransit = 0;
    let delivered = 0;
    let delayed = 0;
    let totalInvoiced = 0;

    for (const s of shipments) {
      const st = s.status_reason ? s.status : computeShipmentStatus(s.departure_date, s.expected_arrival, s.delivered_date);
      if (st === 'In Transit') inTransit++;
      else if (st === 'Delivered') delivered++;
      else if (st === 'Delayed') delayed++;

      if (s.invoice_amount_usd) totalInvoiced += s.invoice_amount_usd;
    }

    // Email stats
    const totalEmails = await query.get('SELECT COUNT(*) as count FROM email_inbox');
    const appliedEmails = await query.get("SELECT COUNT(*) as count FROM email_inbox WHERE status = 'applied'");

    // Discrepancy stats
    let totalOvercharges = 0;
    for (const s of shipments) {
      if (s.invoice_amount_usd) {
        const rate = await query.get(
          'SELECT rate_usd FROM carrier_rates WHERE carrier = ? AND origin_port = ? AND destination_port = ? AND container_type = ?',
          [s.carrier, s.origin_port, s.destination_port, s.container_type]
        );
        if (rate && s.invoice_amount_usd > rate.rate_usd) {
          totalOvercharges += (s.invoice_amount_usd - rate.rate_usd);
        }
      }
    }

    res.json({
      totalRates: totalRates.count,
      totalShipments: totalShipments.count,
      totalCarriers: carriers.count,
      shipmentStatus: {
        inTransit,
        delivered,
        delayed
      },
      totalInvoicedUsd: Math.round(totalInvoiced),
      totalOverchargesUsd: Math.round(totalOvercharges),
      totalEmails: totalEmails.count,
      appliedEmails: appliedEmails.count,
      autoSyncRatePct: totalEmails.count > 0 ? Math.round((appliedEmails.count / totalEmails.count) * 100) : 0
    });
  } catch (err) {
    console.error('Analytics summary error:', err);
    res.status(500).json({ error: 'Failed to compute analytics summary' });
  }
});

// GET /api/analytics/charts - Chart data distributions
router.get('/charts', async (req, res) => {
  try {
    const shipments = await query.all('SELECT * FROM shipments');
    const rates = await query.all('SELECT * FROM carrier_rates');

    // 1. Shipments by Status
    let statusMap = { 'In Transit': 0, 'Delivered': 0, 'Delayed': 0 };
    shipments.forEach(s => {
      const st = s.status_reason ? s.status : computeShipmentStatus(s.departure_date, s.expected_arrival, s.delivered_date);
      statusMap[st] = (statusMap[st] || 0) + 1;
    });

    // 2. Carrier Shipment Volume & On-time
    const carrierPerformance = {};
    shipments.forEach(s => {
      if (!carrierPerformance[s.carrier]) {
        carrierPerformance[s.carrier] = { carrier: s.carrier, total: 0, delivered: 0, delayed: 0, inTransit: 0 };
      }
      carrierPerformance[s.carrier].total++;
      const st = s.status_reason ? s.status : computeShipmentStatus(s.departure_date, s.expected_arrival, s.delivered_date);
      if (st === 'Delivered') carrierPerformance[s.carrier].delivered++;
      else if (st === 'Delayed') carrierPerformance[s.carrier].delayed++;
      else carrierPerformance[s.carrier].inTransit++;
    });

    // 3. Rate Comparison by Port Corridors (Average USD for 20ft and 40ft)
    const routePrices = {};
    rates.forEach(r => {
      const key = `${r.origin_port} → ${r.destination_port}`;
      if (!routePrices[key]) routePrices[key] = { route: key, count20: 0, sum20: 0, count40: 0, sum40: 0 };
      if (r.container_type === '20ft') {
        routePrices[key].count20++;
        routePrices[key].sum20 += r.rate_usd;
      } else {
        routePrices[key].count40++;
        routePrices[key].sum40 += r.rate_usd;
      }
    });

    const routePriceArray = Object.values(routePrices).map(item => ({
      route: item.route,
      avg20ft: item.count20 ? Math.round(item.sum20 / item.count20) : 0,
      avg40ft: item.count40 ? Math.round(item.sum40 / item.count40) : 0
    }));

    res.json({
      statusDistribution: statusMap,
      carrierPerformance: Object.values(carrierPerformance),
      routePriceArray: routePriceArray.slice(0, 8)
    });
  } catch (err) {
    console.error('Charts error:', err);
    res.status(500).json({ error: 'Failed to retrieve chart metrics' });
  }
});

// GET /api/analytics/export/:type - Export data as Excel (.xlsx) or CSV
router.get('/export/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const format = req.query.format === 'csv' ? 'csv' : 'xlsx';

    let data = [];
    let filename = `ocean_freight_${type}_${Date.now()}`;

    if (type === 'rates') {
      data = await query.all('SELECT carrier, origin_port, destination_port, container_type, rate_usd, transit_days, last_updated_by, updated_at FROM carrier_rates ORDER BY origin_port, destination_port, rate_usd');
      filename = `Carrier_Rates_Matrix_${new Date().toISOString().split('T')[0]}`;
    } else if (type === 'shipments') {
      const raw = await query.all('SELECT * FROM shipments ORDER BY departure_date DESC');
      data = raw.map(s => ({
        shipment_id: s.shipment_id,
        carrier: s.carrier,
        origin_port: s.origin_port,
        destination_port: s.destination_port,
        container_type: s.container_type,
        departure_date: s.departure_date,
        expected_arrival: s.expected_arrival,
        delivered_date: s.delivered_date || 'N/A',
        status: s.status,
        invoice_amount_usd: s.invoice_amount_usd || 'Pending',
        notes: s.notes || ''
      }));
      filename = `Ocean_Shipments_Log_${new Date().toISOString().split('T')[0]}`;
    } else if (type === 'invoices') {
      const shipments = await query.all('SELECT * FROM shipments ORDER BY shipment_id ASC');
      for (const s of shipments) {
        if (!s.invoice_amount_usd) continue;
        const rate = await query.get(
          'SELECT rate_usd FROM carrier_rates WHERE carrier = ? AND origin_port = ? AND destination_port = ? AND container_type = ?',
          [s.carrier, s.origin_port, s.destination_port, s.container_type]
        );
        const contract = rate ? rate.rate_usd : 0;
        const diff = s.invoice_amount_usd - contract;
        data.push({
          shipment_id: s.shipment_id,
          carrier: s.carrier,
          route: `${s.origin_port} -> ${s.destination_port}`,
          container_type: s.container_type,
          contracted_rate_usd: contract,
          invoiced_amount_usd: s.invoice_amount_usd,
          discrepancy_usd: diff,
          audit_status: diff === 0 ? 'Correct' : (diff > 0 ? `Overcharged by $${diff}` : `Undercharged by $${Math.abs(diff)}`)
        });
      }
      filename = `Invoice_Audit_Report_${new Date().toISOString().split('T')[0]}`;
    } else {
      return res.status(400).json({ error: 'Invalid export type. Use rates, shipments, or invoices' });
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    if (format === 'csv') {
      const csvBuffer = XLSX.write(workbook, { bookType: 'csv', type: 'buffer' });
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.setHeader('Content-Type', 'text/csv');
      return res.send(csvBuffer);
    } else {
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      return res.send(excelBuffer);
    }
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Failed to generate export file' });
  }
});

export default router;
