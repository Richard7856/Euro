/**
 * Exportar datos a XML o PDF (vía impresión).
 */

function escapeXml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Convierte un array de objetos a XML. */
export function exportToXML(
  rows: Record<string, unknown>[],
  options: { rootTag?: string; itemTag?: string } = {}
): string {
  const rootTag = options.rootTag ?? 'datos';
  const itemTag = options.itemTag ?? 'item';
  const parts = rows.map((row) => {
    const fields = Object.entries(row)
      .map(([k, v]) => {
        const val = v == null ? '' : escapeXml(String(v));
        return `<${k}>${val}</${k}>`;
      })
      .join('');
    return `<${itemTag}>${fields}</${itemTag}>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<${rootTag}>\n${parts.join('\n')}\n</${rootTag}>`;
}

/** Descarga un string como archivo. */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Exporta la tabla a XML y descarga. */
export function downloadXML(
  rows: Record<string, unknown>[],
  filenameBase: string,
  options?: { rootTag?: string; itemTag?: string }
): void {
  const xml = exportToXML(rows, options);
  const filename = `${filenameBase}_${new Date().toISOString().slice(0, 10)}.xml`;
  downloadFile(xml, filename, 'application/xml');
}

/**
 * Abre una ventana de impresión con la tabla (el usuario puede elegir "Guardar como PDF").
 */
export function exportToPDF(title: string, headers: string[], rows: string[][]): void {
  const thead = headers.map((h) => `<th style="border:1px solid #333;padding:6px 8px;text-align:left;">${escapeHtml(h)}</th>`).join('');
  const tbody = rows
    .map(
      (row) =>
        `<tr>${row.map((c) => `<td style="border:1px solid #333;padding:6px 8px;">${escapeHtml(String(c))}</td>`).join('')}</tr>`
    )
    .join('');
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 16px; color: #111; }
    table { border-collapse: collapse; width: 100%; font-size: 12px; }
    th { background: #1e293b; color: #f1f5f9; }
  </style>
</head>
<body>
  <h1 style="margin-bottom:12px;">${escapeHtml(title)}</h1>
  <p style="color:#64748b;font-size:12px;">${new Date().toLocaleString('es-MX')}</p>
  <table>
    <thead><tr>${thead}</tr></thead>
    <tbody>${tbody}</tbody>
  </table>
</body>
</html>`;
  const w = window.open('', '_blank');
  if (!w) {
    alert('Permite ventanas emergentes para exportar a PDF.');
    return;
  }
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => {
    w.print();
  }, 250);
}

function escapeHtml(s: string): string {
  const div = typeof document !== 'undefined' ? document.createElement('div') : null;
  if (!div) return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  div.textContent = s;
  return div.innerHTML;
}
