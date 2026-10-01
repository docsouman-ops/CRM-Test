/**
 * Utility for converting Google Sheet links into CSV export URLs,
 * fetching CSV content, parsing CSV into headers and records,
 * and mapping columns into CRM Lead objects with 10-digit phone deduplication.
 */

import { ColumnMapping, Lead } from '../types';

/**
 * Converts a Google Sheet URL (view, edit, or publish link) into a direct CSV export URL.
 */
export function convertToGoogleSheetCsvUrl(inputUrl: string): string {
  if (!inputUrl || typeof inputUrl !== 'string') return '';
  const url = inputUrl.trim();

  // If already a direct CSV url
  if (url.includes('format=csv') || url.includes('/pub?output=csv')) {
    return url;
  }

  // Handle standard Google Sheet URL: https://docs.google.com/spreadsheets/d/{ID}/edit#gid={GID}
  const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (idMatch && idMatch[1]) {
    const spreadsheetId = idMatch[1];
    let gid = '0';
    const gidMatch = url.match(/[#&?]gid=([0-9]+)/);
    if (gidMatch && gidMatch[1]) {
      gid = gidMatch[1];
    }
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
  }

  return url;
}

/**
 * Parse CSV text into array of rows, taking into account quoted fields and commas inside quotes.
 */
export function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentLine += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === '\r' && nextChar === '\n') || char === '\n' || char === '\r') {
      if (inQuotes) {
        currentLine += '\n';
      } else {
        if (currentLine.trim()) {
          lines.push(currentLine);
        }
        currentLine = '';
        if (char === '\r' && nextChar === '\n') i++;
      }
    } else {
      currentLine += char;
    }
  }

  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  function splitLine(line: string): string[] {
    const result: string[] = [];
    let field = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQ && line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQ = !inQ;
        }
      } else if (c === ',' && !inQ) {
        result.push(field.trim());
        field = '';
      } else {
        field += c;
      }
    }
    result.push(field.trim());
    return result;
  }

  const rawHeaders = splitLine(lines[0]);
  const headers = rawHeaders.map((h, i) => h.replace(/^["']|["']$/g, '').trim() || `Column_${i + 1}`);

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = splitLine(lines[i]);
    const rowObj: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      let val = values[j] !== undefined ? values[j] : '';
      val = val.replace(/^["']|["']$/g, '').trim();
      rowObj[headers[j]] = val;
    }
    rows.push(rowObj);
  }

  return { headers, rows };
}

/**
 * Normalizes phone numbers to 10 digits for deduplication in India (+91)
 */
export function normalizePhone(rawPhone: string): string {
  if (!rawPhone) return '';
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  if (digits.length > 10) return digits.slice(-10);
  return digits;
}

/**
 * Map raw CSV rows into CRM Leads using the user-defined column mapping.
 */
export function mapCsvRowsToLeads(
  rows: Record<string, string>[],
  mapping: ColumnMapping,
  existingPhones: Set<string>
): { newLeads: Partial<Lead>[]; duplicateCount: number } {
  const newLeads: Partial<Lead>[] = [];
  let duplicateCount = 0;
  const processedInBatch = new Set<string>();

  for (const row of rows) {
    const rawPhone = mapping.phone ? row[mapping.phone] || '' : '';
    const phone = normalizePhone(rawPhone);

    if (!phone || phone.length < 10) {
      continue; // Skip invalid phone rows
    }

    if (existingPhones.has(phone) || processedInBatch.has(phone)) {
      duplicateCount++;
      continue;
    }

    processedInBatch.add(phone);

    const name = mapping.name ? row[mapping.name] || 'Solar Lead' : 'Solar Lead';
    const email = mapping.email ? row[mapping.email] || '' : '';
    const campaign = mapping.campaign ? row[mapping.campaign] || 'PM Surya Ghar Campaign' : 'PM Surya Ghar Campaign';
    let source: 'Meta' | 'Google' | 'Manual' = 'Meta';
    if (mapping.source && row[mapping.source]) {
      const srcVal = row[mapping.source].toLowerCase();
      if (srcVal.includes('google')) source = 'Google';
      else if (srcVal.includes('manual')) source = 'Manual';
      else source = 'Meta';
    }

    newLeads.push({
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      phone,
      email,
      campaign,
      source,
      createdAt: new Date().toISOString(),
      status: 'HOT',
      callAttempts: 0,
      notes: 'Imported from ad campaign sheet',
    });
  }

  return { newLeads, duplicateCount };
}

export interface CampaignRowMappingInput {
  nameCol?: string;
  phoneCol?: string;
  emailCol?: string;
  cityCol?: string;
  addressCol?: string;
  pinCodeCol?: string;
  notesCol?: string;
}

export interface SkippedRowInfo {
  rowNumber: number;
  name: string;
  phone: string;
  reason: 'duplicate_in_crm' | 'duplicate_in_file' | 'invalid_phone';
  details: string;
}

/**
 * Maps CSV rows for a specific campaign, extracting Name, Phone, Email, City, Address, PinCode, Notes
 * and tracking duplicates across CRM + within the batch + invalid phone rows.
 */
export function mapCampaignCsvRowsToLeads(
  rows: Record<string, string>[],
  mapping: CampaignRowMappingInput,
  existingPhonesInCrm: Set<string>,
  campaignId: string,
  campaignName: string,
  campaignSource: 'Meta' | 'Google' | 'Other'
): {
  validLeads: Partial<Lead>[];
  duplicateCount: number;
  invalidCount: number;
  skippedRows: SkippedRowInfo[];
} {
  const validLeads: Partial<Lead>[] = [];
  const skippedRows: SkippedRowInfo[] = [];
  const processedInBatch = new Set<string>();

  rows.forEach((row, index) => {
    const rowNum = index + 2; // +1 for 0-index, +1 for header row
    const rawPhone = mapping.phoneCol ? row[mapping.phoneCol] || '' : '';
    const phone = normalizePhone(rawPhone);
    const rawName = mapping.nameCol ? row[mapping.nameCol] || '' : '';
    const name = rawName.trim() || 'Solar Prospect';

    if (!phone || phone.length < 10) {
      skippedRows.push({
        rowNumber: rowNum,
        name,
        phone: rawPhone,
        reason: 'invalid_phone',
        details: 'Phone number is missing or less than 10 valid digits',
      });
      return;
    }

    if (existingPhonesInCrm.has(phone)) {
      skippedRows.push({
        rowNumber: rowNum,
        name,
        phone,
        reason: 'duplicate_in_crm',
        details: 'Phone number already exists in CRM records',
      });
      return;
    }

    if (processedInBatch.has(phone)) {
      skippedRows.push({
        rowNumber: rowNum,
        name,
        phone,
        reason: 'duplicate_in_file',
        details: 'Duplicate phone number found earlier in this file',
      });
      return;
    }

    processedInBatch.add(phone);

    const email = mapping.emailCol ? (row[mapping.emailCol] || '').trim() : '';
    const city = mapping.cityCol ? (row[mapping.cityCol] || '').trim() : '';
    const address = mapping.addressCol ? (row[mapping.addressCol] || '').trim() : '';
    const pinCode = mapping.pinCodeCol ? (row[mapping.pinCodeCol] || '').trim() : '';
    const notes = mapping.notesCol ? (row[mapping.notesCol] || '').trim() : '';

    validLeads.push({
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${index}`,
      name,
      phone,
      email: email || undefined,
      city: city || undefined,
      address: address || undefined,
      pinCode: pinCode || undefined,
      notes: notes || `Imported from ${campaignName}`,
      campaignId,
      campaign: campaignName,
      source: campaignSource,
      createdAt: new Date().toISOString(),
      status: 'HOT',
      callAttempts: 0,
    });
  });

  const duplicateCount = skippedRows.filter(
    (s) => s.reason === 'duplicate_in_crm' || s.reason === 'duplicate_in_file'
  ).length;
  const invalidCount = skippedRows.filter((s) => s.reason === 'invalid_phone').length;

  return {
    validLeads,
    duplicateCount,
    invalidCount,
    skippedRows,
  };
}

/**
 * Returns sample CSV template string for download.
 */
export function getSampleCsvContent(): string {
  return `Full Name,Phone Number,Email,City,Address,Postal Code,Notes
Rajesh Kumar,9830192831,rajesh.k@example.com,Kolkata,14B Salt Lake Sector 1,700064,Interested in 3kW on-grid system
Mousumi Ghosh,9831920394,mousumi.g@example.com,Howrah,Flat 4A Salkia Main Road,711106,Has rooftop ownership and ₹3500 monthly bill
Suman Chatterjee,9832019482,suman.c@example.com,Burdwan,22 GT Road Burdwan,713101,Looking for subsidy scheme details
Debasis Sen,9830551122,,Siliguri,Hill Cart Road,734001,Commercial 5kW enquiry`;
}

