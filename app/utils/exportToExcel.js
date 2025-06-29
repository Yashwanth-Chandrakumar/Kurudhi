import * as XLSX from 'xlsx';

/**
 * Export an array of objects to an Excel file (single sheet).
 * @param {Object[]} rows - Array of objects to export. Keys will form headers.
 * @param {string} filename - Filename with extension, e.g. "data.xlsx".
 */
export default function exportToExcel(rows, filename = 'data.xlsx') {
  if (!Array.isArray(rows) || !rows.length) {
    console.warn('[exportToExcel] Nothing to export');
    return;
  }

    // Sanitize data to avoid Excel limitations (max 32,767 chars per cell) and convert complex types
  const MAX_CELL_LENGTH = 32760; // a bit below the hard limit
  const sanitizedRows = rows.map((row) => {
    const sanitized = {};
    Object.entries(row).forEach(([key, value]) => {
      let val = value;
      if (val === undefined || val === null) {
        sanitized[key] = '';
        return;
      }
      // Handle Firestore Timestamp objects
      if (val?.toDate) {
        val = val.toDate();
      }
      // Convert objects / arrays to JSON string
      if (typeof val === 'object' && !(val instanceof Date)) {
        try {
          val = JSON.stringify(val);
        } catch (_) {
          val = String(val);
        }
      }
      // Convert Date to ISO string for readability
      if (val instanceof Date) {
        val = val.toISOString();
      }
      // Truncate overly long strings
      if (typeof val === 'string' && val.length > MAX_CELL_LENGTH) {
        val = val.slice(0, MAX_CELL_LENGTH);
      }
      sanitized[key] = val;
    });
    return sanitized;
  });

  // Convert data to worksheet
  const worksheet = XLSX.utils.json_to_sheet(sanitizedRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  // Trigger download
  XLSX.writeFile(workbook, filename);
}
