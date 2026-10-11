/**
 * Intelligent Multi-Pattern Email Parsing Engine
 * Capable of extracting carrier rates, shipment statuses, and filtering noise/malformed messages.
 */

const CARRIER_MAP = [
  { match: /oceanlink/i, name: 'OceanLink Lines' },
  { match: /bluewave/i, name: 'BlueWave Shipping' },
  { match: /globalmariner/i, name: 'GlobalMariner' },
  { match: /pacificstar/i, name: 'PacificStar Line' },
  { match: /atlassea/i, name: 'AtlasSea Carriers' },
];

const PORTS = [
  'Nhava Sheva',
  'Mundra',
  'Chennai',
  'Kolkata',
  'Los Angeles',
  'Long Beach',
  'New York',
  'Savannah',
  'Houston',
  'Norfolk'
];

const MONTH_MAP = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
};

function normalizeDateStr(str) {
  if (!str) return null;
  // Match "11 Aug 2026" or "25 Sep 2026" or "1 Oct 2026"
  const dmyMatch = str.match(/(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})/i);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const monthKey = dmyMatch[2].substring(0, 3).toLowerCase();
    const month = MONTH_MAP[monthKey] || '01';
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }
  // Match ISO YYYY-MM-DD
  const isoMatch = str.match(/\b\d{4}-\d{2}-\d{2}\b/);
  if (isoMatch) return isoMatch[0];
  return null;
}

export function parseEmailText(emailText, emailIndex = null) {
  // Extract headers
  const fromMatch = emailText.match(/From:\s*(.+)/i);
  const subjectMatch = emailText.match(/Subject:\s*(.+)/i);
  const dateMatch = emailText.match(/Date:\s*(.+)/i);

  const sender = fromMatch ? fromMatch[1].trim() : '';
  const subject = subjectMatch ? subjectMatch[1].trim() : '';
  const date = dateMatch ? dateMatch[1].trim() : '';

  // Get body after Date header or Subject header
  let body = emailText;
  const headerEndPos = emailText.search(/Date:.*\n/i);
  if (headerEndPos !== -1) {
    const splitIndex = emailText.indexOf('\n', headerEndPos);
    if (splitIndex !== -1) {
      body = emailText.substring(splitIndex).trim();
    }
  }

  const fullText = `${subject} \n ${body} \n ${sender}`;

  // 1. Check for Irrelevant / Spam / Out of Office / Newsletters
  if (
    /newsletter|maritimeweekly|weekly news|top shipping industry|unsubscribe/i.test(fullText)
  ) {
    return {
      emailIndex,
      sender,
      subject,
      date,
      body,
      parsedType: 'IRRELEVANT',
      actionable: false,
      reason: 'Maritime newsletter / promotional content - skipped automatically.',
      data: null
    };
  }

  if (
    /out of office|vacation|away from desk|company event/i.test(fullText)
  ) {
    return {
      emailIndex,
      sender,
      subject,
      date,
      body,
      parsedType: 'IRRELEVANT',
      actionable: false,
      reason: 'Out of office automatic notification - skipped.',
      data: null
    };
  }

  // 2. Identify Carrier
  let carrier = null;
  for (const c of CARRIER_MAP) {
    if (c.match.test(sender) || c.match.test(fullText)) {
      carrier = c.name;
      break;
    }
  }

  // 3. Detect Shipment ID
  const shipmentIdMatch = fullText.match(/\b(SHP\d{3,5})\b/i);
  const shipmentId = shipmentIdMatch ? shipmentIdMatch[1].toUpperCase() : null;

  // 4. Rate Update Detection
  const isRateSubject = /rate|tariff|price|quote|pricing/i.test(subject);
  const rateNumberMatch = fullText.match(/(?:USD|\$|is now|rate is|changed to|new rate)\s*(?:USD|\$)?\s*([0-9]{3,5}(?:\.[0-9]{2})?)/i);

  // Check if it's a Shipment Status Update
  const isShipmentUpdate = shipmentId || /shipment status|delivery confirmation|status update|status change|in transit/i.test(subject);

  if (isShipmentUpdate) {
    // If it mentions shipment status but has NO shipment ID
    if (!shipmentId) {
      return {
        emailIndex,
        sender,
        subject,
        date,
        body,
        parsedType: 'MALFORMED',
        actionable: false,
        reason: 'Missing shipment reference number (e.g., SHP1001) in email body.',
        data: null
      };
    }

    let status = 'In Transit';
    let statusReason = '';
    let deliveredDate = null;

    if (/delivered|delivered successfully|delivery confirmation/i.test(fullText)) {
      status = 'Delivered';
      statusReason = 'Delivered at destination port';
      // Look for delivery date
      const dateInText = fullText.match(/on\s+(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})/i);
      if (dateInText) {
        deliveredDate = normalizeDateStr(dateInText[1]);
      } else if (date) {
        deliveredDate = normalizeDateStr(date);
      }
    } else if (/delayed|delay|congestion|rescheduling|held/i.test(fullText)) {
      status = 'Delayed';
      if (/port congestion/i.test(fullText)) {
        statusReason = 'Port congestion at destination';
      } else if (/vessel rescheduling/i.test(fullText)) {
        statusReason = 'Vessel rescheduling / delay';
      } else {
        statusReason = 'Carrier reported delay';
      }
    } else if (/in transit|departed|on schedule|no delays/i.test(fullText)) {
      status = 'In Transit';
      statusReason = 'Vessel en route on schedule';
    }

    return {
      emailIndex,
      sender,
      subject,
      date,
      body,
      parsedType: 'SHIPMENT_STATUS',
      actionable: true,
      reason: `Shipment status update for ${shipmentId} -> ${status}`,
      data: {
        shipmentId,
        carrier: carrier || 'Unknown Carrier',
        status,
        statusReason,
        deliveredDate,
        emailDate: date
      }
    };
  }

  // Rate Update Processing
  if (isRateSubject || rateNumberMatch) {
    // Check if attachment sheet was referenced instead of real numbers (e.g. Email 13)
    if (/attached sheet|check attachment|see attached|attachment not included/i.test(fullText) && !rateNumberMatch) {
      return {
        emailIndex,
        sender,
        subject,
        date,
        body,
        parsedType: 'MALFORMED',
        actionable: false,
        reason: 'Incomplete rate update: rates are inside missing attachment, no rate amount provided in body.',
        data: null
      };
    }

    if (!rateNumberMatch) {
      return {
        emailIndex,
        sender,
        subject,
        date,
        body,
        parsedType: 'MALFORMED',
        actionable: false,
        reason: 'Rate update email is missing specific numeric USD rate.',
        data: null
      };
    }

    const rateUsd = parseFloat(rateNumberMatch[1]);

    // Container type
    let containerType = '20ft';
    if (/40\s*ft|40\s*foot|40'/i.test(fullText)) {
      containerType = '40ft';
    } else if (/20\s*ft|20\s*foot|20'/i.test(fullText)) {
      containerType = '20ft';
    }

    // Extract Origin and Destination Ports
    let detectedOrigin = null;
    let detectedDestination = null;

    // Pattern: "Origin to Destination" or "Origin - Destination" or "Origin/Destination"
    const routeRegex = /(Nhava Sheva|Mundra|Chennai|Kolkata)\s*(?:to|-|\/)\s*(Los Angeles|Long Beach|New York|Savannah|Houston|Norfolk)/i;
    const routeMatch = fullText.match(routeRegex);

    if (routeMatch) {
      detectedOrigin = routeMatch[1].trim();
      detectedDestination = routeMatch[2].trim();
    } else {
      // Find individual ports
      const foundPorts = PORTS.filter(p => new RegExp(`\\b${p}\\b`, 'i').test(fullText));
      if (foundPorts.length >= 2) {
        // Indian port is usually origin, US port destination
        const indianPorts = ['Nhava Sheva', 'Mundra', 'Chennai', 'Kolkata'];
        const usPorts = ['Los Angeles', 'Long Beach', 'New York', 'Savannah', 'Houston', 'Norfolk'];
        detectedOrigin = foundPorts.find(p => indianPorts.includes(p)) || foundPorts[0];
        detectedDestination = foundPorts.find(p => usPorts.includes(p)) || foundPorts[1];
      }
    }

    if (!carrier || !detectedOrigin || !detectedDestination) {
      return {
        emailIndex,
        sender,
        subject,
        date,
        body,
        parsedType: 'MALFORMED',
        actionable: false,
        reason: `Could not determine full route or carrier (Carrier: ${carrier || '?'}, Route: ${detectedOrigin || '?'} -> ${detectedDestination || '?'})`,
        data: null
      };
    }

    // Effective Date
    const effectiveMatch = fullText.match(/effective(?:\s+from|\s+immediately)?(?:\s+on)?\s*[:]?\s*([0-9]{1,2}\s+[A-Za-z]{3,9}\s+[0-9]{4}|[0-9]{4}-[0-9]{2}-[0-9]{2})/i);
    let effectiveDate = effectiveMatch ? normalizeDateStr(effectiveMatch[1]) : (date ? normalizeDateStr(date) : new Date().toISOString().split('T')[0]);

    return {
      emailIndex,
      sender,
      subject,
      date,
      body,
      parsedType: 'RATE_UPDATE',
      actionable: true,
      reason: `Carrier ${carrier} updated ${detectedOrigin} -> ${detectedDestination} (${containerType}) to $${rateUsd}`,
      data: {
        carrier,
        originPort: detectedOrigin,
        destinationPort: detectedDestination,
        containerType,
        rateUsd,
        effectiveDate
      }
    };
  }

  // Default fallback if unhandled format
  return {
    emailIndex,
    sender,
    subject,
    date,
    body,
    parsedType: 'SKIPPED',
    actionable: false,
    reason: 'Unrecognized format or non-operational email.',
    data: null
  };
}

/**
 * Splits raw inbox text by standard separator lines
 */
export function splitInboxEmails(inboxText) {
  // Split on separator like ----------------------------------------------------------------------
  const rawBlocks = inboxText.split(/-{10,}/);
  const emails = [];

  for (let i = 0; i < rawBlocks.length; i++) {
    const block = rawBlocks[i].trim();
    if (!block) continue;
    // Skip file header intro if present
    if (block.includes('SAMPLE EMAIL INBOX - OCEAN FREIGHT RATE') && !block.includes('From:')) {
      continue;
    }
    // Extract Email Number if present (e.g. Email 1)
    const emailNumMatch = block.match(/Email\s+(\d+)/i);
    const emailIndex = emailNumMatch ? parseInt(emailNumMatch[1], 10) : (emails.length + 1);

    emails.push({
      emailIndex,
      rawText: block
    });
  }

  return emails;
}
