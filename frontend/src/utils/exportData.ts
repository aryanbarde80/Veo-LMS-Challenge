/**
 * Export Data Utilities - Client-side export functionality
 */

export interface ExportOptions {
  filename?: string;
  format?: 'csv' | 'json' | 'xlsx';
}

class DataExporter {
  /**
   * Export array to CSV and trigger download
   */
  static exportCSV<T extends Record<string, any>>(
    data: T[],
    filename: string = 'export.csv'
  ): void {
    if (data.length === 0) {
      console.warn('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csv = [
      headers.map(h => this.escapeCSV(h)).join(','),
      ...data.map(row =>
        headers.map(header => this.escapeCSV(String(row[header] ?? ''))).join(',')
      ),
    ].join('\n');

    this.downloadFile(csv, filename, 'text/csv');
  }

  /**
   * Export array to JSON and trigger download
   */
  static exportJSON<T>(
    data: T[],
    filename: string = 'export.json',
    pretty: boolean = true
  ): void {
    const json = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    this.downloadFile(json, filename, 'application/json');
  }

  /**
   * Export to TSV format
   */
  static exportTSV<T extends Record<string, any>>(
    data: T[],
    filename: string = 'export.tsv'
  ): void {
    if (data.length === 0) {
      console.warn('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const tsv = [
      headers.join('\t'),
      ...data.map(row =>
        headers.map(header => String(row[header] ?? '').replace(/\t/g, ' ')).join('\t')
      ),
    ].join('\n');

    this.downloadFile(tsv, filename, 'text/tab-separated-values');
  }

  /**
   * Copy data to clipboard as JSON
   */
  static copyToClipboard<T>(data: T[], pretty: boolean = true): Promise<void> {
    const json = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    return navigator.clipboard.writeText(json);
  }

  /**
   * Print data in table format
   */
  static print<T extends Record<string, any>>(
    data: T[],
    title: string = 'Data Export'
  ): void {
    const headers = data.length > 0 ? Object.keys(data[0]) : [];
    const html = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            h1 { color: #333; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <table>
            <thead>
              <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${data
                .map(
                  row =>
                    `<tr>${headers.map(h => `<td>${row[h] ?? ''}</td>`).join('')}</tr>`
                )
                .join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
  }

  /**
   * Share data via Web Share API
   */
  static async shareData(data: any, title: string = 'Export'): Promise<void> {
    if (!navigator.share) {
      console.warn('Web Share API not supported');
      return;
    }

    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const file = new File([blob], 'export.json', { type: 'application/json' });

      await navigator.share({
        title,
        files: [file],
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  }

  /**
   * Generate report summary
   */
  static generateSummary<T extends Record<string, any>>(data: T[]): {
    totalRecords: number;
    fields: string[];
    exportedAt: string;
    exportedBy?: string;
  } {
    return {
      totalRecords: data.length,
      fields: data.length > 0 ? Object.keys(data[0]) : [],
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Escape CSV values
   */
  private static escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Trigger file download
   */
  private static downloadFile(
    content: string,
    filename: string,
    mimeType: string
  ): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export default DataExporter;

/**
 * React hook for export functionality
 */
export function useExport() {
  const exportToCSV = <T extends Record<string, any>>(
    data: T[],
    filename?: string
  ) => {
    DataExporter.exportCSV(data, filename);
  };

  const exportToJSON = <T>(
    data: T[],
    filename?: string,
    pretty?: boolean
  ) => {
    DataExporter.exportJSON(data, filename, pretty);
  };

  const exportToTSV = <T extends Record<string, any>>(
    data: T[],
    filename?: string
  ) => {
    DataExporter.exportTSV(data, filename);
  };

  return {
    exportToCSV,
    exportToJSON,
    exportToTSV,
    copyToClipboard: DataExporter.copyToClipboard,
    print: DataExporter.print,
  };
}
