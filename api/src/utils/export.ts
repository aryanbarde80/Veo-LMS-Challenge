/**
 * Export Service - Export data in various formats (CSV, JSON, Excel)
 */

export interface ExportOptions {
  format: 'csv' | 'json' | 'tsv';
  fields?: string[];
  filename?: string;
}

class ExportService {
  /**
   * Export array of objects to CSV
   */
  static toCSV<T extends Record<string, any>>(
    data: T[],
    options: Partial<ExportOptions> = {}
  ): string {
    if (data.length === 0) return '';

    const fields = options.fields || Object.keys(data[0]);
    
    // CSV header
    const header = fields.map(field => this.escapeCSVField(field)).join(',');

    // CSV rows
    const rows = data.map(item => {
      return fields
        .map(field => {
          const value = this.getNestedValue(item, field);
          return this.escapeCSVField(String(value ?? ''));
        })
        .join(',');
    });

    return [header, ...rows].join('\n');
  }

  /**
   * Export array of objects to JSON
   */
  static toJSON<T extends Record<string, any>>(
    data: T[],
    options: Partial<ExportOptions> = {}
  ): string {
    const fields = options.fields;
    
    if (fields) {
      const filtered = data.map(item => {
        const obj: Record<string, any> = {};
        fields.forEach(field => {
          obj[field] = this.getNestedValue(item, field);
        });
        return obj;
      });
      return JSON.stringify(filtered, null, 2);
    }

    return JSON.stringify(data, null, 2);
  }

  /**
   * Export array of objects to TSV (Tab-Separated Values)
   */
  static toTSV<T extends Record<string, any>>(
    data: T[],
    options: Partial<ExportOptions> = {}
  ): string {
    if (data.length === 0) return '';

    const fields = options.fields || Object.keys(data[0]);
    
    // TSV header
    const header = fields.join('\t');

    // TSV rows
    const rows = data.map(item => {
      return fields
        .map(field => {
          const value = this.getNestedValue(item, field);
          return String(value ?? '').replace(/\t/g, ' '); // Replace tabs with spaces
        })
        .join('\t');
    });

    return [header, ...rows].join('\n');
  }

  /**
   * Export data based on format option
   */
  static export<T extends Record<string, any>>(
    data: T[],
    options: ExportOptions
  ): string {
    switch (options.format) {
      case 'csv':
        return this.toCSV(data, options);
      case 'tsv':
        return this.toTSV(data, options);
      case 'json':
      default:
        return this.toJSON(data, options);
    }
  }

  /**
   * Generate download link for exported data
   */
  static generateDownloadLink(
    data: string,
    filename: string,
    mimeType: string = 'text/plain'
  ): string {
    const blob = new Blob([data], { type: mimeType });
    return URL.createObjectURL(blob);
  }

  /**
   * Escape CSV field values
   */
  private static escapeCSVField(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }

  /**
   * Get nested object value by path
   */
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  /**
   * Flatten nested objects for export
   */
  static flatten<T extends Record<string, any>>(
    data: T[],
    options: Partial<ExportOptions> = {}
  ): Record<string, any>[] {
    return data.map(item => this.flattenObject(item));
  }

  /**
   * Recursively flatten object
   */
  private static flattenObject(obj: any, prefix: string = ''): Record<string, any> {
    const flattened: Record<string, any> = {};

    Object.keys(obj).forEach(key => {
      const value = obj[key];
      const newKey = prefix ? `${prefix}_${key}` : key;

      if (
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        !(value instanceof Date)
      ) {
        Object.assign(flattened, this.flattenObject(value, newKey));
      } else if (Array.isArray(value)) {
        flattened[newKey] = value.join(';');
      } else {
        flattened[newKey] = value;
      }
    });

    return flattened;
  }

  /**
   * Parse CSV file
   */
  static parseCSV<T extends Record<string, any>>(
    csvContent: string
  ): T[] {
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = this.parseCSVLine(lines[0]);
    const data: T[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      const obj: Record<string, any> = {};

      headers.forEach((header, index) => {
        obj[header] = values[index] ?? '';
      });

      data.push(obj as T);
    }

    return data;
  }

  /**
   * Parse CSV line handling quoted fields
   */
  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  }
}

export default ExportService;
