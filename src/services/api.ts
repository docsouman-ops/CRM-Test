/**
 * Google Sheets via Google Apps Script Web App API Client
 * 
 * Rules:
 * - GET {URL}?tab={tab}&key={secret} returns { rows: [...] }
 * - POST {URL} with body { key, tab, row } or { key, tab, rows: [...] } to add/update matched by "id"
 * - POST {URL} with body { key, tab, action: "delete", row: { id } } to delete
 * - CRITICAL: Always send POST with header Content-Type: text/plain to avoid CORS preflight errors!
 * - The "id" field must always be the FIRST key of every row object.
 */

export interface AppsScriptResponse<T = unknown> {
  success?: boolean;
  rows?: T[];
  message?: string;
  error?: string;
}

export class SheetsApiClient {
  private url: string;
  private secret: string;

  constructor(url: string, secret: string) {
    this.url = url.trim();
    this.secret = secret.trim();
  }

  isConfigured(): boolean {
    return Boolean(this.url && this.secret);
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.url || !this.secret) {
      return { success: false, message: 'Web App URL and Secret Key are required.' };
    }

    try {
      const targetUrl = new URL(this.url);
      targetUrl.searchParams.set('tab', 'Settings');
      targetUrl.searchParams.set('key', this.secret);

      const response = await fetch(targetUrl.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          success: false,
          message: `Server returned HTTP ${response.status} (${response.statusText}). Check your Web App URL.`,
        };
      }

      const data = await response.json();
      if (data.error) {
        return { success: false, message: `Apps Script error: ${data.error}` };
      }

      return { success: true, message: 'Connected to Google Sheets successfully!' };
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        message: `Connection failed: ${errMessage}. Ensure your Apps Script is deployed as Web App with access set to "Anyone".`,
      };
    }
  }

  async fetchTab<T = Record<string, unknown>>(tabName: string): Promise<T[]> {
    if (!this.isConfigured()) return [];

    try {
      const targetUrl = new URL(this.url);
      targetUrl.searchParams.set('tab', tabName);
      targetUrl.searchParams.set('key', this.secret);

      const response = await fetch(targetUrl.toString(), {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: AppsScriptResponse<T> = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      return data.rows || [];
    } catch (err) {
      console.warn(`[SheetsApiClient] Error fetching tab ${tabName}:`, err);
      throw err;
    }
  }

  /**
   * Upsert a single row.
   * Ensures 'id' is the FIRST key of the row object.
   */
  async upsertRow(tabName: string, row: Record<string, unknown>): Promise<boolean> {
    if (!this.isConfigured()) return false;

    // Order keys so 'id' is guaranteed first
    const { id, ...rest } = row;
    const orderedRow = { id, ...rest };

    const payload = JSON.stringify({
      key: this.secret,
      tab: tabName,
      row: orderedRow,
    });

    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain', // Prevents CORS preflight
        },
        body: payload,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const res = await response.json();
      return !res.error;
    } catch (err) {
      console.warn(`[SheetsApiClient] Error upserting row to ${tabName}:`, err);
      throw err;
    }
  }

  /**
   * Upsert multiple rows in a batch.
   */
  async batchUpsertRows(tabName: string, rows: Record<string, unknown>[]): Promise<boolean> {
    if (!this.isConfigured() || rows.length === 0) return false;

    const orderedRows = rows.map((r) => {
      const { id, ...rest } = r;
      return { id, ...rest };
    });

    const payload = JSON.stringify({
      key: this.secret,
      tab: tabName,
      rows: orderedRows,
    });

    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: payload,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const res = await response.json();
      return !res.error;
    } catch (err) {
      console.warn(`[SheetsApiClient] Error batch upserting rows to ${tabName}:`, err);
      throw err;
    }
  }

  async deleteRow(tabName: string, id: string): Promise<boolean> {
    if (!this.isConfigured()) return false;

    const payload = JSON.stringify({
      key: this.secret,
      tab: tabName,
      action: 'delete',
      row: { id },
    });

    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: payload,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const res = await response.json();
      return !res.error;
    } catch (err) {
      console.warn(`[SheetsApiClient] Error deleting row from ${tabName}:`, err);
      throw err;
    }
  }
}

/**
 * Returns the ready-to-deploy Google Apps Script Code
 * for Green View Agrotech CRM.
 */
export function getAppsScriptTemplateCode(secretKey: string = 'GVA_SOLAR_SECRET_2026'): string {
  return `/**
 * Green View Agrotech CRM - Google Apps Script Backend
 * Rooftop Solar CRM (PM Surya Ghar)
 * 
 * Instructions:
 * 1. In your Google Sheet, click Extensions > Apps Script
 * 2. Delete everything and paste this entire code
 * 3. Change SECRET_KEY below if desired
 * 4. Click Deploy > New deployment > Select type: Web app
 * 5. Set 'Execute as': Me
 * 6. Set 'Who has access': Anyone
 * 7. Click Deploy, copy the Web App URL and paste it in Green View Agrotech CRM Settings
 */

const SECRET_KEY = "${secretKey}";

const TABS = ["Users", "Leads", "Calls", "Checklists", "ChecklistQuestions", "Settings"];

function doGet(e) {
  try {
    const key = e.parameter.key;
    if (key !== SECRET_KEY) {
      return responseJSON({ error: "Unauthorized: Invalid Secret Key" });
    }

    const tabName = e.parameter.tab;
    if (!tabName) {
      return responseJSON({ error: "Missing tab parameter" });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ensureTabsExist(ss);

    const sheet = ss.getSheetByName(tabName);
    if (!sheet) {
      return responseJSON({ error: "Tab not found: " + tabName });
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return responseJSON({ rows: [] });
    }

    const headers = data[0];
    const rows = [];
    for (var i = 1; i < data.length; i++) {
      var rowObj = {};
      var isEmpty = true;
      for (var j = 0; j < headers.length; j++) {
        var val = data[i][j];
        if (val !== "" && val !== null && val !== undefined) isEmpty = false;
        // Parse JSON strings if applicable
        if (typeof val === "string" && (val.startsWith("{") || val.startsWith("["))) {
          try {
            val = JSON.parse(val);
          } catch (ex) {}
        }
        rowObj[headers[j]] = val;
      }
      if (!isEmpty && rowObj.id) {
        rows.push(rowObj);
      }
    }

    return responseJSON({ rows: rows });
  } catch (err) {
    return responseJSON({ error: err.toString() });
  }
}

function doPost(e) {
  try {
    const rawContent = e.postData.contents;
    const body = JSON.parse(rawContent);

    if (body.key !== SECRET_KEY) {
      return responseJSON({ error: "Unauthorized: Invalid Secret Key" });
    }

    const tabName = body.tab;
    if (!tabName) {
      return responseJSON({ error: "Missing tab parameter" });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ensureTabsExist(ss);

    const sheet = ss.getSheetByName(tabName);
    if (!sheet) {
      return responseJSON({ error: "Tab not found: " + tabName });
    }

    // Handle delete action
    if (body.action === "delete" && body.row && body.row.id) {
      const deleteId = String(body.row.id);
      const data = sheet.getDataRange().getValues();
      for (var r = 1; r < data.length; r++) {
        if (String(data[r][0]) === deleteId) {
          sheet.deleteRow(r + 1);
          return responseJSON({ success: true, message: "Row deleted" });
        }
      }
      return responseJSON({ success: false, message: "Row not found" });
    }

    // Handle upsert (single or multiple)
    const rowsToUpsert = body.rows ? body.rows : (body.row ? [body.row] : []);
    if (rowsToUpsert.length === 0) {
      return responseJSON({ error: "No rows provided for upsert" });
    }

    // Get current headers and rows
    var data = sheet.getDataRange().getValues();
    var headers = data.length > 0 && data[0][0] !== "" ? data[0] : ["id"];
    
    // Check if new columns need to be added
    var headerMap = {};
    headers.forEach(function(h, idx) { headerMap[h] = idx; });

    rowsToUpsert.forEach(function(row) {
      Object.keys(row).forEach(function(k) {
        if (headerMap[k] === undefined) {
          headers.push(k);
          headerMap[k] = headers.length - 1;
        }
      });
    });

    // Write updated headers if new ones were added
    if (headers.length > (data.length > 0 ? data[0].length : 0)) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }

    // Re-fetch data matrix after potential header change
    data = sheet.getDataRange().getValues();
    var existingIdRowMap = {};
    for (var r = 1; r < data.length; r++) {
      var rowId = String(data[r][0]);
      if (rowId) {
        existingIdRowMap[rowId] = r + 1; // 1-based row index in sheet
      }
    }

    // Apply upserts
    rowsToUpsert.forEach(function(row) {
      var rowId = String(row.id);
      var rowValues = [];
      for (var c = 0; c < headers.length; c++) {
        var hName = headers[c];
        var val = row[hName];
        if (typeof val === "object" && val !== null) {
          val = JSON.stringify(val);
        } else if (val === undefined || val === null) {
          val = "";
        }
        rowValues.push(val);
      }

      if (existingIdRowMap[rowId]) {
        // Update existing row
        var targetRowIndex = existingIdRowMap[rowId];
        sheet.getRange(targetRowIndex, 1, 1, headers.length).setValues([rowValues]);
      } else {
        // Append new row
        sheet.appendRow(rowValues);
        existingIdRowMap[rowId] = sheet.getLastRow();
      }
    });

    return responseJSON({ success: true, count: rowsToUpsert.length });
  } catch (err) {
    return responseJSON({ error: err.toString() });
  }
}

function ensureTabsExist(ss) {
  TABS.forEach(function(tabName) {
    var sheet = ss.getSheetByName(tabName);
    if (!sheet) {
      sheet = ss.insertSheet(tabName);
      if (tabName === "Users") {
        sheet.appendRow(["id", "name", "username", "passwordHash", "role", "active", "phone"]);
      } else if (tabName === "Leads") {
        sheet.appendRow(["id", "name", "phone", "email", "campaign", "source", "createdAt", "assignedTelecallerId", "assignedTelecallerName", "status", "notes", "callbackDate", "callbackTime", "surveyDate", "surveyTime", "address", "pinCode", "checklistAnswers", "assignedSurveyorId", "assignedSurveyorName", "surveyStatus", "callAttempts"]);
      } else if (tabName === "Calls") {
        sheet.appendRow(["id", "leadId", "leadName", "phone", "timestamp", "duration", "status", "notes", "telecallerId", "telecallerName", "recordingUrl"]);
      } else if (tabName === "ChecklistQuestions") {
        sheet.appendRow(["id", "sectionKey", "sectionTitle", "questionText", "order"]);
      } else if (tabName === "Settings") {
        sheet.appendRow(["id", "key", "value"]);
      } else {
        sheet.appendRow(["id"]);
      }
    }
  });
}

function responseJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
}
