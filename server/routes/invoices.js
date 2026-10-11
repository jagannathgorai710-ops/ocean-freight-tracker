import express from 'express';
import { query } from '../database.js';
import { authenticateToken } from './auth.js';

const router = express.Router();
const USD_TO_INR_RATE = 84.50; // 1 USD = 84.50 INR

function evaluateInvoice(contractedRate, invoiceAmount) {
  const contract = parseFloat(contractedRate);
  const invoiced = parseFloat(invoiceAmount);
  const diff = Number((invoiced - contract).toFixed(2));
  const diffInr = Math.round(diff * USD_TO_INR_RATE);
  const percentDiff = contract > 0 ? Number(((diff / contract) * 100).toFixed(2)) : 0;

  let status = 'CORRECT';
  let badgeColor = 'emerald';
  let message = 'Invoice matches contracted carrier rate exactly.';

  if (diff > 0) {
    status = 'OVERCHARGED';
    badgeColor = 'rose';
    message = `Overcharged by $${diff.toLocaleString()} (₹${diffInr.toLocaleString()} INR) - [${percentDiff}% above contracted rate]`;
  } else if (diff < 0) {
    status = 'UNDERCHARGED';
    badgeColor = 'blue';
    message = `Discount / Undercharged by $${Math.abs(diff).toLocaleString()} (₹${Math.abs(diffInr).toLocaleString()} INR) [${Math.abs(percentDiff)}% savings]`;
  }

  return {
    contractedRateUsd: contract,
    contractedRateInr: Math.round(contract * USD_TO_INR_RATE),
    invoicedAmountUsd: invoiced,
    invoicedAmountInr: Math.round(invoiced * USD_TO_INR_RATE),
    differenceUsd: diff,
    differenceInr: diffInr,
    percentageVariance: percentDiff,
    status,
    badgeColor,
    message
  };
}

// POST /api/invoices/check - Single Invoice Checker
router.post('/check', async (req, res) => {
  try {
    const {
      shipmentId,
      carrier,
      originPort,
      destinationPort,
      containerType,
      invoiceAmountUsd
    } = req.body;

    if (!invoiceAmountUsd || isNaN(invoiceAmountUsd)) {
      return res.status(400).json({ error: 'Valid invoiceAmountUsd is required' });
    }

    let shipment = null;
    let targetCarrier = carrier;
    let targetOrigin = originPort;
    let targetDest = destinationPort;
    let targetContainer = containerType;

    // If shipmentId provided, lookup shipment details
    if (shipmentId) {
      shipment = await query.get('SELECT * FROM shipments WHERE shipment_id = ?', [shipmentId.trim().toUpperCase()]);
      if (shipment) {
        targetCarrier = shipment.carrier;
        targetOrigin = shipment.origin_port;
        targetDest = shipment.destination_port;
        targetContainer = shipment.container_type;
      }
    }

    if (!targetCarrier || !targetOrigin || !targetDest || !targetContainer) {
      return res.status(400).json({
        error: 'Carrier, Origin Port, Destination Port, and Container Type must be provided or matched via Shipment ID'
      });
    }

    // Lookup contracted rate
    const rateRecord = await query.get(
      `SELECT * FROM carrier_rates 
       WHERE carrier = ? AND origin_port = ? AND destination_port = ? AND container_type = ?`,
      [targetCarrier, targetOrigin, targetDest, targetContainer]
    );

    if (!rateRecord) {
      return res.status(404).json({
        error: `No contracted rate found for ${targetCarrier} on route ${targetOrigin} -> ${targetDest} (${targetContainer})`
      });
    }

    const evaluation = evaluateInvoice(rateRecord.rate_usd, invoiceAmountUsd);

    res.json({
      shipmentId: shipment ? shipment.shipment_id : null,
      carrier: targetCarrier,
      route: `${targetOrigin} → ${targetDest}`,
      originPort: targetOrigin,
      destinationPort: targetDest,
      containerType: targetContainer,
      contractedTransitDays: rateRecord.transit_days,
      ...evaluation
    });
  } catch (err) {
    console.error('Invoice check error:', err);
    res.status(500).json({ error: 'Failed to verify invoice rate' });
  }
});

// GET /api/invoices/audit-all - Bulk audit all existing shipments in database
router.get('/audit-all', async (req, res) => {
  try {
    const shipments = await query.all('SELECT * FROM shipments ORDER BY shipment_id ASC');
    const auditResults = [];

    let totalInvoicedUsd = 0;
    let totalContractedUsd = 0;
    let totalOverchargesUsd = 0;
    let totalSavingsUsd = 0;
    let overchargedCount = 0;
    let correctCount = 0;
    let underchargedCount = 0;

    for (const shp of shipments) {
      if (!shp.invoice_amount_usd) continue;

      const rate = await query.get(
        `SELECT * FROM carrier_rates 
         WHERE carrier = ? AND origin_port = ? AND destination_port = ? AND container_type = ?`,
        [shp.carrier, shp.origin_port, shp.destination_port, shp.container_type]
      );

      if (rate) {
        const evalResult = evaluateInvoice(rate.rate_usd, shp.invoice_amount_usd);
        totalInvoicedUsd += evalResult.invoicedAmountUsd;
        totalContractedUsd += evalResult.contractedRateUsd;

        if (evalResult.differenceUsd > 0) {
          totalOverchargesUsd += evalResult.differenceUsd;
          overchargedCount++;
        } else if (evalResult.differenceUsd < 0) {
          totalSavingsUsd += Math.abs(evalResult.differenceUsd);
          underchargedCount++;
        } else {
          correctCount++;
        }

        auditResults.push({
          shipment_id: shp.shipment_id,
          carrier: shp.carrier,
          origin_port: shp.origin_port,
          destination_port: shp.destination_port,
          container_type: shp.container_type,
          departure_date: shp.departure_date,
          expected_arrival: shp.expected_arrival,
          status: shp.status,
          ...evalResult
        });
      }
    }

    res.json({
      totalAudited: auditResults.length,
      summary: {
        totalInvoicedUsd: Math.round(totalInvoicedUsd),
        totalContractedUsd: Math.round(totalContractedUsd),
        totalOverchargesUsd: Math.round(totalOverchargesUsd),
        totalOverchargesInr: Math.round(totalOverchargesUsd * USD_TO_INR_RATE),
        totalSavingsUsd: Math.round(totalSavingsUsd),
        overchargedCount,
        correctCount,
        underchargedCount,
        discrepancyRatePct: auditResults.length > 0 ? Number(((overchargedCount / auditResults.length) * 100).toFixed(1)) : 0
      },
      auditResults
    });
  } catch (err) {
    console.error('Audit all error:', err);
    res.status(500).json({ error: 'Failed to run full invoice audit' });
  }
});

// POST /api/invoices/generate-dispute - Generates dispute letter
router.post('/generate-dispute', (req, res) => {
  const {
    shipmentId,
    carrier,
    originPort,
    destinationPort,
    containerType,
    contractedRateUsd,
    invoicedAmountUsd,
    differenceUsd
  } = req.body;

  const claimId = `CLM-${Math.floor(100000 + Math.random() * 900000)}`;
  const todayStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const disputeLetter = `
FORMAL NOTICE OF FREIGHT INVOICE DISCREPANCY & DISPUTE
======================================================
Claim Reference: ${claimId}
Date: ${todayStr}
To: Accounts Receivable & Billing Department, ${carrier || 'Carrier Billing'}
From: Freight Audit & Logistics Compliance Division

Subject: Discrepancy Notice for Shipment Ref: ${shipmentId || 'N/A'} (Route: ${originPort} to ${destinationPort})

Dear Billing Team,

Upon automated audit of the billing statements for shipment ${shipmentId || 'under reference'}, our system has identified an uncontracted billing discrepancy:

1. SHIPMENT DETAILS:
   - Bill of Lading / Shipment ID: ${shipmentId || 'N/A'}
   - Carrier: ${carrier}
   - Routing: ${originPort} -> ${destinationPort}
   - Equipment / Container: ${containerType}

2. AUDIT BREAKDOWN:
   - Contracted Base Ocean Tariff:  USD $${parseFloat(contractedRateUsd).toFixed(2)}
   - Invoiced / Billed Amount:     USD $${parseFloat(invoicedAmountUsd).toFixed(2)}
   --------------------------------------------------------------
   - Disputed Overcharge Amount:   USD $${parseFloat(differenceUsd).toFixed(2)} (INR ₹${(parseFloat(differenceUsd) * USD_TO_INR_RATE).toLocaleString()})

3. RESOLUTION REQUEST:
   In accordance with our Service Contract and agreed tariff matrix, please issue an immediate Credit Note (or corrected invoice) in the amount of USD $${parseFloat(differenceUsd).toFixed(2)}.

Kindly confirm receipt of this dispute notice and provide an updated statement within 5 business days.

Sincerely,
Ocean Freight Audit Team
Sustainable Supply Chain Operations
`.trim();

  res.json({
    claimId,
    date: todayStr,
    disputeLetter
  });
});

export default router;
