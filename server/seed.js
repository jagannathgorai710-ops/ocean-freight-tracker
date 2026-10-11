import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, db } from './database.js';
import { parseEmailText, splitInboxEmails } from './emailParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export function parseCSV(csvContent) {
  const lines = csvContent.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = line.split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((header, idx) => {
      obj[header] = values[idx] !== undefined ? values[idx] : '';
    });
    rows.push(obj);
  }
  return rows;
}

export function computeShipmentStatus(departureDate, expectedArrival, deliveredDate, simulationDate = '2026-10-06') {
  if (deliveredDate && deliveredDate.trim() !== '') {
    return 'Delivered';
  }
  const refDate = new Date(simulationDate || '2026-10-06');
  const expDate = new Date(expectedArrival);
  if (refDate > expDate) {
    return 'Delayed';
  }
  return 'In Transit';
}

export async function seedInitialData(forceReset = false) {
  if (forceReset) {
    console.log('🔄 Force resetting database tables...');
    await query.run('DELETE FROM carrier_rates');
    await query.run('DELETE FROM shipments');
    await query.run('DELETE FROM email_inbox');
    await query.run('DELETE FROM audit_logs');
  }

  // 1. Seed Carrier Rates
  const rateCount = await query.get('SELECT COUNT(*) as count FROM carrier_rates');
  if (rateCount.count === 0) {
    const ratesPath = path.join(rootDir, 'carrier_rates.csv');
    if (fs.existsSync(ratesPath)) {
      const csvData = fs.readFileSync(ratesPath, 'utf-8');
      const rows = parseCSV(csvData);
      console.log(`📥 Seeding ${rows.length} carrier rates...`);
      for (const row of rows) {
        if (!row.carrier) continue;
        await query.run(
          `INSERT INTO carrier_rates (carrier, origin_port, destination_port, container_type, rate_usd, transit_days, last_updated_by)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            row.carrier,
            row.origin_port,
            row.destination_port,
            row.container_type,
            parseFloat(row.rate_usd),
            parseInt(row.transit_days, 10),
            'carrier_rates.csv'
          ]
        );
      }
    }
  }

  // 2. Seed Sample Shipments
  const shipmentCount = await query.get('SELECT COUNT(*) as count FROM shipments');
  if (shipmentCount.count === 0) {
    const shipmentsPath = path.join(rootDir, 'sample_shipments.csv');
    if (fs.existsSync(shipmentsPath)) {
      const csvData = fs.readFileSync(shipmentsPath, 'utf-8');
      const rows = parseCSV(csvData);
      console.log(`📥 Seeding ${rows.length} shipments...`);
      for (const row of rows) {
        if (!row.shipment_id) continue;
        const status = computeShipmentStatus(
          row.departure_date,
          row.expected_arrival,
          row.delivered_date,
          '2026-10-06'
        );
        const invoiceAmt = row.invoice_amount_usd ? parseFloat(row.invoice_amount_usd) : null;
        await query.run(
          `INSERT INTO shipments (shipment_id, carrier, origin_port, destination_port, container_type, departure_date, expected_arrival, delivered_date, invoice_amount_usd, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            row.shipment_id,
            row.carrier,
            row.origin_port,
            row.destination_port,
            row.container_type,
            row.departure_date,
            row.expected_arrival,
            row.delivered_date || null,
            invoiceAmt,
            status
          ]
        );
      }
    }
  }

  // 3. Seed Email Inbox
  const emailCount = await query.get('SELECT COUNT(*) as count FROM email_inbox');
  if (emailCount.count === 0) {
    const emailsPath = path.join(rootDir, 'sample_emails.txt');
    if (fs.existsSync(emailsPath)) {
      const textData = fs.readFileSync(emailsPath, 'utf-8');
      const emailBlocks = splitInboxEmails(textData);
      console.log(`📥 Seeding ${emailBlocks.length} emails into inbox...`);

      for (const block of emailBlocks) {
        const parsed = parseEmailText(block.rawText, block.emailIndex);
        await query.run(
          `INSERT INTO email_inbox (email_index, sender, subject, date, body, parsed_type, parsed_data, status, reason)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            parsed.emailIndex,
            parsed.sender,
            parsed.subject,
            parsed.date,
            parsed.body,
            parsed.parsedType,
            JSON.stringify(parsed.data),
            parsed.actionable ? 'pending' : 'skipped',
            parsed.reason
          ]
        );
      }
    }
  }

  // Log audit
  await query.run(
    `INSERT INTO audit_logs (action_type, entity, details, source)
     VALUES (?, ?, ?, ?)`,
    ['SYSTEM_SEED', 'DATABASE', 'Initial dataset seeded successfully from CSV and sample_emails.txt', 'System']
  );

  console.log('✅ Seeding completed.');
}
