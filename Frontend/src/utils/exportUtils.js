/**
 * Data Export & Print Utilities (CSV Export & Printable Summary Window)
 */

export function exportToCSV(rows = [], columns = [], filename = 'export.csv') {
  if (!Array.isArray(rows) || rows.length === 0) {
    return false;
  }

  const headers = columns.map((col) => `"${String(col.header || col.label || col.key).replace(/"/g, '""')}"`);
  const csvLines = [headers.join(',')];

  rows.forEach((row) => {
    const values = columns.map((col) => {
      let rawVal = typeof col.exportAccessor === 'function'
        ? col.exportAccessor(row)
        : typeof col.accessor === 'function'
        ? col.accessor(row)
        : row?.[col.key];

      if (rawVal === null || rawVal === undefined) rawVal = '';
      if (Array.isArray(rawVal)) rawVal = rawVal.join('; ');
      if (typeof rawVal === 'object') rawVal = JSON.stringify(rawVal);

      const escaped = String(rawVal).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvLines.push(values.join(','));
  });

  const csvString = '\uFEFF' + csvLines.join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}

export function printDocumentSummary(title, subtitle, sections = []) {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    window.print();
    return;
  }

  const sectionHtml = sections
    .map(
      (sec) => `
      <div style="margin-bottom: 20px; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px;">
        <h3 style="margin: 0 0 12px 0; color: #0F766E; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #CCFBF1; padding-bottom: 6px;">
          ${sec.heading}
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tbody>
            ${(sec.rows || [])
              .map(
                ([label, value]) => `
              <tr>
                <td style="padding: 6px 8px; color: #64748B; width: 40%; border-bottom: 1px solid #F1F5F9;">${label}</td>
                <td style="padding: 6px 8px; color: #0F172A; font-weight: 600; border-bottom: 1px solid #F1F5F9;">${value ?? '—'}</td>
              </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>`
    )
    .join('');

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${title} - Sri Lakshmi Venkata Ratnam Agri Commodities ERP</title>
        <style>
          body { font-family: 'Segoe UI', Roboto, sans-serif; color: #0F172A; margin: 32px; background: #FFFFFF; }
          .header { border-bottom: 3px solid #0F766E; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
          .brand { color: #0F766E; font-size: 20px; font-weight: 700; }
          .sub { color: #64748B; font-size: 13px; margin-top: 4px; }
          .badge { background: #CCFBF1; color: #0F766E; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">SriRayalaseema Agri Commodities & Processing Pvt. Ltd.</div>
            <div class="sub">Kurnool Main Branch • GSTIN: 37AABCS1429B1Z5 • APMC License: AP-KNL-4491</div>
          </div>
          <div class="badge">OFFICIAL ERP VOUCHER</div>
        </div>
        <h2 style="margin: 0 0 4px 0; color: #0F172A;">${title}</h2>
        <p style="margin: 0 0 20px 0; color: #64748B; font-size: 13px;">${subtitle}</p>
        ${sectionHtml}
        <div style="margin-top: 40px; display: flex; justify-content: space-between; font-size: 12px; color: #64748B; border-top: 1px solid #E2E8F0; padding-top: 16px;">
          <span>Generated on: ${new Date().toLocaleString('en-IN')}</span>
          <span>Authorized Signatory • Vendor ERP Portal</span>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
}

